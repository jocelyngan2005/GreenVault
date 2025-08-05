import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { generateRandomness, generateNonce, jwtToAddress, getExtendedEphemeralPublicKey } from '@mysten/sui/zklogin';
import { decodeJwt } from 'jose';
import type { ZkLoginState, ZkLoginProof, DecodedJWT, ZkLoginData } from '@/types/zklogin';

// Initialize Sui client
const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet' || 'devnet'),
});

export class SuiZkLoginClient {
  private client: SuiClient;
  private network: string;
  private proverUrl: string;
  private faucetUrl: string;

  constructor() {
    this.client = suiClient;
    this.network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'devnet';
    this.proverUrl = process.env.NEXT_PUBLIC_SUI_PROVER_URL || 'https://prover-dev.mystenlabs.com/v1';
    this.faucetUrl = process.env.NEXT_PUBLIC_SUI_FAUCET_URL || 'https://faucet.devnet.sui.io/gas';
  }

  /**
   * Generate ephemeral key pair and nonce for zkLogin
   */
  async generatePreLoginData(): Promise<ZkLoginState> {
    try {
      console.log('Generating ephemeral key pair...');
      
      // Generate ephemeral key pair
      const ephemeralKeyPair = new Ed25519Keypair();
      const privateKeyBytes = ephemeralKeyPair.getSecretKey();
      const privateKey = Buffer.from(privateKeyBytes).toString('base64');

      console.log('Getting current epoch from Sui network...');
      
      // Get current epoch and set max epoch
      const { epoch } = await this.client.getLatestSuiSystemState();
      const maxEpoch = parseInt(epoch) + 10; // Valid for 10 epochs

      console.log(`Current epoch: ${epoch}, max epoch: ${maxEpoch}`);

      // Generate randomness
      console.log('Generating randomness...');
      const randomness = generateRandomness();

      // Generate nonce
      console.log('Generating nonce...');
      const nonce = generateNonce(
        ephemeralKeyPair.getPublicKey(),
        maxEpoch,
        randomness
      );

      console.log('Pre-login data generation completed successfully');

      return {
        ephemeralKeyPair: {
          privateKey,
          publicKey: ephemeralKeyPair.getPublicKey().toBase64(),
        },
        maxEpoch,
        randomness,
        nonce,
      };
    } catch (error) {
      console.error('Error generating pre-login data:', error);
      
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      throw new Error('Failed to generate pre-login data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Decode JWT token
   */
  decodeJWT(jwt: string): DecodedJWT {
    try {
      console.log('Starting JWT decoding...');
      console.log('JWT token length:', jwt.length);
      console.log('JWT token (first 50 chars):', jwt.substring(0, 50) + '...');
      
      const decoded = decodeJwt(jwt) as DecodedJWT;
      
      console.log('JWT decoded successfully:', {
        iss: decoded.iss,
        sub: decoded.sub,
        email: decoded.email,
        nonce: decoded.nonce,
        iat: decoded.iat,
        exp: decoded.exp
      });
      
      return {
        iss: decoded.iss,
        azp: decoded.azp,
        aud: decoded.aud,
        sub: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified,
        name: decoded.name,
        picture: decoded.picture,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        iat: decoded.iat,
        exp: decoded.exp,
        nonce: decoded.nonce,
      };
    } catch (error) {
      console.error('Error decoding JWT:', error);
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Generate user address from JWT and salt
   */
  generateUserAddress(jwt: string, salt: string): string {
    try {
      console.log('Starting user address generation...');
      
      // Convert hex string salt to BigInt for Sui zkLogin
      const saltBigInt = BigInt('0x' + salt);
      console.log('Salt as BigInt:', saltBigInt.toString());
      
      console.log('Calling jwtToAddress...');
      const userAddress = jwtToAddress(jwt, saltBigInt);
      
      console.log('User address generated successfully:', userAddress);
      
      return userAddress;
    } catch (error) {
      console.error('Error generating user address:', error);
      throw new Error('Failed to generate user address');
    }
  }

  /**
   * Get extended ephemeral public key
   */
  getExtendedEphemeralPublicKey(publicKeyBase64: string): string {
    try {
      console.log('Starting extended ephemeral public key generation...');
      console.log('Public key (base64):', publicKeyBase64);
      
      // Create Ed25519PublicKey from base64 string
      const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
      const publicKey = new Ed25519PublicKey(publicKeyBytes);
      const extendedKey = getExtendedEphemeralPublicKey(publicKey);
      console.log('Extended ephemeral public key generated:', extendedKey);
      
      return extendedKey;
    } catch (error) {
      console.error('Error getting extended ephemeral public key:', error);
      // Try alternative approach - use the private key if public key reconstruction fails
      try {
        console.log('Trying alternative approach with private key...');
        // If publicKeyBase64 is actually the private key, use it directly
        const privateKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
        const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
        console.log('Keypair created from secret key');
        
        const extendedKey = getExtendedEphemeralPublicKey(keypair.getPublicKey());
        console.log('Extended ephemeral public key generated (alternative method):', extendedKey);
        
        return extendedKey;
      } catch (altError) {
        console.error('Alternative approach also failed:', altError);
        throw new Error('Failed to get extended ephemeral public key');
      }
    }
  }

  /**
   * Request ZK proof from Sui prover service
   */
  async requestZkProof(payload: {
    jwt: string;
    extendedEphemeralPublicKey: string;
    maxEpoch: number;
    jwtRandomness: string;
    salt: string; // hex string from frontend
    keyClaimName: string;
  }): Promise<ZkLoginProof> {
    try {
      // Convert salt from hex string to base64
      const saltHex = payload.salt;
      const saltBytes = Uint8Array.from(Buffer.from(saltHex, 'hex'));
      const saltBase64 = Buffer.from(saltBytes).toString('base64');

      // Build new payload with base64-encoded salt
      const proverPayload = {
        ...payload,
        salt: saltBase64,
      };

      // Log the prover request payload and URL for debugging
      console.log('[zkLogin] Prover request URL:', this.proverUrl);
      console.log('[zkLogin] Prover request payload:', JSON.stringify(proverPayload, null, 2));

      const response = await fetch(this.proverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proverPayload),
      });

      if (!response.ok) {
        // Log the response body for more details
        const errorText = await response.text();
        console.error('[zkLogin] Prover error response:', errorText);
        throw new Error(`Prover service error: ${response.statusText}`);
      }

      const zkProof = await response.json();
      return zkProof;
    } catch (error) {
      console.error('Error requesting ZK proof:', error);
      throw new Error('Failed to get ZK proof from prover service');
    }
  }
}

export const suiZkLoginClient = new SuiZkLoginClient();
