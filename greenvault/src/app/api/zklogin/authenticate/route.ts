import { NextRequest, NextResponse } from 'next/server';
import { suiZkLoginClient } from '@/lib/zklogin/sui-zklogin';
import { didManager } from '@/lib/did/did-manager';
import { createOrUpdateZkLoginUser, findZkLoginUserBySub } from '@/lib/zklogin/unifiedUserStore';
import { WalrusUserManager, type WalrusUserData } from '@/lib/walrus/user-manager';
import type { ZkLoginData } from '@/types/zklogin';
import { initializeUserVaultSafely, generateVaultKey } from '@/lib/vault/vault-auth';


export async function POST(request: NextRequest) {
  try {
    console.log('[auth] Starting authentication process...');
    
    const body = await request.json();
    const { idToken, preLoginData, userSalt } = body;

    if (!idToken || !preLoginData || !userSalt) {
      console.error('[auth] Missing required parameters:', {
        hasIdToken: !!idToken,
        hasPreLoginData: !!preLoginData,
        hasUserSalt: !!userSalt
      });
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('[auth] All required parameters present:', { 
      hasIdToken: !!idToken, 
      hasPreLoginData: !!preLoginData, 
      hasUserSalt: !!userSalt 
    });

    // Decode JWT
    console.log('[auth] Decoding JWT...');
    const decodedJwt = suiZkLoginClient.decodeJWT(idToken);
    console.log('[auth] JWT decoded successfully:', { 
      sub: decodedJwt.sub, 
      iss: decodedJwt.iss,
      email: decodedJwt.email
    });

    // Generate user address
    console.log('[auth] Generating user address with salt:', userSalt);
    const zkLoginUserAddress = suiZkLoginClient.generateUserAddress(idToken, userSalt);
    console.log('[auth] User address generated:', zkLoginUserAddress);

    // Get extended ephemeral public key
    console.log('[auth] Getting extended ephemeral public key...');
    const extendedEphemeralPublicKey = suiZkLoginClient.getExtendedEphemeralPublicKey(
      preLoginData.ephemeralKeyPair.publicKey
    );
    console.log('[auth] Extended ephemeral public key generated');

    // Get ZK proof from prover service
    console.log('[auth] Requesting ZK proof from prover...');
    const zkProof = await suiZkLoginClient.requestZkProof({
      jwt: idToken,
      extendedEphemeralPublicKey,
      maxEpoch: preLoginData.maxEpoch,
      jwtRandomness: preLoginData.randomness,
      salt: userSalt,
      keyClaimName: 'sub',
    });
    console.log('[auth] ZK proof received from prover');

    // Create zkLogin data object
    console.log('[auth] Creating zkLogin data object...');
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

    // Check and ensure user has a DID for zkLogin
    console.log('[auth] Checking DID for zkLogin user:', decodedJwt.sub);
    let didInfo;
    let isNewDID = true;
    
    // Check if user already exists with DID
    const existingUser = findZkLoginUserBySub(decodedJwt.sub);
    
    if (existingUser && existingUser.did) {
      console.log('[auth] Existing DID found for user:', existingUser.did);
      didInfo = {
        did: existingUser.did,
        document: existingUser.didDocument
      };
      isNewDID = false;
    } else {
      console.log('[auth] Creating new DID for zkLogin user...');
      try {
        didInfo = await didManager.createOrUpdateDIDForZkLogin(zkLoginData);
        
        // Store the user with DID in unified storage
        const savedUser = createOrUpdateZkLoginUser(
          decodedJwt.sub,
          decodedJwt.email || '',
          decodedJwt.name,
          zkLoginUserAddress,
          didInfo.did,
          didInfo.document
        );

        console.log('[auth] DID created and user saved:', {
          sub: decodedJwt.sub,
          email: decodedJwt.email,
          did: didInfo.did,
          userAddress: zkLoginUserAddress,
          savedUser: !!savedUser
        });
      } catch (didError) {
        console.error('[auth] DID operation failed for zkLogin:', didError);
        // Continue with zkLogin even if DID creation fails
        console.log('[auth] Continuing zkLogin without DID due to error');
      }
    }

    console.log('[auth] Wallet address:', zkLoginUserAddress);
    console.log('[auth] zkLogin authentication completed successfully!');

    // Store user data in Walrus after successful authentication
    try {
      console.log('[auth] Starting Walrus integration for user:', decodedJwt.sub);
      
      const walrusManager = WalrusUserManager.getInstance();
      await walrusManager.initialize();
      
      // Prepare user data for Walrus storage
      const walrusUserData: WalrusUserData = {
        zkLoginData,
        didData: didInfo ? {
          did: didInfo.did,
          document: didInfo.document,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } : undefined,
        userSalt,
        metadata: {
          userId: decodedJwt.sub,
          email: decodedJwt.email,
          name: decodedJwt.name,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          version: '1.0.0'
        },
        // Set default user preferences (can be updated later)
        userRole: undefined, // Will be set in role selection
        theme: 'light',
        language: 'en'
      };

      // Use the user's salt as the encryption key (you might want to derive a separate key)
      const userEncryptionKey = userSalt;
      
      // Store the data in Walrus
      const walrusBlobId = await walrusManager.storeUserData(walrusUserData, userEncryptionKey);
      
      console.log('[auth] User data successfully stored in Walrus:', {
        userId: decodedJwt.sub,
        blobId: walrusBlobId,
        hasZkLogin: !!walrusUserData.zkLoginData,
        hasDID: !!walrusUserData.didData
      });

      // Vault will be checked/created on the frontend
      console.log('[auth] Vault will be checked on frontend for user:', decodedJwt.sub);

      // Return success response with all information
      return NextResponse.json({
        success: true,
        data: zkLoginData,
        didInfo: didInfo ? {
          did: didInfo.did,
          isNew: isNewDID,
          document: didInfo.document
        } : undefined,
        walrusInfo: {
          stored: true,
          blobId: walrusBlobId,
          timestamp: new Date().toISOString()
        }
      });      
      
    } catch (walrusError) {
      console.error('[auth] Failed to store user data in Walrus:', walrusError);
      
      // Continue without Walrus storage - don't fail the authentication
      console.log('[auth] Continuing authentication without Walrus storage');

      return NextResponse.json({
        success: true,
        data: zkLoginData,
        didInfo: didInfo ? {
          did: didInfo.did,
          isNew: isNewDID,
          document: didInfo.document
        } : undefined,
        walrusInfo: {
          error: walrusError instanceof Error ? walrusError.message : 'Unknown error',
          stored: false,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('[auth] Auth callback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 500 }
    );
  }
}
