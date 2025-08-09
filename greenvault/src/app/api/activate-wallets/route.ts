import { NextRequest, NextResponse } from 'next/server';
import { generateWallet, restoreWalletFromPrivateKey } from '@/lib/walletUtils';
import { verifyToken } from '@/lib/auth';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import fs from 'fs/promises';
import fsSync from 'fs';
function loadLegacyUser(email: string) {
  try {
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const raw = fsSync.readFileSync(usersPath, 'utf-8');
    const data = JSON.parse(raw);
    return data[email];
  } catch {
    return undefined;
  }
}
import path from 'path';

const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet') || 'devnet';
const FAUCET_URL = process.env.NEXT_PUBLIC_SUI_FAUCET_URL || 'https://faucet.devnet.sui.io/gas';

interface UserWalletData {
  userId: string;
  email: string;
  address?: string;
  userAddress?: string;
  privateKey?: string;
  publicKey?: string;
  isActivated: boolean;
  balance: number;
  activatedAt?: string;
  lastChecked: string;
}

const USERS_DB_PATH = path.join(process.cwd(), 'data', 'all_users.json');

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadUsersDB(): Promise<{ [key: string]: UserWalletData }> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(USERS_DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    // If file is array, convert to object keyed by userId
    if (Array.isArray(parsed)) {
      const obj: { [key: string]: UserWalletData } = {};
      for (const user of parsed) {
        obj[user.userId || user.email] = user;
      }
      await saveUsersDB(obj);
      return obj;
    }
    return {};
  } catch (error) {
    console.log('[loadUsersDB] File does not exist or parse error, returning empty object:', error);
    return {};
  }
}

async function saveUsersDB(users: { [key: string]: UserWalletData }): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(USERS_DB_PATH, JSON.stringify(users, null, 2));
}

