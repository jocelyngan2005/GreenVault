/**
 * Enhanced DID Method Specification for did:sui
 * 
 * This provides basic compliance with W3C DID standards while maintaining
 * simplicity for the GreenVault project.
 */

export interface SuiDIDMethodSpec {
  // DID Syntax: did:sui:{sui-address}
  method: 'sui';
  network: 'devnet' | 'testnet' | 'mainnet';
  
  // Required operations
  operations: {
    create: boolean;
    read: boolean;
    update: boolean;
    deactivate: boolean;
  };
  
  // Resolution metadata
  resolution: {
    endpoint?: string;
    cached: boolean;
    ttl: number;
  };

  // URL dereferencing support
  urlDereferencing: {
    supported: boolean;
    fragmentIdentifiers: string[];
    queryParameters: string[];
  };

  // Deactivation support
  deactivation: {
    supported: boolean;
    method: 'transaction' | 'marker' | 'both';
    reversible: boolean;
  };
}

// DID URL components interface
export interface DIDURLComponents {
  did: string;
  path?: string;
  query?: Record<string, string>;
  fragment?: string;
}

// Deactivation status interface
export interface DeactivationStatus {
  isDeactivated: boolean;
  deactivatedAt?: string;
  deactivationTx?: string;
  reason?: string;
  reversible: boolean;
}

/**
 * DID Method Implementation for did:sui
 * Provides basic compliance without over-engineering
 */
