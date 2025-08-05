import { NextRequest, NextResponse } from 'next/server';
import { suiZkLoginClient } from '@/lib/sui-zklogin';
import type { ZkLoginData } from '@/types/zklogin';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting authentication process...');
    
    const body = await request.json();
    const { idToken, preLoginData, userSalt } = body;

    if (!idToken || !preLoginData || !userSalt) {
      console.error('Missing required parameters:', {
        hasIdToken: !!idToken,
        hasPreLoginData: !!preLoginData,
        hasUserSalt: !!userSalt
      });
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('All required parameters present:', { 
      hasIdToken: !!idToken, 
      hasPreLoginData: !!preLoginData, 
      hasUserSalt: !!userSalt 
    });

    // Decode JWT
    console.log('Decoding JWT...');
    const decodedJwt = suiZkLoginClient.decodeJWT(idToken);
    console.log('JWT decoded successfully:', { 
      sub: decodedJwt.sub, 
      iss: decodedJwt.iss,
      email: decodedJwt.email
    });

    // Generate user address
    console.log('Generating user address with salt:', userSalt);
    const zkLoginUserAddress = suiZkLoginClient.generateUserAddress(idToken, userSalt);
    console.log('User address generated:', zkLoginUserAddress);

    // Get extended ephemeral public key
    console.log('Getting extended ephemeral public key...');
    const extendedEphemeralPublicKey = suiZkLoginClient.getExtendedEphemeralPublicKey(
      preLoginData.ephemeralKeyPair.publicKey
    );
    console.log('Extended ephemeral public key generated');

    // Get ZK proof from prover service
    console.log('Requesting ZK proof from prover...');
    const zkProof = await suiZkLoginClient.requestZkProof({
      jwt: idToken,
      extendedEphemeralPublicKey,
      maxEpoch: preLoginData.maxEpoch,
      jwtRandomness: preLoginData.randomness,
      salt: userSalt,
      keyClaimName: 'sub',
    });
    console.log('ZK proof received from prover');

    // Create zkLogin data object
    console.log('Creating zkLogin data object...');
    const zkLoginData: ZkLoginData = {
      userAddress: zkLoginUserAddress,
      zkProof,
      ephemeralKeyPair: preLoginData.ephemeralKeyPair,
      maxEpoch: preLoginData.maxEpoch,
      randomness: preLoginData.randomness,
      userSalt,
      jwt: idToken,
      decodedJwt,
    };

    console.log('Wallet address:', zkLoginUserAddress);
    console.log('zkLogin authentication completed successfully!');

    return NextResponse.json({
      success: true,
      data: zkLoginData,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 500 }
    );
  }
}
