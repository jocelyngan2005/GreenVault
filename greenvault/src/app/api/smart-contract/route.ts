// src/app/api/smart-contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Initialize Sui client
const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet' || 'devnet'),
});

// Contract package ID (set after deployment)
const PACKAGE_ID = process.env.SUI_PACKAGE_ID || '0x0';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data, privateKey } = body;

    // Create keypair from private key
    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));

    switch (action) {
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

async function mintCarbonCredit(data: any, keypair: Ed25519Keypair) {
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

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
  });

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
    objectChanges: result.objectChanges,
  });
}

async function listCreditForSale(data: any, keypair: Ed25519Keypair) {
  const tx = new Transaction();
  
  const marketplaceId = process.env.MARKETPLACE_ID || '0x2';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::list_credit_for_sale`,
    arguments: [
      tx.object(marketplaceId),
      tx.object(data.creditId),
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

  return NextResponse.json({
    success: true,
    txDigest: result.digest,
    events: result.events,
  });
}

async function buyCarbonCredit(data: any, keypair: Ed25519Keypair) {
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
  const tx = new Transaction();
  
  const registryId = process.env.PROJECT_REGISTRY_ID || '0x1';

  tx.moveCall({
    target: `${PACKAGE_ID}::carbon_credit::verify_project`,
    arguments: [
      tx.object(registryId),
      tx.pure.string(data.projectId),
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

    const [marketplace, registry] = await Promise.all([
      suiClient.getObject({
        id: marketplaceId,
        options: { showContent: true },
      }),
      suiClient.getObject({
        id: registryId,
        options: { showContent: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      marketplace,
      registry,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get stats',
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get('address');

    if (userAddress) {
      // Get user's carbon credits
      const objects = await suiClient.getOwnedObjects({
        owner: userAddress,
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
        credits: objects.data,
      });
    }

    // Return general stats
    return await getStats();
  } catch (error) {
    console.error('Smart contract GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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