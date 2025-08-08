// src/app/api/oasis/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { oasisClient } from '@/lib/oasis-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return await getOasisStatus();
      
      case 'network':
        return await getNetworkInfo();
      
      case 'balance':
        const address = searchParams.get('address');
        return await getBalance(address);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Oasis test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'query_contract':
        return await queryContract(data);
      
      case 'submit_data':
        return await submitData(data);
      
      case 'test_connection':
        return await testConnection();
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Oasis test POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getOasisStatus() {
  const networkInfo = await oasisClient.getNetworkInfo();
  const balance = await oasisClient.getAccountBalance();

  return NextResponse.json({
    success: true,
    status: 'connected',
    network: networkInfo.success ? networkInfo.data : null,
    account: balance.success ? balance.data : null,
    timestamp: new Date().toISOString(),
    configuration: {
      rpcUrl: process.env.OASIS_RPC_URL || 'Not configured',
      contractAddress: process.env.OASIS_CONTRACT_ADDRESS || 'Not configured',
      hasPrivateKey: !!process.env.OASIS_PRIVATE_KEY
    }
  });
}

async function getNetworkInfo() {
  const result = await oasisClient.getNetworkInfo();
  return NextResponse.json(result);
}

async function getBalance(address?: string | null) {
  const result = await oasisClient.getAccountBalance(address || undefined);
  return NextResponse.json(result);
}

async function queryContract(data: any) {
  if (!data.projectId) {
    return NextResponse.json({
      success: false,
      error: 'Project ID required'
    });
  }

  const result = await oasisClient.getCO2DataFromContract(data.projectId);
  return NextResponse.json(result);
}

async function submitData(data: any) {
  if (!data.projectId || !data.co2Amount) {
    return NextResponse.json({
      success: false,
      error: 'Project ID and CO2 amount required'
    });
  }

  const dataHash = '0x' + require('crypto')
    .createHash('sha256')
    .update(JSON.stringify({ projectId: data.projectId, co2Amount: data.co2Amount, timestamp: Date.now() }))
    .digest('hex');

  const result = await oasisClient.submitCO2Data(data.projectId, data.co2Amount, dataHash);
  return NextResponse.json(result);
}

async function testConnection() {
  const tests = {
    network: await oasisClient.getNetworkInfo(),
    balance: await oasisClient.getAccountBalance(),
  };

  const allPassed = Object.values(tests).every(test => test.success);

  return NextResponse.json({
    success: allPassed,
    message: allPassed ? 'All Oasis connection tests passed' : 'Some tests failed',
    tests,
    timestamp: new Date().toISOString()
  });
}
