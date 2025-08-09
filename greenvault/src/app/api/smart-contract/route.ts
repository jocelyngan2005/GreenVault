// src/app/api/smart-contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { isValidSuiAddress, normalizeSuiAddress, isMockObjectId } from '@/lib/suiUtils';

// Initialize Sui client
const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet' || 'devnet'),
});

// Contract package ID (set after deployment)
const PACKAGE_ID = process.env.SUI_PACKAGE_ID || '0x0';

// Temporary in-memory storage for registered projects
// In production, this would be replaced with proper database or blockchain event indexing
const registeredProjects: Map<string, any[]> = new Map();

// Clear any existing mismatched data on server restart
registeredProjects.clear();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data, privateKey } = body;

    // Validate required parameters
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Data is required' },
        { status: 400 }
      );
    }

    // Get private key from request or environment
    const effectivePrivateKey = privateKey || process.env.ADMIN_PRIVATE_KEY;
    
    if (!effectivePrivateKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Private key is required. Please provide a private key or set ADMIN_PRIVATE_KEY in environment variables.' 
        },
        { status: 400 }
      );
    }

    // Validate private key format
    let keyBuffer: Buffer;
    try {
      keyBuffer = Buffer.from(effectivePrivateKey, 'base64');
      if (keyBuffer.length !== 32) {
        throw new Error('Invalid key length');
      }
    } catch (keyError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid private key format. Private key must be a valid base64-encoded 32-byte key.' 
        },
        { status: 400 }
      );
    }

  // Create keypair from private key
  const keypair = Ed25519Keypair.fromSecretKey(keyBuffer);    switch (action) {
      case 'register_project':
        return await registerProject(data, keypair);
      case 'mint_credit':
        return await mintCarbonCredit(data, keypair);
      case 'list_credit':
        return await listCreditForSale(data, keypair);
      case 'buy_credit':
        return await buyCarbonCredit(data, keypair);
      case 'retire_credit':
        return await retireCarbonCredit(data, keypair);
      case 'verify_project':
        return await verifyProject(data, keypair);
      case 'add_issuer':
        return await addVerifiedIssuer(data, keypair);
      case 'get_stats':
        return await getStats();
      case 'fractionalize_credit':
        return await fractionalizeCredit(data, keypair);
      case 'purchase_fractions':
        return await purchaseFractions(data, keypair);
      case 'claim_micro_credits':
        return await claimMicroCredits(data, keypair);
      case 'retire_fractions':
        return await retireFractions(data, keypair);
      case 'initialize_hub':
        return await initializeHub(data, keypair);
      case 'register_verified_project':
        return await registerVerifiedProject(data, keypair);
      case 'onboard_community_member':
        return await onboardCommunityMember(data, keypair);
      case 'issue_verified_credits':
        return await issueVerifiedCredits(data, keypair);
      case 'community_verified_trade':
        return await communityVerifiedTrade(data, keypair);
      case 'record_comprehensive_action':
        return await recordComprehensiveAction(data, keypair);
      case 'grant_permissions':
        return await grantPermissions(data, keypair);
      case 'generate_impact_report':
        return await generateImpactReport(data, keypair);
      // DID Manager
      case 'create_identity':
        return await createIdentity(data, keypair);
      case 'update_privacy_settings':
        return await updatePrivacySettings(data, keypair);
      case 'register_community_verifier':
        return await registerCommunityVerifier(data, keypair);
      case 'request_verification':
        return await requestVerification(data, keypair);
      case 'process_verification':
        return await processVerification(data, keypair);
      case 'record_sustainability_action':
        return await recordSustainabilityAction(data, keypair);
      case 'endorse_community_member':
        return await endorseCommunityMember(data, keypair);
      // Oracle Integration
      case 'register_oracle':
        return await registerOracle(data, keypair);
      case 'request_co2_verification':
        return await requestCO2Verification(data, keypair);
      case 'submit_oracle_verification':
        return await submitOracleVerification(data, keypair);
      case 'update_data_feed':
        return await updateDataFeed(data, keypair);
      case 'slash_oracle':
        return await slashOracle(data, keypair);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Smart contract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function registerProject(data: any, keypair: Ed25519Keypair) {
  console.log(`[registerProject] Attempting to register project: ${data.projectId}`);
  
  try {
    const tx = new Transaction();
    
    // For demo purposes - in production, get actual shared object IDs
    const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

    tx.moveCall({
      target: `${PACKAGE_ID}::carbon_credit::register_project`,
      arguments: [
        tx.object(registryId),
        tx.pure.string(data.projectId),
        tx.pure.string(data.name),
        tx.pure.string(data.description),
        tx.pure.string(data.location),
        tx.pure.u8(data.projectType),
        tx.pure.u64(data.co2ReductionCapacity),
        tx.pure.option('string', data.beneficiaryCommunity),
        tx.pure.string(data.oracleDataSource),
        tx.pure.option('string', data.didAnchor),
      ],
    });

    tx.setGasBudget(100000000);
    
    const result = await suiClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
      }
    });

    // Store the project information for later retrieval
    const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
    if (!userAddress) {
      console.error('[registerProject] No user address found in environment');
      return NextResponse.json({
        success: true,
        txDigest: result.digest,
        events: result.events,
        warning: 'Project registered on blockchain but not stored in local index due to missing user address'
      });
    }
    
    const normalizedOwner = normalizeSuiAddress(userAddress);
    
    const projectInfo = {
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      location: data.location,
      projectType: data.projectType,
      co2ReductionCapacity: data.co2ReductionCapacity,
      beneficiaryCommunity: data.beneficiaryCommunity,
      oracleDataSource: data.oracleDataSource,
      didAnchor: data.didAnchor,
      owner: normalizedOwner,
      txDigest: result.digest,
      status: 'registered', // Initial status after blockchain registration
      verified: false,
      submitted: false,
      creditObjectId: null,
      salesCount: 0,
      totalRevenue: 0,
      createdDate: new Date().toISOString().slice(0, 10),
      registrationDate: new Date().toISOString()
    };
    
    // Store in temporary map (in production, this would be in a database)
    if (!registeredProjects.has(normalizedOwner)) {
      registeredProjects.set(normalizedOwner, []);
    }
    registeredProjects.get(normalizedOwner)!.push(projectInfo);
    
    console.log(`[registerProject] Stored project for owner ${normalizedOwner}:`, projectInfo);

    return NextResponse.json({
      success: true,
      txDigest: result.digest,
      events: result.events,
    });
    
  } catch (error) {
    console.error(`[registerProject] Blockchain registration failed for project ${data.projectId}:`, error);
    
    // For development: if blockchain call fails, store project locally anyway
    // This allows the demo to work while blockchain integration is being refined
    const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
    if (userAddress) {
      const normalizedOwner = normalizeSuiAddress(userAddress);
      
      const projectInfo = {
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        location: data.location,
        projectType: data.projectType,
        co2ReductionCapacity: data.co2ReductionCapacity,
        beneficiaryCommunity: data.beneficiaryCommunity,
        oracleDataSource: data.oracleDataSource,
        didAnchor: data.didAnchor,
        owner: normalizedOwner,
        txDigest: `simulated_tx_${Date.now()}`,
        status: 'registered', // Initial status for locally stored project
        verified: false,
        submitted: false,
        creditObjectId: null,
        salesCount: 0,
        totalRevenue: 0,
        createdDate: new Date().toISOString().slice(0, 10),
        registrationDate: new Date().toISOString()
      };
      
      if (!registeredProjects.has(normalizedOwner)) {
        registeredProjects.set(normalizedOwner, []);
      }
      registeredProjects.get(normalizedOwner)!.push(projectInfo);
      
      console.log(`[registerProject] Stored project locally for owner ${normalizedOwner} (blockchain call failed)`);
      
      return NextResponse.json({
        success: true,
        txDigest: `simulated_tx_${Date.now()}`,
        events: [],
        note: 'Project registered locally (blockchain call failed - this is expected in development)'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Project registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function mintCarbonCredit(data: any, keypair: Ed25519Keypair) {
  console.log(`[mintCarbonCredit] Attempting to mint credit for project: ${data.projectId}`);
  
  try {
    const issuerAddress = keypair.getPublicKey().toSuiAddress();
    console.log(`[mintCarbonCredit] Issuer address: ${issuerAddress}`);
    
    // First, ensure the issuer is added to verified issuers
    try {
      console.log(`[mintCarbonCredit] Adding issuer to verified issuers list...`);
      await addVerifiedIssuer({ issuerAddress }, keypair);
      console.log(`[mintCarbonCredit] Successfully added issuer to verified list`);
    } catch (addError) {
      console.log(`[mintCarbonCredit] Issuer may already be verified or add failed:`, addError);
      // Continue anyway as the issuer might already be in the list
    }

    const tx = new Transaction();
    
    const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

    tx.moveCall({
      target: `${PACKAGE_ID}::carbon_credit::mint_carbon_credit`,
      arguments: [
        tx.object(registryId),
        tx.pure.string(data.projectId),
        tx.pure.string(data.serialNumber),
        tx.pure.u16(data.vintageYear),
        tx.pure.u64(data.quantity),
        tx.pure.string(data.methodology),
        tx.pure.string(data.metadataUri),
        tx.pure.vector('u8', Array.from(Buffer.from(data.co2DataHash, 'hex'))),
        tx.pure.option('string', data.didAnchor),
      ],
    });

    tx.setGasBudget(100000000);

    const result = await suiClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    // Check if the transaction was successful
    console.log(`[mintCarbonCredit] Transaction result:`, {
      digest: result.digest,
      effects: result.effects,
      errors: result.errors
    });

    // Check for transaction errors
    if (result.effects?.status?.status !== 'success') {
      console.error(`[mintCarbonCredit] Transaction failed:`, result.effects?.status);
      throw new Error(`Minting transaction failed: ${JSON.stringify(result.effects?.status)}`);
    }

    // Update the project with credit object ID in temporary storage
    if (result.digest) {
      const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
      if (userAddress) {
        const normalizedOwner = normalizeSuiAddress(userAddress);
        
        // Try to find the created credit object from objectChanges
        let creditObjectId = undefined;
        
        if (result.objectChanges && Array.isArray(result.objectChanges)) {
          console.log(`[mintCarbonCredit] ObjectChanges:`, JSON.stringify(result.objectChanges, null, 2));
          
          // Debug: Log all objects and their properties
          result.objectChanges.forEach((obj: any, index: number) => {
            console.log(`[mintCarbonCredit] Object ${index}:`, {
              type: obj.type,
              objectType: obj.objectType,
              objectId: obj.objectId,
              sender: obj.sender,
              recipient: obj.recipient,
              owner: obj.owner
            });
          });
          
          // Strategy 1: Look for created objects with CarbonCredit type and exclude shared objects
          const createdObjects = result.objectChanges.filter((obj: any) => {
            const isCreated = obj.type === 'created';
            const isCarbonCredit = obj.objectType?.includes('CarbonCredit') || obj.objectType?.includes('carbon_credit');
            const isNotRegistry = !obj.objectType?.includes('Registry') && !obj.objectType?.includes('Marketplace') && !obj.objectType?.includes('DIDRegistry');
            const hasObjectId = obj.objectId && typeof obj.objectId === 'string';
            
            console.log(`[mintCarbonCredit] Checking created object:`, {
              type: obj.type,
              objectType: obj.objectType,
              objectId: obj.objectId,
              isCreated,
              isCarbonCredit,
              isNotRegistry,
              hasObjectId
            });
            
            return isCreated && isCarbonCredit && isNotRegistry && hasObjectId;
          });
          
          console.log(`[mintCarbonCredit] Found valid CarbonCredit objects:`, createdObjects);
          
          if (createdObjects.length > 0) {
            creditObjectId = (createdObjects[0] as any).objectId;
            console.log(`[mintCarbonCredit] Extracted creditObjectId via CarbonCredit: ${creditObjectId}`);
          }
          
          // Strategy 2: Look for transferred objects (CarbonCredit NFTs are transferred to issuer)
          if (!creditObjectId) {
            const transferredObjects = result.objectChanges.filter((obj: any) => {
              const isTransferred = obj.type === 'transferred';
              const hasRecipient = obj.recipient && typeof obj.recipient === 'object';
              const isToAddress = hasRecipient && 'AddressOwner' in obj.recipient;
              const hasObjectId = obj.objectId && typeof obj.objectId === 'string';
              const hasObjectType = obj.objectType && typeof obj.objectType === 'string';
              const isCarbonCredit = hasObjectType && (obj.objectType.includes('CarbonCredit') || obj.objectType.includes('carbon_credit'));
              const isNotRegistry = !hasObjectType || (!obj.objectType.includes('Registry') && !obj.objectType.includes('Marketplace'));
              
              console.log(`[mintCarbonCredit] Checking transferred object:`, {
                type: obj.type,
                objectType: obj.objectType,
                objectId: obj.objectId,
                recipient: obj.recipient,
                isTransferred,
                isToAddress,
                isCarbonCredit,
                isNotRegistry,
                hasObjectId
              });
              
              return isTransferred && isToAddress && hasObjectId && isNotRegistry && (!hasObjectType || isCarbonCredit);
            });
            
            console.log(`[mintCarbonCredit] Found transferred objects:`, transferredObjects);
            
            if (transferredObjects.length > 0) {
              creditObjectId = (transferredObjects[0] as any).objectId;
              console.log(`[mintCarbonCredit] Extracted creditObjectId via transfer: ${creditObjectId}`);
            }
          }
          
          // Strategy 3: Look for any object transferred to the issuer (fallback)
          if (!creditObjectId) {
            const signerAddress = keypair.getPublicKey().toSuiAddress();
            console.log(`[mintCarbonCredit] Looking for objects transferred to issuer: ${signerAddress}`);
            
            const transferredToIssuer = result.objectChanges.filter((obj: any) => {
              if (obj.type !== 'transferred') return false;
              if (!obj.recipient || typeof obj.recipient !== 'object') return false;
              if (!('AddressOwner' in obj.recipient)) return false;
              
              const recipientAddress = obj.recipient.AddressOwner;
              const isToIssuer = recipientAddress === signerAddress;
              const hasObjectId = obj.objectId && typeof obj.objectId === 'string';
              const isNotSystemObject = !obj.objectType?.includes('Registry') && 
                                       !obj.objectType?.includes('Marketplace') &&
                                       !obj.objectType?.includes('DIDRegistry');
              
              console.log(`[mintCarbonCredit] Checking transfer to issuer:`, {
                objectId: obj.objectId,
                objectType: obj.objectType,
                recipientAddress,
                isToIssuer,
                hasObjectId,
                isNotSystemObject
              });
              
              return isToIssuer && hasObjectId && isNotSystemObject;
            });
            
            console.log(`[mintCarbonCredit] Found objects transferred to issuer:`, transferredToIssuer);
            
            if (transferredToIssuer.length > 0) {
              creditObjectId = (transferredToIssuer[0] as any).objectId;
              console.log(`[mintCarbonCredit] Extracted creditObjectId via issuer transfer: ${creditObjectId}`);
            }
          }
        }
        
        // Strategy 4: Try to extract from events
        if (!creditObjectId && result.events && Array.isArray(result.events)) {
          console.log(`[mintCarbonCredit] Trying events:`, JSON.stringify(result.events, null, 2));
          for (const event of result.events) {
            if (event.parsedJson && (event.parsedJson as any).credit_id) {
              creditObjectId = (event.parsedJson as any).credit_id;
              console.log(`[mintCarbonCredit] Found creditObjectId in event: ${creditObjectId}`);
              break;
            }
          }
        }
        
        // Update project storage
        const userProjects = registeredProjects.get(normalizedOwner);
        if (userProjects) {
          const projectIndex = userProjects.findIndex(p => p.projectId === data.projectId);
          if (projectIndex !== -1) {
            userProjects[projectIndex].creditObjectId = creditObjectId;
            console.log(`[mintCarbonCredit] Updated project ${data.projectId} with creditObjectId: ${creditObjectId}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      txDigest: result.digest,
      events: result.events,
      objectChanges: result.objectChanges,
    });
    
  } catch (error) {
    console.error(`[mintCarbonCredit] Blockchain minting failed for project ${data.projectId}:`, error);
    
    // For development: if blockchain call fails, simulate minting locally
    const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
    if (userAddress) {
      const normalizedOwner = normalizeSuiAddress(userAddress);
      
      const userProjects = registeredProjects.get(normalizedOwner);
      if (userProjects) {
        const projectIndex = userProjects.findIndex(p => p.projectId === data.projectId);
        if (projectIndex !== -1) {
          // Generate a proper 64-character Sui object ID format for mock
          const randomHex = Array.from({length: 62}, () => Math.floor(Math.random() * 16).toString(16)).join('');
          const mockCreditId = `0x${randomHex.padStart(62, '0')}`;
          userProjects[projectIndex].creditObjectId = mockCreditId;
          console.log(`[mintCarbonCredit] Simulated minting for project ${data.projectId} with mock ID: ${mockCreditId}`);
          
          return NextResponse.json({
            success: true,
            txDigest: `simulated_tx_${Date.now()}`,
            events: [],
            objectChanges: [
              {
                type: 'created',
                objectType: '0x2::carbon_credit::CarbonCredit',
                objectId: mockCreditId
              }
            ],
            note: 'Credit minted locally (blockchain call failed - this is expected in development)'
          });
        }
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Credit minting failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function listCreditForSale(data: any, keypair: Ed25519Keypair) {
  const signerAddress = keypair.getPublicKey().toSuiAddress();
  console.log(`[listCreditForSale] Transaction signer address: ${signerAddress}`);
  console.log(`[listCreditForSale] Credit ID: ${data.creditId}`);
  console.log(`[listCreditForSale] Full request data:`, JSON.stringify(data, null, 2));
  
  // Debug: Check what's stored in our project registry
  const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
  if (userAddress) {
    const normalizedOwner = normalizeSuiAddress(userAddress);
    const userProjects = registeredProjects.get(normalizedOwner);
    console.log(`[listCreditForSale] Stored projects for user:`, JSON.stringify(userProjects, null, 2));
    
    if (userProjects && data.projectId) {
      const project = userProjects.find(p => p.projectId === data.projectId);
      console.log(`[listCreditForSale] Found project:`, JSON.stringify(project, null, 2));
      
      if (project && project.creditObjectId && project.creditObjectId !== data.creditId) {
        console.log(`[listCreditForSale] WARNING: creditId mismatch!`);
        console.log(`[listCreditForSale] Request creditId: ${data.creditId}`);
        console.log(`[listCreditForSale] Stored creditId: ${project.creditObjectId}`);
        
        // Override with the correct credit ID from our storage
        data.creditId = project.creditObjectId;
        console.log(`[listCreditForSale] Using corrected creditId: ${data.creditId}`);
      }
    }
  }
  
  // Validate credit ID format
  if (!data.creditId || !isValidSuiAddress(data.creditId)) {
    return NextResponse.json({
      success: false,
      error: `Invalid credit ID format: ${data.creditId}. Credit ID must be a valid Sui object ID starting with 0x.`
    }, { status: 400 });
  }

  // Validate required fields
  if (typeof data.price !== 'number' || data.price <= 0) {
    return NextResponse.json({
      success: false,
      error: 'Price must be a positive number'
    }, { status: 400 });
  }

  if (typeof data.reservedForCommunity !== 'boolean') {
    return NextResponse.json({
      success: false,
      error: 'reservedForCommunity must be a boolean'
    }, { status: 400 });
  }

  // For development/testing, if we get a mock credit ID, return a mock success response
  if (isMockObjectId(data.creditId)) {
    // Update project status to 'listed' for mock transactions too
    const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
    if (userAddress) {
      const normalizedOwner = normalizeSuiAddress(userAddress);
      const userProjects = registeredProjects.get(normalizedOwner);
      if (userProjects) {
        const projectIndex = userProjects.findIndex(p => p.creditObjectId === data.creditId);
        if (projectIndex !== -1) {
          userProjects[projectIndex].status = 'listed';
          console.log(`[listCreditForSale] Mock listed credit ${data.creditId} for project ${userProjects[projectIndex].projectId}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      txDigest: `mock_tx_${Date.now()}`,
      message: `Mock credit ${data.creditId} listed for sale at ${data.price} mist units`,
      note: 'This is a mock transaction for development. In production, this would interact with the Sui blockchain.',
      events: [
        {
          type: 'CreditListed',
          creditId: data.creditId,
          price: data.price,
          reservedForCommunity: data.reservedForCommunity
        }
      ],
    });
  }

  const tx = new Transaction();
  
  const marketplaceId = process.env.MARKETPLACE_ID || '0x2';
  console.log(`[listCreditForSale] Marketplace ID: ${marketplaceId}`);

  // Defensive check for creditId
  if (!data.creditId || typeof data.creditId !== 'string') {
    console.error('[listCreditForSale] Invalid or missing creditId:', data.creditId);
    return NextResponse.json({
      success: false,
      error: 'Credit object ID is required and must be a string.',
    }, { status: 400 });
  }

  console.log('[listCreditForSale] Using creditId:', data.creditId, 'type:', typeof data.creditId);

  // Fetch the object reference for the credit object
  const creditObjectInfo = await suiClient.getObject({
    id: data.creditId,
    options: { showType: true, showOwner: true, showPreviousTransaction: true },
  });
  console.log('[listCreditForSale] creditObjectInfo.data:', JSON.stringify(creditObjectInfo.data, null, 2));
  
  // Validate that this is actually a CarbonCredit object and not a Registry
  if (creditObjectInfo.data?.type) {
    const objectType = creditObjectInfo.data.type;
    if (objectType.includes('Registry') || objectType.includes('registry')) {
      console.error('[listCreditForSale] Error: Provided ID is a Registry object, not a CarbonCredit:', data.creditId);
      return NextResponse.json({
        success: false,
        error: 'Invalid credit ID: This appears to be a Registry object, not a CarbonCredit.',
      }, { status: 400 });
    }
    
    if (!objectType.includes('CarbonCredit') && !objectType.includes('carbon_credit')) {
      console.error('[listCreditForSale] Warning: Object type does not appear to be a CarbonCredit:', objectType);
    }
  }
  
  // Validate ownership (skip for shared objects)
  if (creditObjectInfo.data?.owner && typeof creditObjectInfo.data.owner === 'object') {
    if ('AddressOwner' in creditObjectInfo.data.owner) {
      const creditOwner = creditObjectInfo.data.owner.AddressOwner;
      console.log(`[listCreditForSale] Credit owner: ${creditOwner}, Signer: ${signerAddress}`);
      
      if (creditOwner !== signerAddress) {
        console.error('[listCreditForSale] Ownership validation failed:', {
          creditOwner,
          signerAddress,
          creditId: data.creditId
        });
        return NextResponse.json({
          success: false,
          error: 'You do not own this credit.',
        }, { status: 403 });
      }
    } else if ('Shared' in creditObjectInfo.data.owner) {
      console.error('[listCreditForSale] Error: Cannot list a shared object for sale:', data.creditId);
      return NextResponse.json({
        success: false,
        error: 'Cannot list shared objects for sale.',
      }, { status: 400 });
    }
  }
  
  const ref = creditObjectInfo.data && creditObjectInfo.data.objectId && creditObjectInfo.data.version && creditObjectInfo.data.digest
    ? {
        objectId: creditObjectInfo.data.objectId,
        version: creditObjectInfo.data.version,
        digest: creditObjectInfo.data.digest,
      }
    : null;
  if (!ref) {
    console.error('[listCreditForSale] Could not construct object reference for creditId:', data.creditId);
    return NextResponse.json({
      success: false,
      error: 'Could not construct object reference for creditId.',
    }, { status: 400 });
  }

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::list_credit_for_sale`,
    arguments: [
      tx.object(marketplaceId),
      tx.objectRef(ref),
      tx.pure.u64(data.price),
      tx.pure.bool(data.reservedForCommunity),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  // Update project status to 'listed' after successful listing
  if (result.digest) {
    const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
    if (userAddress) {
      const normalizedOwner = normalizeSuiAddress(userAddress);
      const userProjects = registeredProjects.get(normalizedOwner);
      if (userProjects) {
        // Find project by creditObjectId
        const projectIndex = userProjects.findIndex(p => p.creditObjectId === data.creditId);
        if (projectIndex !== -1) {
          userProjects[projectIndex].status = 'listed';
          console.log(`[listCreditForSale] Listed credit ${data.creditId} for project ${userProjects[projectIndex].projectId}`);
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function buyCarbonCredit(data: any, keypair: Ed25519Keypair) {
  // Validate credit ID format
  if (!data.creditId || !isValidSuiAddress(data.creditId)) {
    return NextResponse.json({
      success: false,
      error: `Invalid credit ID format: ${data.creditId}. Credit ID must be a valid Sui object ID starting with 0x.`
    }, { status: 400 });
  }

  // Validate payment amount
  if (typeof data.paymentAmount !== 'number' || data.paymentAmount <= 0) {
    return NextResponse.json({
      success: false,
      error: 'Payment amount must be a positive number'
    }, { status: 400 });
  }

  // For development/testing, if we get a mock credit ID, return a mock success response
  if (isMockObjectId(data.creditId)) {
    return NextResponse.json({
      success: true,
      txDigest: `mock_tx_${Date.now()}`,
      message: `Mock purchase of credit ${data.creditId} for ${data.paymentAmount} mist units`,
      note: 'This is a mock transaction for development. In production, this would interact with the Sui blockchain.',
      events: [
        {
          type: 'CreditPurchased',
          creditId: data.creditId,
          paymentAmount: data.paymentAmount,
          buyer: 'mock_buyer_address'
        }
      ],
    });
  }


  const tx = new Transaction();
  const marketplaceId = process.env.MARKETPLACE_ID || '0x2';
  const [paymentCoin] = tx.splitCoins(tx.gas, [data.paymentAmount]);

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::buy_credit`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(data.creditId),
      paymentCoin,
    ],
  });
  // Set a reasonable gas budget (adjust as needed)
  tx.setGasBudget(100000000);

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function retireCarbonCredit(data: any, keypair: Ed25519Keypair) {
  // Validate credit ID format
  if (!data.creditId || !isValidSuiAddress(data.creditId)) {
    return NextResponse.json({
      success: false,
      error: `Invalid credit ID format: ${data.creditId}. Credit ID must be a valid Sui object ID starting with 0x.`
    }, { status: 400 });
  }

  // Validate retirement reason
  if (!data.retirementReason || typeof data.retirementReason !== 'string') {
    return NextResponse.json({
      success: false,
      error: 'Retirement reason is required and must be a string'
    }, { status: 400 });
  }

  // For development/testing, if we get a mock credit ID, return a mock success response
  if (isMockObjectId(data.creditId)) {
    return NextResponse.json({
      success: true,
      txDigest: `mock_tx_${Date.now()}`,
      message: `Mock retirement of credit ${data.creditId} with reason: ${data.retirementReason}`,
      note: 'This is a mock transaction for development. In production, this would interact with the Sui blockchain.',
      events: [
        {
          type: 'CreditRetired',
          creditId: data.creditId,
          retirementReason: data.retirementReason,
          retiredBy: 'mock_user_address'
        }
      ],
    });
  }

  const tx = new Transaction();
  
  const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::retire_credit`,
    arguments: [
      tx.object(registryId),
      tx.object(data.creditId),
      tx.pure.string(data.retirementReason),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function verifyProject(data: any, keypair: Ed25519Keypair) {
  console.log(`[verifyProject] Attempting to verify project: ${data.projectId}`);
  
  // First, check current project status to determine action
  const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
  let currentProject = null;
  
  if (userAddress) {
    const normalizedOwner = normalizeSuiAddress(userAddress);
    const userProjects = registeredProjects.get(normalizedOwner);
    if (userProjects) {
      currentProject = userProjects.find(p => p.projectId === data.projectId);
    }
  }
  
  try {
    const tx = new Transaction();
    
    const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

    tx.moveCall({
      target: `${PACKAGE_ID}::carbon_credit::verify_project`,
      arguments: [
        tx.object(registryId),
        tx.pure.string(data.projectId),
      ],
    });

    tx.setGasBudget(100000000);

    const result = await suiClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    // Update the project status in temporary storage
    if (result.digest) {
      const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
      if (userAddress) {
        const normalizedOwner = normalizeSuiAddress(userAddress);
        
        const userProjects = registeredProjects.get(normalizedOwner);
        if (userProjects) {
          const projectIndex = userProjects.findIndex(p => p.projectId === data.projectId);
          if (projectIndex !== -1) {
            const project = userProjects[projectIndex];
            
            // Determine action based on current status
            if (project.status === 'registered') {
              // Submit for verification
              project.submitted = true;
              project.status = 'submitted';
              console.log(`[verifyProject] Submitted project ${data.projectId} for verification`);
            } else if (project.status === 'submitted') {
              // Complete verification
              project.verified = true;
              project.status = 'verified';
              console.log(`[verifyProject] Verified project ${data.projectId}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      txDigest: result.digest,
      events: result.events,
    });
    
  } catch (error) {
    console.error(`[verifyProject] Blockchain verification failed for project ${data.projectId}:`, error);
    
    // For development: if blockchain call fails, simulate verification locally
    // This allows the demo to work while blockchain integration is being refined
    const userAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
    if (userAddress) {
      const normalizedOwner = normalizeSuiAddress(userAddress);
      
      const userProjects = registeredProjects.get(normalizedOwner);
      if (userProjects) {
        const projectIndex = userProjects.findIndex(p => p.projectId === data.projectId);
        if (projectIndex !== -1) {
          const project = userProjects[projectIndex];
          
          // Determine action based on current status
          if (project.status === 'registered') {
            // Submit for verification
            project.submitted = true;
            project.status = 'submitted';
            console.log(`[verifyProject] Simulated submission for project ${data.projectId}`);
          } else if (project.status === 'submitted') {
            // Complete verification
            project.verified = true;
            project.status = 'verified';
            console.log(`[verifyProject] Simulated verification for project ${data.projectId}`);
          }
          
          return NextResponse.json({
            success: true,
            txDigest: `simulated_tx_${Date.now()}`,
            events: [],
            note: 'Project verified locally (blockchain call failed - this is expected in development)'
          });
        }
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Project verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function addVerifiedIssuer(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::add_verified_issuer`,
    arguments: [
      tx.object(registryId),
      tx.pure.address(data.issuerAddress),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function getStats() {
  try {
    // Get marketplace stats
    const marketplaceId = process.env.MARKETPLACE_ID || '0x2';
    const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

    // Validate the object IDs before making requests
    if (!isValidSuiAddress(marketplaceId) || !isValidSuiAddress(registryId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid contract object IDs configured',
        details: 'MARKETPLACE_ID and PROJECT_REGISTRY_ID must be valid Sui addresses'
      }, { status: 500 });
    }

    const normalizedMarketplaceId = normalizeSuiAddress(marketplaceId);
    const normalizedRegistryId = normalizeSuiAddress(registryId);

    const [marketplace, registry] = await Promise.allSettled([
      suiClient.getObject({
        id: normalizedMarketplaceId,
        options: { showContent: true },
      }),
      suiClient.getObject({
        id: normalizedRegistryId,
        options: { showContent: true },
      }),
    ]);

    // Handle results
    const marketplaceData = marketplace.status === 'fulfilled' ? marketplace.value : null;
    const registryData = registry.status === 'fulfilled' ? registry.value : null;

    // Check for errors
    const errors = [];
    if (marketplace.status === 'rejected') {
      errors.push(`Marketplace error: ${marketplace.reason}`);
    }
    if (registry.status === 'rejected') {
      errors.push(`Registry error: ${registry.reason}`);
    }

    return NextResponse.json({
      success: true,
      marketplace: marketplaceData,
      registry: registryData,
      errors: errors.length > 0 ? errors : undefined,
      configured: {
        packageId: PACKAGE_ID,
        marketplaceId: normalizedMarketplaceId,
        registryId: normalizedRegistryId,
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get marketplace stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Function to get available credits in marketplace
async function getAvailableCredits() {
  try {
    // For demonstration, return some mock data
    // In a real implementation, you would query the marketplace smart contract
    const mockCredits = [
      {
        objectId: '0x123...marketplace_credit_1',
        content: {
          type: `${PACKAGE_ID}::carbon_credit::CarbonCredit`,
          fields: {
            project_id: 'FOREST_001',
            serial_number: 'FC-2024-001',
            vintage_year: 2024,
            quantity: 100,
            methodology: 'VCS',
            co2_data_hash: 'hash123'
          }
        },
        price: 1000000000, // 1 SUI in MIST
        seller: '0xseller123...',
        projectInfo: {
          name: 'Amazon Reforestation',
          location: 'Brazil',
          type: 'Forest Conservation'
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        credits: mockCredits,
        total: mockCredits.length
      }
    });
  } catch (error) {
    console.error('Error fetching available credits:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available credits',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Function to get minted credits by owner
async function getMintedCredits(ownerAddress: string) {
  try {
    if (!isValidSuiAddress(ownerAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid owner address format'
      }, { status: 400 });
    }

    const normalizedAddress = normalizeSuiAddress(ownerAddress);

    // Get all carbon credits owned by this address
    const ownedCredits = await suiClient.getOwnedObjects({
      owner: normalizedAddress,
      filter: {
        StructType: `${PACKAGE_ID}::carbon_credit::CarbonCredit`,
      },
      options: {
        showType: true,
        showContent: true,
      },
    });

    return NextResponse.json({
      success: true,
      credits: ownedCredits.data || [],
      total: ownedCredits.data?.length || 0,
      owner: normalizedAddress,
    });
  } catch (error) {
    console.error('Error fetching minted credits:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch minted credits',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Function to get registered projects by owner
async function getRegisteredProjects(ownerAddress: string) {
  try {
    if (!isValidSuiAddress(ownerAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid owner address format'
      }, { status: 400 });
    }

    const normalizedAddress = normalizeSuiAddress(ownerAddress);
    
    console.log(`[getRegisteredProjects] Looking for projects for owner: ${normalizedAddress}`);
    
    // Get registered projects from temporary storage
    // In production, this would query a proper database or blockchain index
    const userProjects = registeredProjects.get(normalizedAddress) || [];
    
    console.log(`[getRegisteredProjects] Found ${userProjects.length} projects for owner ${normalizedAddress}`);
    
    return NextResponse.json({
      success: true,
      projects: userProjects,
      owner: normalizedAddress,
      total: userProjects.length,
      note: userProjects.length === 0 ? 'No projects registered yet. Register a project to see it appear here.' : undefined
    });
      
  } catch (error) {
    console.error('Error in getRegisteredProjects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch registered projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get('address');
    const action = searchParams.get('action');
    const owner = searchParams.get('owner');

    // Handle different GET actions
    if (action === 'available_credits') {
      return await getAvailableCredits();
    }

    if (action === 'minted_credits' && owner) {
      return await getMintedCredits(owner);
    }

    if (action === 'registered_projects' && owner) {
      return await getRegisteredProjects(owner);
    }

    if (userAddress) {
      // Validate and normalize the Sui address
      if (!isValidSuiAddress(userAddress)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid Sui address format. Address must be a valid hexadecimal string starting with 0x' 
          },
          { status: 400 }
        );
      }

      const normalizedAddress = normalizeSuiAddress(userAddress);

      try {
        // Get user's carbon credits
        const objects = await suiClient.getOwnedObjects({
          owner: normalizedAddress,
          filter: {
            StructType: `${PACKAGE_ID}::carbon_credit::CarbonCredit`,
          },
          options: {
            showType: true,
            showContent: true,
          },
        });

        // Transform the blockchain objects to include project information
        // In a real implementation, you would join this data with project registry
        const transformedCredits = objects.data?.map((obj, index) => {
          const content = obj.data?.content as any;
          const fields = content?.fields || {};
          
          // Mock project information based on the credit data
          const projectTypes = ['Forest Conservation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking'];
          const locations = ['Brazil', 'Kenya', 'Philippines', 'India', 'Costa Rica'];
          const projectNames = [
            'Amazon Rainforest Conservation',
            'Solar Farm Initiative', 
            'Mangrove Restoration',
            'Clean Cooking Solutions',
            'Wind Energy Project'
          ];

          return {
            object_id: obj.data?.objectId,
            project_name: projectNames[index % projectNames.length],
            name: projectNames[index % projectNames.length],
            location: locations[index % locations.length],
            project_type: projectTypes[index % projectTypes.length],
            methodology: fields.methodology || 'VCS',
            credit_amount: fields.quantity || 100,
            quantity: fields.quantity || 100,
            vintage_year: fields.vintage_year || 2024,
            verification_status: 'verified',
            verified: true,
            purchase_date: new Date().toISOString().slice(0, 10),
            timestamp: new Date().toISOString(),
            retired: false,
            // Raw blockchain data
            rawData: obj
          };
        }) || [];

        return NextResponse.json({
          success: true,
          credits: transformedCredits,
          address: normalizedAddress,
          totalCredits: transformedCredits.length,
          availableCredits: transformedCredits.filter(c => !c.retired).length,
          lockedCredits: 0
        });
      } catch (suiError) {
        console.error('Sui client error:', suiError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to fetch user credits from blockchain',
            details: suiError instanceof Error ? suiError.message : 'Unknown blockchain error'
          },
          { status: 500 }
        );
      }
    }

    // Return general stats
    return await getStats();
  } catch (error) {
    console.error('Smart contract GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// --- Fractional Credits Handlers ---
async function fractionalizeCredit(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: creditId, totalFractions, pricePerFraction, minPurchase, treasuryCapId
  tx.moveCall({
    target: `${PACKAGE_ID}::fractional_credits::fractionalize_credit`,
    arguments: [
      tx.object(data.creditId),
      tx.pure.u64(data.totalFractions),
      tx.pure.u64(data.pricePerFraction),
      tx.pure.u64(data.minPurchase),
      tx.object(data.treasuryCapId),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
    objectChanges: result.objectChanges,
  });
}

async function purchaseFractions(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: poolId, fractionsToBuy, paymentAmount
  const [paymentCoin] = tx.splitCoins(tx.gas, [data.paymentAmount]);
  tx.moveCall({
    target: `${PACKAGE_ID}::fractional_credits::purchase_fractions`,
    arguments: [
      tx.object(data.poolId),
      tx.pure.u64(data.fractionsToBuy),
      paymentCoin,
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function claimMicroCredits(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: microSystemId, actionType, evidenceHash (hex), treasuryCapId
  tx.moveCall({
    target: `${PACKAGE_ID}::fractional_credits::claim_micro_credits`,
    arguments: [
      tx.object(data.microSystemId),
      tx.pure.string(data.actionType),
      tx.pure.vector('u8', Array.from(Buffer.from(data.evidenceHash, 'hex'))),
      tx.object(data.treasuryCapId),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function retireFractions(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: fractionsCoinId, retirementReason, treasuryCapId
  tx.moveCall({
    target: `${PACKAGE_ID}::fractional_credits::retire_fractions`,
    arguments: [
      tx.object(data.fractionsCoinId),
      tx.pure.string(data.retirementReason),
      tx.object(data.treasuryCapId),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

// --- Integration Bridge Handlers ---
async function initializeHub(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: carbonRegistryId, marketplaceId, oracleRegistryId, didManagerId, microSystemId
  tx.moveCall({
    target: `${PACKAGE_ID}::integration_bridge::initialize_hub`,
    arguments: [
      tx.object(data.carbonRegistryId),
      tx.object(data.marketplaceId),
      tx.object(data.oracleRegistryId),
      tx.object(data.didManagerId),
      tx.object(data.microSystemId),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
    objectChanges: result.objectChanges,
  });
}

async function registerVerifiedProject(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: hubId, registryId, oracleRegistryId, projectId, name, description, location, projectType, co2ReductionCapacity, beneficiaryCommunity, oracleDataSource, measurementMethodology
  tx.moveCall({
    target: `${PACKAGE_ID}::integration_bridge::register_verified_project`,
    arguments: [
      tx.object(data.hubId),
      tx.object(data.registryId),
      tx.object(data.oracleRegistryId),
      tx.pure.string(data.projectId),
      tx.pure.string(data.name),
      tx.pure.string(data.description),
      tx.pure.string(data.location),
      tx.pure.u8(data.projectType),
      tx.pure.u64(data.co2ReductionCapacity),
      tx.pure.option('string', data.beneficiaryCommunity),
      tx.pure.string(data.oracleDataSource),
      tx.pure.string(data.measurementMethodology),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function onboardCommunityMember(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: hubId, didManagerId, microSystemId, did, encryptedAttributes (string[]), attributeKeys (string[]), privacyHash (hex), communityContext (string or null)
  tx.moveCall({
    target: `${PACKAGE_ID}::integration_bridge::onboard_community_member`,
    arguments: [
      tx.object(data.hubId),
      tx.object(data.didManagerId),
      tx.object(data.microSystemId),
      tx.pure.string(data.did),
      tx.pure.vector('string', data.encryptedAttributes),
      tx.pure.vector('string', data.attributeKeys),
      tx.pure.vector('u8', Array.from(Buffer.from(data.privacyHash, 'hex'))),
      tx.pure.option('string', data.communityContext),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function issueVerifiedCredits(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: hubId, registryId, oracleRegistryId, verificationRequestId, projectId, serialNumber, vintageYear, quantity, methodology, metadataUri, co2DataHash (hex)
  tx.moveCall({
    target: `${PACKAGE_ID}::integration_bridge::issue_verified_credits`,
    arguments: [
      tx.object(data.hubId),
      tx.object(data.registryId),
      tx.object(data.oracleRegistryId),
      tx.object(data.verificationRequestId),
      tx.pure.string(data.projectId),
      tx.pure.string(data.serialNumber),
      tx.pure.u16(data.vintageYear),
      tx.pure.u64(data.quantity),
      tx.pure.string(data.methodology),
      tx.pure.string(data.metadataUri),
      tx.pure.vector('u8', Array.from(Buffer.from(data.co2DataHash, 'hex'))),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function communityVerifiedTrade(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: hubId, marketplaceId, didManagerId, creditId, paymentAmount
  const [paymentCoin] = tx.splitCoins(tx.gas, [data.paymentAmount]);
  tx.moveCall({
    target: `${PACKAGE_ID}::integration_bridge::community_verified_trade`,
    arguments: [
      tx.object(data.hubId),
      tx.object(data.marketplaceId),
      tx.object(data.didManagerId),
      tx.pure.id(data.creditId),
      paymentCoin,
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function recordComprehensiveAction(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: hubId, didManagerId, microSystemId, actionType, evidenceHash (hex), locationContext (string or null), communityVerification (bool)
  tx.moveCall({
    target: `${PACKAGE_ID}::integration_bridge::record_comprehensive_action`,
    arguments: [
      tx.object(data.hubId),
      tx.object(data.didManagerId),
      tx.object(data.microSystemId),
      tx.pure.string(data.actionType),
      tx.pure.vector('u8', Array.from(Buffer.from(data.evidenceHash, 'hex'))),
      tx.pure.option('string', data.locationContext),
      tx.pure.bool(data.communityVerification),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function grantPermissions(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: hubId, grantee, canVerifyProjects, canProcessOracleData, canValidateCommunity, canMintMicroCredits, reputationLevel
  tx.moveCall({
    target: `${PACKAGE_ID}::integration_bridge::grant_permissions`,
    arguments: [
      tx.object(data.hubId),
      tx.pure.address(data.grantee),
      tx.pure.bool(data.canVerifyProjects),
      tx.pure.bool(data.canProcessOracleData),
      tx.pure.bool(data.canValidateCommunity),
      tx.pure.bool(data.canMintMicroCredits),
      tx.pure.u8(data.reputationLevel),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function generateImpactReport(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: hubId, registryId, marketplaceId, projectId
  tx.moveCall({
    target: `${PACKAGE_ID}::integration_bridge::generate_impact_report`,
    arguments: [
      tx.object(data.hubId),
      tx.object(data.registryId),
      tx.object(data.marketplaceId),
      tx.pure.string(data.projectId),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

// --- DID Manager Handlers ---
async function createIdentity(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: didManagerId, did, encryptedAttributes (string[]), attributeKeys (string[]), privacyHash (hex), communityContext (string or null)
  tx.moveCall({
    target: `${PACKAGE_ID}::did_manager::create_identity`,
    arguments: [
      tx.object(data.didManagerId),
      tx.pure.string(data.did),
      tx.pure.vector('string', data.encryptedAttributes),
      tx.pure.vector('string', data.attributeKeys),
      tx.pure.vector('u8', Array.from(Buffer.from(data.privacyHash, 'hex'))),
      tx.pure.option('string', data.communityContext),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function updatePrivacySettings(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: didManagerId, publicProfile, shareReputation, allowCommunityVerification, dataRetentionDays
  tx.moveCall({
    target: `${PACKAGE_ID}::did_manager::update_privacy_settings`,
    arguments: [
      tx.object(data.didManagerId),
      tx.pure.bool(data.publicProfile),
      tx.pure.bool(data.shareReputation),
      tx.pure.bool(data.allowCommunityVerification),
      tx.pure.u64(data.dataRetentionDays),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function registerCommunityVerifier(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: didManagerId, communityName, specialization, didAnchor (string or null)
  tx.moveCall({
    target: `${PACKAGE_ID}::did_manager::register_community_verifier`,
    arguments: [
      tx.object(data.didManagerId),
      tx.pure.string(data.communityName),
      tx.pure.string(data.specialization),
      tx.pure.option('string', data.didAnchor),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function requestVerification(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: didManagerId, verificationType, evidenceHash (hex), communityContext (string or null)
  tx.moveCall({
    target: `${PACKAGE_ID}::did_manager::request_verification`,
    arguments: [
      tx.object(data.didManagerId),
      tx.pure.u8(data.verificationType),
      tx.pure.vector('u8', Array.from(Buffer.from(data.evidenceHash, 'hex'))),
      tx.pure.option('string', data.communityContext),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function processVerification(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: didManagerId, requestId, approved (bool)
  tx.moveCall({
    target: `${PACKAGE_ID}::did_manager::process_verification`,
    arguments: [
      tx.object(data.didManagerId),
      tx.object(data.requestId),
      tx.pure.bool(data.approved),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function recordSustainabilityAction(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: didManagerId, actionType, creditsEarned, evidenceHash (hex)
  tx.moveCall({
    target: `${PACKAGE_ID}::did_manager::record_sustainability_action`,
    arguments: [
      tx.object(data.didManagerId),
      tx.pure.string(data.actionType),
      tx.pure.u64(data.creditsEarned),
      tx.pure.vector('u8', Array.from(Buffer.from(data.evidenceHash, 'hex'))),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function endorseCommunityMember(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: didManagerId, endorsee (address)
  tx.moveCall({
    target: `${PACKAGE_ID}::did_manager::endorse_community_member`,
    arguments: [
      tx.object(data.didManagerId),
      tx.pure.address(data.endorsee),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

// --- Oracle Integration Handlers ---
async function registerOracle(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: oracleRegistryId, oracleAddress, stakeAmount
  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::register_oracle`,
    arguments: [
      tx.object(data.oracleRegistryId),
      tx.pure.address(data.oracleAddress),
      tx.pure.u64(data.stakeAmount),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function requestCO2Verification(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: projectId, measurementType, value, unit, locationHash (hex), methodology
  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::request_co2_verification`,
    arguments: [
      tx.pure.string(data.projectId),
      tx.pure.string(data.measurementType),
      tx.pure.u64(data.value),
      tx.pure.string(data.unit),
      tx.pure.vector('u8', Array.from(Buffer.from(data.locationHash, 'hex'))),
      tx.pure.string(data.methodology),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function submitOracleVerification(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: oracleRegistryId, requestId, verifiedValue, confidence, evidenceHash (hex)
  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::submit_oracle_verification`,
    arguments: [
      tx.object(data.oracleRegistryId),
      tx.object(data.requestId),
      tx.pure.u64(data.verifiedValue),
      tx.pure.u64(data.confidence),
      tx.pure.vector('u8', Array.from(Buffer.from(data.evidenceHash, 'hex'))),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function updateDataFeed(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: oracleRegistryId, feedId, dataType, value, sourceHash (hex)
  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::update_data_feed`,
    arguments: [
      tx.object(data.oracleRegistryId),
      tx.pure.string(data.feedId),
      tx.pure.u8(data.dataType),
      tx.pure.u64(data.value),
      tx.pure.vector('u8', Array.from(Buffer.from(data.sourceHash, 'hex'))),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function slashOracle(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  // Required: oracleRegistryId, oracleAddress, reason, slashAmount
  tx.moveCall({
    target: `${PACKAGE_ID}::oracle_integration::slash_oracle`,
    arguments: [
      tx.object(data.oracleRegistryId),
      tx.pure.address(data.oracleAddress),
      tx.pure.string(data.reason),
      tx.pure.u64(data.slashAmount),
    ],
  });
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}
