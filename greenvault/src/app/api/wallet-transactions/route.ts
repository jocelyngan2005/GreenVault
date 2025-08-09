import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { walletIntegratedSuiClient } from '@/lib/walletSuiIntegration';
import fs from 'fs/promises';
import path from 'path';

const USERS_DB_PATH = path.join(process.cwd(), 'data', 'users.json');

interface UserWalletData {
  userId: string;
  email: string;
  address: string;
  privateKey: string;
  publicKey: string;
  isActivated: boolean;
  balance: number;
  activatedAt?: string;
  lastChecked: string;
}

async function loadUsersDB(): Promise<UserWalletData[]> {
  try {
    const data = await fs.readFile(USERS_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, creditId, paymentAmountSui, creditData } = body;

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

    // Load user wallet data
    const users = await loadUsersDB();
    const userWallet = users.find(u => u.userId === userId);
    
    if (!userWallet) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 404 });
    }

    if (!userWallet.isActivated) {
      return NextResponse.json({ error: 'Wallet not activated' }, { status: 400 });
    }

    switch (action) {
      case 'purchase': {
        if (!creditId || !paymentAmountSui) {
          return NextResponse.json({ 
            error: 'Credit ID and payment amount are required' 
          }, { status: 400 });
        }

        console.log('Processing purchase:', {
          userId,
          creditId,
          paymentAmountSui,
          walletAddress: userWallet.address
        });

        const result = await walletIntegratedSuiClient.purchaseCarbonCredit(
          userWallet.privateKey,
          creditId,
          paymentAmountSui
        );

        if (result.success) {
          return NextResponse.json({
            success: true,
            txDigest: result.txDigest,
            message: 'Carbon credit purchased successfully!',
            events: result.events,
          });
        } else {
          return NextResponse.json({
            success: false,
            error: result.error || 'Purchase failed',
          }, { status: 400 });
        }
      }

      case 'list': {
        if (!creditData) {
          return NextResponse.json({ 
            error: 'Credit data is required for listing' 
          }, { status: 400 });
        }

        console.log('Processing credit listing:', {
          userId,
          creditData,
          walletAddress: userWallet.address
        });

        const result = await walletIntegratedSuiClient.listCarbonCredit(
          userWallet.privateKey,
          creditData
        );

        if (result.success) {
          return NextResponse.json({
            success: true,
            txDigest: result.txDigest,
            message: 'Carbon credit listed successfully!',
            events: result.events,
          });
        } else {
          return NextResponse.json({
            success: false,
            error: result.error || 'Listing failed',
          }, { status: 400 });
        }
      }

      case 'balance': {
        const balanceInfo = await walletIntegratedSuiClient.checkBalance(userWallet.address);
        
        return NextResponse.json({
          success: true,
          balance: balanceInfo.balance,
          formattedBalance: balanceInfo.formattedBalance,
          hasBalance: balanceInfo.hasBalance,
          address: userWallet.address,
        });
      }

      case 'my-credits': {
        const credits = await walletIntegratedSuiClient.getUserCarbonCredits(userWallet.address);
        
        return NextResponse.json({
          success: true,
          credits,
          count: credits.length,
        });
      }

      case 'transaction-history': {
        const limit = body.limit || 10;
        const transactions = await walletIntegratedSuiClient.getTransactionHistory(
          userWallet.address, 
          limit
        );
        
        return NextResponse.json({
          success: true,
          transactions,
          count: transactions.length,
        });
      }

      case 'estimate-gas': {
        const transactionType = body.transactionType || 'buy';
        const gasEstimate = await walletIntegratedSuiClient.estimateGasCost(
          userWallet.privateKey,
          transactionType
        );
        
        return NextResponse.json({
          success: true,
          ...gasEstimate,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Wallet transaction error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') || 'balance';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Load user wallet data
    const users = await loadUsersDB();
    const userWallet = users.find(u => u.userId === userId);
    
    if (!userWallet) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 404 });
    }

    switch (action) {
      case 'balance': {
        const balanceInfo = await walletIntegratedSuiClient.checkBalance(userWallet.address);
        
        return NextResponse.json({
          success: true,
          balance: balanceInfo.balance,
          formattedBalance: balanceInfo.formattedBalance,
          hasBalance: balanceInfo.hasBalance,
          address: userWallet.address,
        });
      }

      case 'my-credits': {
        const credits = await walletIntegratedSuiClient.getUserCarbonCredits(userWallet.address);
        
        return NextResponse.json({
          success: true,
          credits,
          count: credits.length,
        });
      }

      case 'transactions': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const transactions = await walletIntegratedSuiClient.getTransactionHistory(
          userWallet.address, 
          limit
        );
        
        return NextResponse.json({
          success: true,
          transactions,
          count: transactions.length,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
