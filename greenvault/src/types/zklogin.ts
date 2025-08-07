export interface ZkLoginState {
  ephemeralKeyPair: {
    privateKey: string;
    publicKey: string;
  };
  maxEpoch: number;
  randomness: string;
  nonce: string;
}

export interface ZkLoginProof {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}

export interface DecodedJWT {
  iss: string;
  azp?: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
  nonce: string;
}

export interface ZkLoginData {
  userAddress: string;
  zkProof: ZkLoginProof;
  ephemeralKeyPair: {
    privateKey: string;
    publicKey: string;
  };
  maxEpoch: number;
  randomness: string;
  userSalt: string;
  jwt: string;
  decodedJwt: DecodedJWT;
}

export interface ZkLoginResponse {
  success: boolean;
  data?: ZkLoginData;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: string;
  walletAddress?: string;
  walletPrivateKey?: string; // Encrypted in production
  did?: string; // DID identifier
  didDocument?: any; // DID document
  didCreatedAt?: string; // When DID was created
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: Omit<User, 'passwordHash' | 'walletPrivateKey' | 'didDocument'> & { 
      walletAddress?: string;
      did?: string;
    };
    token: string;
    didInfo?: {
      did: string;
      isNew: boolean;
    };
  };
  error?: string;
}

export interface AuthToken {
  userId: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

// DID-related types
export interface DIDResult {
  success: boolean;
  did?: string;
  document?: any; // DIDDocument type from did-manager
  suiObjectId?: string;
  message?: string;
  error?: string;
}
