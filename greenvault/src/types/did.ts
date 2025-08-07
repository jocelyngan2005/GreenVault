export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string | object;
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  service?: Service[];
  created: string;
  updated: string;
}

export interface DIDResolutionResult {
  '@context': string;
  didDocument: DIDDocument;
  didResolutionMetadata: {
    contentType: string;
    retrieved: string;
  };
  didDocumentMetadata: {
    created: string;
    updated: string;
  };
}
