import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { createHash } from 'crypto';

/**
 * Generate a deterministic Sui wallet address for traditional email/password users
 */
export function generateWallet(email: string, userId: string): {
  address: string;
  privateKey: string;
  publicKey: string;
} {
  try {
    console.log('[walletUtils] Generating wallet for email:', email, 'userId:', userId);
    
    // Create a deterministic seed from email and userId
    const seedString = `${email.toLowerCase()}:${userId}:greenvault-wallet`;
    console.log('[walletUtils] Seed string:', seedString);

    const seed = createHash('sha256').update(seedString).digest();
    console.log('[walletUtils] Generated seed length:', seed.length);

    // Generate keypair from seed
    const keypair = Ed25519Keypair.fromSecretKey(seed);
    
    const result = {
      address: keypair.getPublicKey().toSuiAddress(),
      privateKey: Buffer.from(keypair.getSecretKey()).toString('base64'),
      publicKey: keypair.getPublicKey().toBase64(),
    };

    console.log('[walletUtils] Generated wallet address:', result.address);
    return result;
  } catch (error) {
    console.error('[walletUtils] Failed to generate wallet:', error);
    // Fallback to random wallet if deterministic fails
    console.log('[walletUtils] Falling back to random wallet generation');
    return generateRandomWallet();
  }
}

/**
 * Restore wallet from stored private key
 */
export function restoreWalletFromPrivateKey(privateKeyBase64: string): {
  address: string;
  publicKey: string;
} {
  try {
    const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
    const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    
    return {
      address: keypair.getPublicKey().toSuiAddress(),
      publicKey: keypair.getPublicKey().toBase64(),
    };
  } catch (error) {
    console.error('[walletUtils] Failed to restore wallet:', error);
    throw new Error('[walletUtils] Failed to restore wallet');
  }
}

/**
 * Generate a random Sui wallet (for users who prefer random addresses)
 */
export function generateRandomWallet(): {
  address: string;
  privateKey: string;
  publicKey: string;
} {
  try {
    const keypair = new Ed25519Keypair();
    
    return {
      address: keypair.getPublicKey().toSuiAddress(),
      privateKey: Buffer.from(keypair.getSecretKey()).toString('base64'),
      publicKey: keypair.getPublicKey().toBase64(),
    };
  } catch (error) {
    console.error('[walletUtils] Failed to generate random wallet:', error);
    throw new Error('[walletUtils] Failed to generate wallet address');
  }
}
