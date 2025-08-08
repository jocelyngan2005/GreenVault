export interface WalrusConfig {
  aggregatorUrl: string;
  publisherUrl: string;
  epochs: number;
}

export interface WalrusStoreResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      storedEpoch: number;
      blobId: string;
      size: number;
      erasureCodeType: string;
      certifiedEpoch: number;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
    };
  };
  alreadyCertified?: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
}

export interface WalrusReadResponse {
  data: any;
  metadata?: {
    blobId: string;
    size: number;
    storedEpoch: number;
  };
}

export interface AccountData {
  zkLoginData: {
    userAddress: string;
    zkProof: any;
    ephemeralKeyPair: any;
    maxEpoch: number;
    randomness: string;
    userSalt: string;
    jwt: string;
    decodedJwt: any;
  };
  didData?: {
    did: string;
    document: any;
    createdAt: string;
    updatedAt: string;
  };
  userSalt: string;
  metadata: {
    userId: string;
    email?: string;
    name?: string;
    lastLogin: string;
    createdAt: string;
    version: string;
  };
}

export interface SealedAccountData {
  sealedData: string;
  blobId: string;
  metadata: {
    userId: string;
    createdAt: string;
    lastUpdated: string;
    version: string;
  };
}
