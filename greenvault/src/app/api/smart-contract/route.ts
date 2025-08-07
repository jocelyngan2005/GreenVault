// src/app/api/smart-contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Initialize Sui client
const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet' || 'devnet'),
});

// Contract package ID (set after deployment)
const PACKAGE_ID = process.env.SUI_PACKAGE_ID || '0x0';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data, privateKey } = body;

    // Create keypair from private key
    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));

    switch (action) {
      case 'register_project':
        return await registerProject(data, keypair);
      
      case 'mint_credit':
        return await mintCarbonCredit(data, keypair);
      
      case 'list_credit':
        return await listCreditForSale(data, keypair);
      
      case 'buy_credit':
        return await buyCarbonCredit(data, keypair);
      
      case 'retire_credit':
        return await retireCarbonCredit(data, keypair);
      
      case 'verify_project':
        return await verifyProject(data, keypair);
      
      case 'add_issuer':
        return await addVerifiedIssuer(data, keypair);

      case 'get_stats':
        return await getStats();

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Smart contract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function registerProject(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  // For demo purposes - in production, get actual shared object IDs
  const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::register_project`,
    arguments: [
      tx.object(registryId),
      tx.pure.string(data.projectId),
      tx.pure.string(data.name),
      tx.pure.string(data.description),
      tx.pure.string(data.location),
      tx.pure.u8(data.projectType),
      tx.pure.u64(data.co2ReductionCapacity),
      tx.pure.option('string', data.beneficiaryCommunity),
      tx.pure.string(data.oracleDataSource),
      tx.pure.option('string', data.didAnchor),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function mintCarbonCredit(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::mint_carbon_credit`,
    arguments: [
      tx.object(registryId),
      tx.pure.string(data.projectId),
      tx.pure.string(data.serialNumber),
      tx.pure.u16(data.vintageYear),
      tx.pure.u64(data.quantity),
      tx.pure.string(data.methodology),
      tx.pure.string(data.metadataUri),
      tx.pure.vector('u8', Array.from(Buffer.from(data.co2DataHash, 'hex'))),
      tx.pure.option('string', data.didAnchor),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
    objectChanges: result.objectChanges,
  });
}

async function listCreditForSale(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  const marketplaceId = process.env.MARKETPLACE_ID || '0x2';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::list_credit_for_sale`,
    arguments: [
      tx.object(marketplaceId),
      tx.object(data.creditId),
      tx.pure.u64(data.price),
      tx.pure.bool(data.reservedForCommunity),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function buyCarbonCredit(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  const marketplaceId = process.env.MARKETPLACE_ID || '0x2';
  const [paymentCoin] = tx.splitCoins(tx.gas, [data.paymentAmount]);

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::buy_credit`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(data.creditId),
      paymentCoin,
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function retireCarbonCredit(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::retire_credit`,
    arguments: [
      tx.object(registryId),
      tx.object(data.creditId),
      tx.pure.string(data.retirementReason),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function verifyProject(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::verify_project`,
    arguments: [
      tx.object(registryId),
      tx.pure.string(data.projectId),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function addVerifiedIssuer(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::add_verified_issuer`,
    arguments: [
      tx.object(registryId),
      tx.pure.address(data.issuerAddress),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function getStats() {
  try {
    // Get marketplace stats
    const marketplaceId = process.env.MARKETPLACE_ID || '0x2';
    const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

    const [marketplace, registry] = await Promise.all([
      suiClient.getObject({
        id: marketplaceId,
        options: { showContent: true },
      }),
      suiClient.getObject({
        id: registryId,
        options: { showContent: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      marketplace,
      registry,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get stats',
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get('address');

    if (userAddress) {
      // Get user's carbon credits
      const objects = await suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${PACKAGE_ID}::carbon_credit::CarbonCredit`,
        },
        options: {
          showType: true,
          showContent: true,
        },
      });

      return NextResponse.json({
        success: true,
        credits: objects.data,
      });
    }

    // Return general stats
    return await getStats();
  } catch (error) {
    console.error('Smart contract GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