async function requestSuiFromFaucet(address: string): Promise<boolean> {
  try {
    // Sui devnet faucet expects POST to /v1 with { recipient: address }
    const response = await fetch(FAUCET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient: address }),
    });

    if (!response.ok) {
      console.warn(`Faucet request failed with status: ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log('Faucet response:', result);

    // Success if result has a non-empty array of transferredGasObjects or transactionDigest
    if (result && result.transferredGasObjects && result.transferredGasObjects.length > 0) {
      console.log('Faucet funding successful:', result.transferredGasObjects);
      return true;
    }
    if (result && result.error) {
      console.warn('Faucet error:', result.error);
      return false;
    }
    if (result && result.transactionDigest) {
      console.log('Faucet transaction digest:', result.transactionDigest);
      return true;
    }
    console.warn('Faucet response did not confirm funding:', result);
    return false;
  } catch (error) {
    console.error('Error requesting from faucet:', error);
    return false;
  }
}

function isValidSuiAddress(address: string): boolean {
  // Sui addresses are 0x-prefixed and 40-64 hex chars (without 0x)
  return /^0x[a-fA-F0-9]{40,64}$/.test(address);
}

async function checkWalletBalance(address: string): Promise<number> {
  if (!isValidSuiAddress(address)) {
    console.error('Error checking wallet balance: Invalid Sui address', address);
    return 0;
  }
  try {
    const suiClient = new SuiClient({
      url: getFullnodeUrl(NETWORK),
    });

    const balance = await suiClient.getBalance({
      owner: address,
    });

    return parseInt(balance.totalBalance) / 1_000_000_000; // Convert from MIST to SUI
  } catch (error) {
    console.error('Error checking wallet balance:', error);
    return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, userId } = body;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const users = await loadUsersDB();
    let userKey = userId || email;
    let userWallet = users[userKey];

    // If not found in all_users.json, try to migrate from users.json (email login)
    if (!userWallet && email) {
      const legacy = loadLegacyUser(email);
      if (legacy) {
        userWallet = {
          userId: legacy.id,
          email: legacy.email,
          address: legacy.walletAddress,
          privateKey: legacy.walletPrivateKey,
          publicKey: undefined,
          isActivated: false,
          balance: 0,
          activatedAt: undefined,
          lastChecked: new Date().toISOString(),
        };
        users[userKey] = userWallet;
        await saveUsersDB(users);
      }
    }

    switch (action) {
      case 'activate': {
        if (!userWallet) {
          // Generate new wallet
          const walletData = generateWallet(email, userId);
          userWallet = {
            userId,
            email,
            address: walletData.address,
            privateKey: walletData.privateKey,
            publicKey: walletData.publicKey,
            isActivated: false,
            balance: 0,
            lastChecked: new Date().toISOString(),
          };
          users[userKey] = userWallet;
        }

  // Check current balance
  const walletAddr = userWallet.address || userWallet.userAddress;
  const currentBalance = await checkWalletBalance(walletAddr || '');
  userWallet.balance = currentBalance;

        // If balance is zero or low, always request from faucet and retry activation
        if (currentBalance < 0.01) {
          console.log(`Requesting SUI from faucet for address: ${walletAddr}`);
          const faucetSuccess = await requestSuiFromFaucet(walletAddr || '');
          if (faucetSuccess) {
            // Wait a bit for the transaction to process
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Check balance again
            const newBalance = await checkWalletBalance(walletAddr || '');
            userWallet.balance = newBalance;
            // Mark as activated if new balance is sufficient
            if (userWallet.balance >= 0.01) {
              userWallet.isActivated = true;
              userWallet.activatedAt = new Date().toISOString();
            }
          }
        }

        // Mark as activated if has sufficient balance
        if (userWallet.balance >= 0.01) {
          userWallet.isActivated = true;
          userWallet.activatedAt = new Date().toISOString();
        }

        userWallet.lastChecked = new Date().toISOString();
  await saveUsersDB(users);

        return NextResponse.json({
          success: true,
          wallet: {
            address: userWallet.address,
            userAddress: userWallet.userAddress,
            publicKey: userWallet.publicKey,
            isActivated: userWallet.isActivated,
            balance: userWallet.balance,
            activatedAt: userWallet.activatedAt,
          },
          message: userWallet.isActivated 
            ? 'Wallet activated successfully!' 
            : 'Wallet created, but activation pending. Please try again in a few moments.',
        });
      }

      case 'status': {
        if (!userWallet) {
          return NextResponse.json({
            success: true,
            wallet: null,
            message: 'No wallet found for this user',
          });
        }

        // Update balance
  const currentBalance = await checkWalletBalance(userWallet.address || userWallet.userAddress || '');
        userWallet.balance = currentBalance;
        userWallet.lastChecked = new Date().toISOString();

        // Update activation status based on balance
        if (currentBalance >= 0.01 && !userWallet.isActivated) {
          userWallet.isActivated = true;
          userWallet.activatedAt = new Date().toISOString();
        }

        await saveUsersDB(users);

        return NextResponse.json({
          success: true,
          wallet: {
            address: userWallet.address,
            userAddress: userWallet.userAddress,
            publicKey: userWallet.publicKey,
            isActivated: userWallet.isActivated,
            balance: userWallet.balance,
            activatedAt: userWallet.activatedAt,
            lastChecked: userWallet.lastChecked,
          },
          message: 'Wallet status retrieved successfully',
        });
      }

      case 'refresh': {
        if (!userWallet) {
          return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // Force refresh balance
  const currentBalance = await checkWalletBalance(userWallet.address || userWallet.userAddress || '');
        userWallet.balance = currentBalance;
        userWallet.lastChecked = new Date().toISOString();

        // Update activation status
        if (currentBalance >= 0.01 && !userWallet.isActivated) {
          userWallet.isActivated = true;
          userWallet.activatedAt = new Date().toISOString();
        } else if (currentBalance < 0.01) {
          userWallet.isActivated = false;
          delete userWallet.activatedAt;
        }

        await saveUsersDB(users);

        return NextResponse.json({
          success: true,
          wallet: {
            address: userWallet.address,
            userAddress: userWallet.userAddress,
            publicKey: userWallet.publicKey,
            isActivated: userWallet.isActivated,
            balance: userWallet.balance,
            activatedAt: userWallet.activatedAt,
            lastChecked: userWallet.lastChecked,
          },
          message: 'Wallet status refreshed successfully',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Wallet activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from query params or auth token
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    console.log('[GET] Request params:', { userId, email });

    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID or email required' }, { status: 400 });
    }

  const users = await loadUsersDB();
  let userKey = userId || email || '';
  let userWallet = users[userKey];

  // If not found in all_users.json, try to migrate from users.json (email login)
  if (!userWallet && email) {
    const legacy = loadLegacyUser(email);
    if (legacy) {
      userWallet = {
        userId: legacy.id,
        email: legacy.email,
        address: legacy.walletAddress,
        privateKey: legacy.walletPrivateKey,
        publicKey: undefined,
        isActivated: false,
        balance: 0,
        activatedAt: undefined,
        lastChecked: new Date().toISOString(),
      };
      users[userKey] = userWallet;
      await saveUsersDB(users);
    }
  }

  console.log('[GET] Found user wallet:', !!userWallet);

  if (!userWallet) {
    return NextResponse.json({
      success: true,
      wallet: null,
      message: 'No wallet found for this user',
    });
  }

    // Update balance if last check was more than 5 minutes ago
    const lastCheck = new Date(userWallet.lastChecked);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (lastCheck < fiveMinutesAgo) {
  const currentBalance = await checkWalletBalance(userWallet.address || userWallet.userAddress || '');
      userWallet.balance = currentBalance;
      userWallet.lastChecked = new Date().toISOString();

      if (currentBalance >= 0.01 && !userWallet.isActivated) {
        userWallet.isActivated = true;
        userWallet.activatedAt = new Date().toISOString();
      }

      await saveUsersDB(users);
    }

    return NextResponse.json({
      success: true,
      wallet: {
        address: userWallet.address,
        userAddress: userWallet.userAddress,
        publicKey: userWallet.publicKey,
        isActivated: userWallet.isActivated,
        balance: userWallet.balance,
        activatedAt: userWallet.activatedAt,
        lastChecked: userWallet.lastChecked,
      },
      message: 'Wallet status retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting wallet status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
