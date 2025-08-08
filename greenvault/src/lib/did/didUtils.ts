import { didManager } from '@/lib/did/did-manager';
import { updateEmailUserWithDID } from '@/lib/zklogin/unifiedUserStore';
import type { User } from '@/types/zklogin';

// Type to handle both legacy and unified user formats
type CompatibleUser = User | {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  authType: 'email' | 'zklogin';
  passwordHash?: string;
  walletAddress?: string;
  walletPrivateKey?: string;
  userAddress?: string;
  provider?: string;
  did?: string;
  didDocument?: any;
  didCreatedAt?: string;
};

/**
 * Check if user has a DID, and create one if they don't
 */
export async function ensureUserHasDID(user: CompatibleUser): Promise<{ 
  did: string; 
  document: any; 
  isNew: boolean;
  user: CompatibleUser;
}> {
  try {
    console.log('[didUtils] Checking DID for user:', user.email);

    // Check if user already has a DID
    if (user.did && user.didDocument) {
      console.log('[didUtils] User already has DID:', user.did);
      return {
        did: user.did,
        document: user.didDocument,
        isNew: false,
        user
      };
    }

    console.log('[didUtils] User does not have DID, creating new one...');

    // Create DID for email-based authentication
    const didResult = await didManager.createOrUpdateDIDForEmail(user.id, user.email);
    
    console.log('DID creation result:', {
      did: didResult.did,
      documentId: didResult.document.id,
      verificationMethods: didResult.document.verificationMethod?.length || 0
    });
    
    // Update user in storage with DID information
    const updatedUser = updateEmailUserWithDID(user.email, didResult.did, didResult.document);
    
    if (!updatedUser) {
      throw new Error('Failed to update user with DID information');
    }

    console.log('[didUtils] DID created and user updated successfully');

    return {
      did: didResult.did,
      document: didResult.document,
      isNew: true,
      user: updatedUser
    };
    
  } catch (error) {
    console.error('[didUtils] Failed to ensure user has DID:', error);
    throw new Error(`DID creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that a DID exists and is valid for the user
 */
export async function validateUserDID(user: CompatibleUser): Promise<boolean> {
  try {
    if (!user.did) {
      console.log('[didUtils] User has no DID');
      return false;
    }
    
    // Resolve DID to check if it's valid
    const resolvedDocument = await didManager.resolveDID(user.did);
    
    if (!resolvedDocument) {
      console.log('[didUtils] DID resolution failed for:', user.did);
      return false;
    }

    console.log('[didUtils] DID is valid:', user.did);
    return true;
    
  } catch (error) {
    console.error('[didUtils] DID validation error:', error);
    return false;
  }
}

/**
 * Get DID health status for a user
 */
export async function getUserDIDStatus(user: CompatibleUser): Promise<{
  hasDID: boolean;
  isValid: boolean;
  did?: string;
  createdAt?: string;
  error?: string;
}> {
  try {
    const hasDID = !!(user.did && user.didDocument);
    
    if (!hasDID) {
      return {
        hasDID: false,
        isValid: false,
        error: 'No DID assigned to user'
      };
    }
    
    const isValid = await validateUserDID(user);
    
    return {
      hasDID: true,
      isValid,
      did: user.did,
      createdAt: user.didCreatedAt,
      error: isValid ? undefined : 'DID validation failed'
    };
    
  } catch (error) {
    console.error('[didUtils] Failed to get DID status:', error);
    return {
      hasDID: false,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
