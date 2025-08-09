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
  private proverUrls: string[];
  private faucetUrl: string;

  constructor() {
    this.client = suiClient;
    this.network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'devnet';
    
    // Primary and fallback prover URLs
    const primaryProver = process.env.NEXT_PUBLIC_SUI_PROVER_URL || 'https://prover-dev.mystenlabs.com/v1';
    this.proverUrls = [
      primaryProver,
      'https://prover-dev.mystenlabs.com/v1',
    ].filter((url, index, arr) => arr.indexOf(url) === index);
    
    this.faucetUrl = process.env.NEXT_PUBLIC_SUI_FAUCET_URL || 'https://faucet.devnet.sui.io/gas';
  }

  /**
   * Generate ephemeral key pair and nonce for zkLogin
   */
  async generatePreLoginData(): Promise<ZkLoginState> {
    try {
      console.log('[sui-zklogin] Generating ephemeral key pair...');
      
      // Generate ephemeral key pair
      const ephemeralKeyPair = new Ed25519Keypair();
      const privateKeyBytes = ephemeralKeyPair.getSecretKey();
      const privateKey = Buffer.from(privateKeyBytes).toString('base64');

      console.log('[sui-zklogin] Getting current epoch from Sui network...');

      // Get current epoch and set max epoch
      const { epoch } = await this.client.getLatestSuiSystemState();
      const maxEpoch = parseInt(epoch) + 2; // Valid for 2 epochs

      console.log(`[sui-zklogin] Current epoch: ${epoch}, max epoch: ${maxEpoch}`);

      // Generate randomness
      console.log('[sui-zklogin] Generating randomness...');
      const randomness = generateRandomness();

      // Generate nonce
      console.log('[sui-zklogin] Generating nonce...');
      const nonce = generateNonce(
        ephemeralKeyPair.getPublicKey(),
        maxEpoch,
        randomness
      );

      console.log('[sui-zklogin] Pre-login data generation completed successfully');

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
      console.error('[sui-zklogin] Error generating pre-login data:', error);

      if (error instanceof Error) {
        console.error('[sui-zklogin] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }

      throw new Error('[sui-zklogin] Failed to generate pre-login data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Decode JWT token
   */
  decodeJWT(jwt: string): DecodedJWT {
    try {
      console.log('[sui-zklogin] Starting JWT decoding...');
      console.log('[sui-zklogin] JWT token length:', jwt.length);
      console.log('[sui-zklogin] JWT token (first 50 chars):', jwt.substring(0, 50) + '...');

      const decoded = decodeJwt(jwt) as DecodedJWT;

      console.log('[sui-zklogin] JWT decoded successfully:', {
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
      console.error('[sui-zklogin] Error decoding JWT:', error);
      throw new Error('[sui-zklogin] Invalid JWT token');
    }
  }

  /**
   * Generate user address from JWT and salt
   */
  generateUserAddress(jwt: string, salt: string): string {
    try {
      console.log('[sui-zklogin] Starting user address generation...');

      // Convert hex string salt to BigInt for Sui zkLogin
      const saltBigInt = BigInt('0x' + salt);
      console.log('[sui-zklogin] Salt as BigInt:', saltBigInt.toString());

      console.log('[sui-zklogin] Calling jwtToAddress...');
      const userAddress = jwtToAddress(jwt, saltBigInt);

      console.log('[sui-zklogin] User address generated successfully:', userAddress);

      return userAddress;
    } catch (error) {
      console.error('[sui-zklogin] Error generating user address:', error);
      throw new Error('[sui-zklogin] Failed to generate user address');
    }
  }

  /**
   * Get extended ephemeral public key
   */
  getExtendedEphemeralPublicKey(publicKeyBase64: string): string {
    try {
      console.log('[sui-zklogin] Starting extended ephemeral public key generation...');
      console.log('[sui-zklogin] Public key (base64):', publicKeyBase64);

      // Create Ed25519PublicKey from base64 string
      const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
      const publicKey = new Ed25519PublicKey(publicKeyBytes);
      const extendedKey = getExtendedEphemeralPublicKey(publicKey);
      console.log('[sui-zklogin] Extended ephemeral public key generated:', extendedKey);
      
      return extendedKey;
    } catch (error) {
      console.error('[sui-zklogin] Error getting extended ephemeral public key:', error);
      // Alternative approach if public key reconstruction fails
      try {
        console.log('[sui-zklogin] Trying alternative approach with private key...');
        // If publicKeyBase64 is actually the private key, use it directly
        const privateKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
        const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
        console.log('[sui-zklogin] Keypair created from secret key');
        
        const extendedKey = getExtendedEphemeralPublicKey(keypair.getPublicKey());
        console.log('[sui-zklogin] Extended ephemeral public key generated (alternative method):', extendedKey);

        return extendedKey;
      } catch (altError) {
        console.error('[sui-zklogin] Alternative approach also failed:', altError);
        throw new Error('[sui-zklogin] Failed to get extended ephemeral public key');
      }
    }
  }

  /**
   * Request ZK proof from Sui prover service with retry logic and fallback URLs
   */
  async requestZkProof(payload: {
    jwt: string;
    extendedEphemeralPublicKey: string;
    maxEpoch: number;
    jwtRandomness: string;
    salt: string;
    keyClaimName: string;
  }): Promise<ZkLoginProof> {
    const maxRetries = 2;
    const baseDelay = 2000;
    
    // Try each prover URL
    for (let urlIndex = 0; urlIndex < this.proverUrls.length; urlIndex++) {
      const proverUrl = this.proverUrls[urlIndex];
      console.log(`[sui-zklogin] Trying prover URL ${urlIndex + 1}/${this.proverUrls.length}: ${proverUrl}`);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[sui-zklogin] Requesting ZK proof (URL ${urlIndex + 1}, attempt ${attempt}/${maxRetries})...`);

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
          console.log('[sui-zklogin] Prover request URL:', proverUrl);
          console.log('[sui-zklogin] Prover request payload keys:', Object.keys(proverPayload));

          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

          const response = await fetch(proverUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(proverPayload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            // Log the response body for more details
            const errorText = await response.text();
            console.error(`[sui-zklogin] Prover error response (URL ${urlIndex + 1}, attempt ${attempt}):`, errorText);

            if (attempt === maxRetries) {
              console.log(`[sui-zklogin] All attempts failed for URL ${urlIndex + 1}, trying next URL...`);
              break; // Try next URL
            }
            
            // Wait before retrying same URL
            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`[sui-zklogin] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          const zkProof = await response.json();
          console.log(`[sui-zklogin] ZK proof received successfully from URL ${urlIndex + 1} on attempt ${attempt}`);
          return zkProof;
          
        } catch (error) {
          console.error(`[sui-zklogin] Error on URL ${urlIndex + 1}, attempt ${attempt}:`, error);

          if (attempt === maxRetries) {
            console.log(`[sui-zklogin] All attempts failed for URL ${urlIndex + 1}, trying next URL...`);
            break; // Try next URL
          }
          
          // Wait before retrying same URL
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[sui-zklogin] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all URLs and retries failed
    throw new Error('All zkLogin prover services are currently unavailable. Please try again later.');
  } 
}

export const suiZkLoginClient = new SuiZkLoginClient();
