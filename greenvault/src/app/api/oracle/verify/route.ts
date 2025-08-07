// src/app/api/oracle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Initialize Sui client for oracle interactions
const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet' || 'devnet'),
});

const PACKAGE_ID = process.env.SUI_PACKAGE_ID || '0x0';
const OASIS_API_URL = process.env.OASIS_API_URL || 'https://api.oasis.example.com';
const OASIS_API_KEY = process.env.OASIS_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data, privateKey } = body;

    switch (action) {
      case 'request_verification':
        return await requestCO2Verification(data, privateKey);
      
      case 'submit_oracle_data':
        return await submitOracleVerification(data, privateKey);
      
      case 'register_oracle':
        return await registerOracle(data, privateKey);
      
      case 'update_data_feed':
        return await updateDataFeed(data, privateKey);
      
      case 'get_verification_status':
        return await getVerificationStatus(data.requestId);
      
      case 'fetch_external_data':
        return await fetchExternalCO2Data(data);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Oracle API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Request CO2 verification from oracle
async function requestCO2Verification(data: any, privateKey: string) {
  const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::request_co2_verification`,
    arguments: [
      tx.pure.string(data.projectId),
      tx.pure.string(data.measurementType),
      tx.pure.u64(data.value),
      tx.pure.string(data.unit),
      tx.pure.vector('u8', Array.from(Buffer.from(data.locationHash, 'hex'))),
      tx.pure.string(data.methodology),
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

// Submit oracle verification data
async function submitOracleVerification(data: any, privateKey: string) {
  const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
  const tx = new Transaction();

  const oracleRegistryId = process.env.ORACLE_REGISTRY_ID || '0x3';

  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::submit_oracle_verification`,
    arguments: [
      tx.object(oracleRegistryId),
      tx.object(data.requestId),
      tx.pure.u64(data.verifiedValue),
      tx.pure.u64(data.confidence),
      tx.pure.vector('u8', Array.from(Buffer.from(data.evidenceHash, 'hex'))),
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

// Register oracle
async function registerOracle(data: any, privateKey: string) {
  const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
  const tx = new Transaction();

  const oracleRegistryId = process.env.ORACLE_REGISTRY_ID || '0x3';

  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::register_oracle`,
    arguments: [
      tx.object(oracleRegistryId),
      tx.pure.address(data.oracleAddress),
      tx.pure.u64(data.stakeAmount),
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

// Update data feed
async function updateDataFeed(data: any, privateKey: string) {
  const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
  const tx = new Transaction();

  const oracleRegistryId = process.env.ORACLE_REGISTRY_ID || '0x3';

  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::update_data_feed`,
    arguments: [
      tx.object(oracleRegistryId),
      tx.pure.string(data.feedId),
      tx.pure.u8(data.dataType),
      tx.pure.u64(data.value),
      tx.pure.vector('u8', Array.from(Buffer.from(data.sourceHash, 'hex'))),
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

// Get verification status
async function getVerificationStatus(requestId: string) {
  try {
    const request = await suiClient.getObject({
      id: requestId,
      options: { showContent: true },
    });

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get verification status',
    });
  }
}

// Fetch external CO2 data from Oasis or other sources
async function fetchExternalCO2Data(data: any) {
  try {
    // Example: Fetch from Verra registry (mock implementation)
    if (data.source === 'verra') {
      const mockVerraData = {
        projectId: data.projectId,
        co2Sequestered: Math.random() * 1000, // Mock data
        verificationDate: new Date().toISOString(),
        methodology: 'VCS-v4.0',
        vintage: 2024,
        status: 'verified',
      };

      return NextResponse.json({
        success: true,
        data: mockVerraData,
        source: 'verra',
      });
    }

    // Example: Fetch from Gold Standard (mock implementation)
    if (data.source === 'gold_standard') {
      const mockGoldStandardData = {
        projectId: data.projectId,
        emissionReductions: Math.random() * 800,
        verificationDate: new Date().toISOString(),
        methodology: 'GS-v1.2',
        vintage: 2024,
        status: 'verified',
      };

      return NextResponse.json({
        success: true,
        data: mockGoldStandardData,
        source: 'gold_standard',
      });
    }

    // Example: Fetch from Oasis API (if integrated)
    if (data.source === 'oasis' && OASIS_API_URL && OASIS_API_KEY) {
      const response = await fetch(`${OASIS_API_URL}/verify-co2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OASIS_API_KEY}`,
        },
        body: JSON.stringify({
          projectId: data.projectId,
          dataType: data.dataType,
          location: data.location,
        }),
      });

      if (!response.ok) {
        throw new Error(`Oasis API error: ${response.statusText}`);
      }

      const oasisData = await response.json();

      return NextResponse.json({
        success: true,
        data: oasisData,
        source: 'oasis',
      });
    }

    // Satellite data (mock implementation)
    if (data.source === 'satellite') {
      const mockSatelliteData = {
        projectId: data.projectId,
        forestCoverage: Math.random() * 100,
        co2Absorption: Math.random() * 500,
        measurementDate: new Date().toISOString(),
        satellite: 'Landsat-8',
        resolution: '30m',
        confidence: 95,
      };

      return NextResponse.json({
        success: true,
        data: mockSatelliteData,
        source: 'satellite',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unsupported data source',
    });

  } catch (error) {
    console.error('Error fetching external CO2 data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch external data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'data_feeds':
        return await getDataFeeds();
      
      case 'oracle_stats':
        return await getOracleStats();
      
      case 'pending_verifications':
        return await getPendingVerifications();

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Oracle GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getDataFeeds() {
  try {
    const oracleRegistryId = process.env.ORACLE_REGISTRY_ID || '0x3';
    
    const registry = await suiClient.getObject({
      id: oracleRegistryId,
      options: { showContent: true },
    });

    return NextResponse.json({
      success: true,
      registry,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get data feeds',
    });
  }
}

async function getOracleStats() {
  try {
    const oracleRegistryId = process.env.ORACLE_REGISTRY_ID || '0x3';
    
    const registry = await suiClient.getObject({
      id: oracleRegistryId,
      options: { showContent: true },
    });

    // Mock statistics for demonstration
    const stats = {
      totalOracles: 5,
      activeOracles: 4,
      totalVerifications: 127,
      averageConfidence: 96.5,
      dataFeeds: [
        { id: 'co2_emissions_feed', value: 450, timestamp: Date.now() },
        { id: 'forest_coverage_feed', value: 75.3, timestamp: Date.now() },
        { id: 'renewable_energy_feed', value: 1250, timestamp: Date.now() },
      ],
    };

    return NextResponse.json({
      success: true,
      stats,
      registry,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get oracle stats',
    });
  }
}

async function getPendingVerifications() {
  try {
    // In a real implementation, you would query for pending verification requests
    // For now, return mock data
    const pendingVerifications = [
      {
        id: '0x123',
        projectId: 'PROJ001',
        measurementType: 'co2_sequestered',
        value: 1000,
        status: 'pending',
        requiredConfirmations: 3,
        currentConfirmations: 1,
      },
      {
        id: '0x456',
        projectId: 'PROJ002',
        measurementType: 'renewable_energy',
        value: 2500,
        status: 'pending',
        requiredConfirmations: 3,
        currentConfirmations: 2,
      },
    ];

    return NextResponse.json({
      success: true,
      pendingVerifications,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get pending verifications',
    });
  }
}