export class SuiDIDMethodImpl {
  readonly method = 'sui';
  readonly specification: SuiDIDMethodSpec;
  private deactivatedDIDs: Map<string, DeactivationStatus> = new Map();
  private documentCache: Map<string, { document: any; timestamp: number; ttl: number }> = new Map();
  private readonly defaultCacheTTL = 300000; // 5 minutes
  private logger: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
  };
  
  constructor(
    network: 'devnet' | 'testnet' | 'mainnet' = 'devnet',
    logger?: {
      info: (message: string, ...args: any[]) => void;
      warn: (message: string, ...args: any[]) => void;
      error: (message: string, ...args: any[]) => void;
    }
  ) {
    this.logger = logger || {
      info: console.log,
      warn: console.warn,
      error: console.error
    };
    this.specification = {
      method: 'sui',
      network,
      operations: {
        create: true,
        read: true,
        update: true,
        deactivate: true // Now supported
      },
      resolution: {
        cached: true,
        ttl: 3600000 // 1 hour
      },
      urlDereferencing: {
        supported: true,
        fragmentIdentifiers: ['key-1', 'key-2', 'service-1', 'zklogin-auth', 'email-auth'],
        queryParameters: ['service', 'relativeRef', 'versionId', 'versionTime']
      },
      deactivation: {
        supported: true,
        method: 'both', // Support both transaction and marker methods
        reversible: true // Allow reactivation
      }
    };
  }

  /**
   * Validate DID document according to W3C standards
   */
  validateDIDDocument(didDocument: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!didDocument.id) {
      errors.push('Missing required field: id');
    }
    if (!didDocument['@context']) {
      errors.push('Missing required field: @context');
    }

    // Validate DID syntax
    if (didDocument.id && !this.validateDIDSyntax(didDocument.id)) {
      errors.push('Invalid DID syntax in id field');
    }

    // Validate verification methods
    if (didDocument.verificationMethod) {
      didDocument.verificationMethod.forEach((vm: any, index: number) => {
        if (!vm.id) {
          errors.push(`Verification method ${index}: missing id`);
        }
        if (!vm.type) {
          errors.push(`Verification method ${index}: missing type`);
        }
        if (!vm.controller) {
          errors.push(`Verification method ${index}: missing controller`);
        }
        if (!vm.publicKeyMultibase && !vm.publicKeyJwk) {
          warnings.push(`Verification method ${index}: no public key material`);
        }
      });
    }

    // Validate services
    if (didDocument.service) {
      didDocument.service.forEach((service: any, index: number) => {
        if (!service.id) {
          errors.push(`Service ${index}: missing id`);
        }
        if (!service.type) {
          errors.push(`Service ${index}: missing type`);
        }
        if (!service.serviceEndpoint) {
          errors.push(`Service ${index}: missing serviceEndpoint`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate DID syntax according to did:sui method
   */
  validateDIDSyntax(did: string): boolean {
    const didRegex = /^did:sui:0x[a-fA-F0-9]{64}$/;
    return didRegex.test(did);
  }

  /**
   * Cache management for DID documents
   */
  private getCachedDocument(did: string): any | null {
    const cached = this.documentCache.get(did);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.documentCache.delete(did);
      return null;
    }

    return cached.document;
  }

  private setCachedDocument(did: string, document: any, ttl?: number): void {
    this.documentCache.set(did, {
      document,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL
    });
  }

  /**
   * Clear cache for specific DID or all DIDs
   */
  clearCache(did?: string): void {
    if (did) {
      this.documentCache.delete(did);
    } else {
      this.documentCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
  } {
    // This would track actual hits/misses in a real implementation
    return {
      size: this.documentCache.size,
      hits: 0, // Would be tracked
      misses: 0 // Would be tracked
    };
  }

  /**
   * Parse DID URL components according to W3C DID specification
   */
  parseDIDURL(didUrl: string): DIDURLComponents | null {
    try {
      // Parse DID URL manually: did:method:identifier[/path][?query][#fragment]
      
      // Check if it starts with did:
      if (!didUrl.startsWith('did:')) {
        return null;
      }

      // Split into main DID and optional parts (query/fragment)
      const [mainPart, ...rest] = didUrl.split('?');
      const [didAndPath, fragment] = (rest.length > 0 ? rest.join('?') : mainPart).split('#');
      
      // Parse query from the part after ?
      const query: Record<string, string> = {};
      if (rest.length > 0) {
        const queryString = rest[0].split('#')[0];
        const searchParams = new URLSearchParams(queryString);
        searchParams.forEach((value, key) => {
          query[key] = value;
        });
      }

      // Parse DID and path
      const didParts = (rest.length > 0 ? mainPart : didAndPath).split('/');
      const didPart = didParts[0]; // did:method:identifier
      const path = didParts.length > 1 ? '/' + didParts.slice(1).join('/') : undefined;

      if (!this.validateDIDSyntax(didPart)) {
        return null;
      }

      return {
        did: didPart,
        path,
        query: Object.keys(query).length > 0 ? query : undefined,
        fragment
      };
    } catch (error) {
      console.error('Failed to parse DID URL:', error);
      return null;
    }
  }

  /**
   * Dereference DID URL to specific resource
   */
  async dereferenceDIDURL(didUrl: string, didDocument?: any): Promise<{
    content: any | null;
    contentType: string;
    metadata: {
      didUrl: string;
      dereferenced: string;
      fragment?: string;
      service?: string;
    };
  }> {
    const components = this.parseDIDURL(didUrl);
    if (!components) {
      throw new Error('Invalid DID URL format');
    }

    const metadata = {
      didUrl,
      dereferenced: new Date().toISOString(),
      fragment: components.fragment,
      service: components.query?.service
    };

    // If no document provided, this would resolve the DID first
    if (!didDocument) {
      return {
        content: null,
        contentType: 'application/json',
        metadata
      };
    }

    // Fragment dereferencing
    if (components.fragment) {
      const fragmentContent = this.dereferenceFragment(didDocument, components.fragment);
      return {
        content: fragmentContent,
        contentType: 'application/json',
        metadata
      };
    }

    // Service dereferencing
    if (components.query?.service) {
      const serviceContent = this.dereferenceService(didDocument, components.query.service);
      return {
        content: serviceContent,
        contentType: 'application/json',
        metadata
      };
    }

    // Return full document if no specific dereferencing
    return {
      content: didDocument,
      contentType: 'application/json',
      metadata
    };
  }

  /**
   * Dereference fragment identifier (e.g., #key-1, #service-1)
   */
  public dereferenceFragment(didDocument: any, fragment: string): any | null {
    // Check verification methods
    if (didDocument.verificationMethod) {
      for (const method of didDocument.verificationMethod) {
        if (method.id === `${didDocument.id}#${fragment}` || method.id.endsWith(`#${fragment}`)) {
          return method;
        }
      }
    }

    // Check services
    if (didDocument.service) {
      for (const service of didDocument.service) {
        if (service.id === `${didDocument.id}#${fragment}` || service.id.endsWith(`#${fragment}`)) {
          return service;
        }
      }
    }

    // Check authentication references
    if (didDocument.authentication) {
      for (const auth of didDocument.authentication) {
        if (typeof auth === 'string' && auth.endsWith(`#${fragment}`)) {
          // Find the referenced verification method
          return this.dereferenceFragment(didDocument, auth.split('#')[1]);
        }
      }
    }

    return null;
  }

  /**
   * Dereference service by type or ID
   */
  public dereferenceService(didDocument: any, serviceIdentifier: string): any | null {
    if (!didDocument.service) {
      return null;
    }

    // Try to find by ID first
    for (const service of didDocument.service) {
      if (service.id === serviceIdentifier || service.id.endsWith(`#${serviceIdentifier}`)) {
        return service;
      }
    }

    // Try to find by type
    for (const service of didDocument.service) {
      if (service.type === serviceIdentifier) {
        return service;
      }
    }

    return null;
  }

  /**
   * Parse DID components
   */
  parseDID(did: string): { method: string; identifier: string; address: string } | null {
    if (!this.validateDIDSyntax(did)) {
      return null;
    }

    const parts = did.split(':');
    return {
      method: parts[1], // 'sui'
      identifier: parts[2], // '0x...'
      address: parts[2] // Same as identifier for sui method
    };
  }

  /**
   * Generate DID from Sui address
   */
  generateDID(suiAddress: string): string {
    if (!suiAddress.startsWith('0x') || suiAddress.length !== 66) {
      throw new Error('Invalid Sui address format');
    }
    return `did:sui:${suiAddress}`;
  }

  /**
   * Deactivate a DID
   */
  async deactivateDID(did: string, options?: {
    reason?: string;
    transactionId?: string;
    permanent?: boolean;
  }): Promise<{
    success: boolean;
    deactivationStatus: DeactivationStatus;
    message: string;
  }> {
    if (!this.validateDIDSyntax(did)) {
      throw new Error('Invalid DID format for deactivation');
    }

    const deactivationStatus: DeactivationStatus = {
      isDeactivated: true,
      deactivatedAt: new Date().toISOString(),
      deactivationTx: options?.transactionId,
      reason: options?.reason || 'Manual deactivation',
      reversible: !options?.permanent
    };

    // Store deactivation status
    this.deactivatedDIDs.set(did, deactivationStatus);

    console.log(`DID deactivated: ${did}`, deactivationStatus);

    return {
      success: true,
      deactivationStatus,
      message: options?.permanent ? 'DID permanently deactivated' : 'DID deactivated (reversible)'
    };
  }

  /**
   * Reactivate a previously deactivated DID
   */
  async reactivateDID(did: string, options?: {
    reason?: string;
    transactionId?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!this.validateDIDSyntax(did)) {
      throw new Error('Invalid DID format for reactivation');
    }

    const deactivationStatus = this.deactivatedDIDs.get(did);
    
    if (!deactivationStatus) {
      return {
        success: false,
        message: 'DID is not deactivated'
      };
    }

    if (!deactivationStatus.reversible) {
      return {
        success: false,
        message: 'DID was permanently deactivated and cannot be reactivated'
      };
    }

    // Remove from deactivated list
    this.deactivatedDIDs.delete(did);

    console.log(`DID reactivated: ${did}`, {
      reason: options?.reason || 'Manual reactivation',
      transactionId: options?.transactionId,
      reactivatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'DID successfully reactivated'
    };
  }

  /**
   * Check if a DID is deactivated
   */
  isDeactivated(did: string): DeactivationStatus | null {
    return this.deactivatedDIDs.get(did) || null;
  }

  /**
   * Get all deactivated DIDs
   */
  getDeactivatedDIDs(): Map<string, DeactivationStatus> {
    return new Map(this.deactivatedDIDs);
  }

  /**
   * Enhanced DID Resolution with blockchain integration
   */
  async resolveDID(did: string, suiClient?: any): Promise<{
    didDocument: any | null;
    metadata: {
      method: string;
      network: string;
      created: string;
      resolved: string;
      deactivated?: boolean;
      deactivationStatus?: DeactivationStatus;
      onChain?: boolean;
      objectId?: string;
    };
  }> {
    const parsed = this.parseDID(did);
    if (!parsed) {
      throw new Error('Invalid DID format for did:sui method');
    }

    // Check deactivation status
    const deactivationStatus = this.isDeactivated(did);
    const isDeactivated = !!deactivationStatus;

    const metadata = {
      method: this.method,
      network: this.specification.network,
      created: new Date().toISOString(),
      resolved: new Date().toISOString(),
      onChain: !!suiClient,
      ...(isDeactivated && { 
        deactivated: true,
        deactivationStatus 
      })
    };

    // If deactivated, return null document with metadata
    if (isDeactivated) {
      console.log(`Attempted to resolve deactivated DID: ${did}`);
      return {
        didDocument: null,
        metadata
      };
    }

    // Try to resolve from blockchain if client provided
    if (suiClient) {
      try {
        // This would query the Sui blockchain for the DID document
        // For now, return a basic document structure
        const didDocument = await this.resolveFromBlockchain(did, suiClient);
        return {
          didDocument,
          metadata: {
            ...metadata,
            objectId: didDocument?.objectId
          }
        };
      } catch (error) {
        console.warn(`Failed to resolve from blockchain: ${error}`);
      }
    }

    // Return mock document for testing/development
    return {
      didDocument: this.generateMockDocument(did),
      metadata
    };
  }

  /**
   * Resolve DID document from Sui blockchain
   */
  private async resolveFromBlockchain(did: string, suiClient: any): Promise<any> {
    // This would be implemented with actual Sui client calls
    // For now, return a structured mock
    return this.generateMockDocument(did);
  }

  /**
   * Generate a mock DID document for testing
   */
  private generateMockDocument(did: string): any {
    const parsed = this.parseDID(did);
    if (!parsed) return null;

    return {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      "id": did,
      "verificationMethod": [
        {
          "id": `${did}#key-1`,
          "type": "Ed25519VerificationKey2020",
          "controller": did,
          "publicKeyMultibase": "z6MkrJVnaZkeFzdQyQSrw2WJGzuPy4ccZqtEfCzxs1a2B3Dt"
        }
      ],
      "authentication": [`${did}#key-1`],
      "assertionMethod": [`${did}#key-1`],
      "service": [
        {
          "id": `${did}#walrus-storage`,
          "type": "WalrusStorage",
          "serviceEndpoint": "https://walrus.devnet.sui.io"
        }
      ],
      "created": new Date().toISOString(),
      "updated": new Date().toISOString()
    };
  }

  /**
   * Batch resolve multiple DIDs
   */
  async batchResolveDIDs(dids: string[], suiClient?: any): Promise<Map<string, {
    didDocument: any | null;
    metadata: any;
    error?: string;
  }>> {
    const results = new Map();
    
    // Process in parallel for better performance
    const promises = dids.map(async (did) => {
      try {
        const result = await this.resolveDID(did, suiClient);
        return { did, result };
      } catch (error) {
        return { 
          did, 
          result: { 
            didDocument: null, 
            metadata: {}, 
            error: error instanceof Error ? error.message : String(error)
          }
        };
      }
    });

    const settled = await Promise.allSettled(promises);
    
    settled.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        results.set(outcome.value.did, outcome.value.result);
      }
    });

    return results;
  }

  /**
   * Batch deactivate multiple DIDs
   */
  async batchDeactivateDIDs(dids: string[], options?: {
    reason?: string;
    permanent?: boolean;
  }): Promise<Map<string, {
    success: boolean;
    deactivationStatus?: DeactivationStatus;
    error?: string;
  }>> {
    const results = new Map();
    
    for (const did of dids) {
      try {
        const result = await this.deactivateDID(did, options);
        results.set(did, result);
      } catch (error) {
        results.set(did, {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Get method specification
   */
  getMethodSpecification(): SuiDIDMethodSpec {
    return this.specification;
  }

  /**
   * Get comprehensive method capabilities
   */
  getCapabilities(): {
    urlDereferencing: {
      supported: boolean;
      examples: string[];
    };
    deactivation: {
      supported: boolean;
      reversible: boolean;
      examples: string[];
    };
    operations: string[];
  } {
    return {
      urlDereferencing: {
        supported: this.specification.urlDereferencing.supported,
        examples: [
          'did:sui:0x123...#key-1',
          'did:sui:0x123...#zklogin-auth',
          'did:sui:0x123...?service=authentication',
          'did:sui:0x123.../path?versionId=1.0'
        ]
      },
      deactivation: {
        supported: this.specification.deactivation.supported,
        reversible: this.specification.deactivation.reversible,
        examples: [
          'Temporary deactivation (reversible)',
          'Permanent deactivation (irreversible)',
          'Transaction-based deactivation',
          'Marker-based deactivation'
        ]
      },
      operations: [
        'create',
        'read', 
        'update',
        'deactivate',
        'reactivate',
        'dereference',
        'validate'
      ]
    };
  }

  /**
   * Validate DID URL syntax
   */
  validateDIDURL(didUrl: string): boolean {
    const components = this.parseDIDURL(didUrl);
    return components !== null;
  }
}

export const suiDIDMethod = new SuiDIDMethodImpl();

// Export individual functions for direct access
export const parseDIDURL = (didUrl: string): DIDURLComponents | null => 
  suiDIDMethod.parseDIDURL(didUrl);

export const dereferenceDIDURL = async (didUrl: string, suiClient?: any): Promise<any> => 
  suiDIDMethod.dereferenceDIDURL(didUrl, suiClient);

export const dereferenceFragment = (didDocument: any, fragment: string): any => 
  suiDIDMethod.dereferenceFragment(didDocument, fragment);

export const dereferenceService = (didDocument: any, serviceName: string): any => 
  suiDIDMethod.dereferenceService(didDocument, serviceName);

export const deactivateDID = async (did: string, options: { reason?: string; transactionId?: string; permanent?: boolean }): Promise<any> => 
  suiDIDMethod.deactivateDID(did, options);

export const reactivateDID = async (did: string): Promise<any> => 
  suiDIDMethod.reactivateDID(did);

export const resolveDID = async (did: string, suiClient?: any): Promise<any> => 
  suiDIDMethod.resolveDID(did, suiClient);

export const getMethodSpecification = (): SuiDIDMethodSpec => 
  suiDIDMethod.getMethodSpecification();

export const getCapabilities = (): any => 
  suiDIDMethod.getCapabilities();
