import { NextResponse } from 'next/server';
import { suiZkLoginClient } from '@/lib/zklogin/sui-zklogin';

export async function POST() {
  try {
    console.log('[pre-login] Starting pre-login data generation...');
    
    const preLoginData = await suiZkLoginClient.generatePreLoginData();
    
    console.log('[pre-login] Pre-login data generated successfully:', {
      hasEphemeralKeyPair: !!preLoginData.ephemeralKeyPair,
      maxEpoch: preLoginData.maxEpoch,
      hasNonce: !!preLoginData.nonce,
      hasRandomness: !!preLoginData.randomness
    });
    
    return NextResponse.json({
      success: true,
      data: preLoginData,
    });
  } catch (error) {
    console.error('[pre-login] Pre-login data generation error:', error);
    console.error('[pre-login] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate pre-login data',
      },
      { status: 500 }
    );
  }
}
