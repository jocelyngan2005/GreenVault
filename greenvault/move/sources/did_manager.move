// File: sources/did_manager.move
// Enhanced Decentralized Identity Manager for GreenVault

module greenvault::did_manager {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};
    use std::string::{String};
    use std::option::{Self, Option};
    use std::vector;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_IDENTITY_EXISTS: u64 = 2;
    const E_INVALID_VERIFICATION: u64 = 3;
    const E_INSUFFICIENT_REPUTATION: u64 = 4;
    const E_IDENTITY_NOT_FOUND: u64 = 5;

    // Verification levels
    const VERIFICATION_BASIC: u8 = 0;
    #[allow(unused_const)]
    const VERIFICATION_KYC: u8 = 1;
    const VERIFICATION_COMMUNITY: u8 = 2;
    #[allow(unused_const)]
    const VERIFICATION_INSTITUTIONAL: u8 = 3;

    // Enhanced DID Registry with privacy features
    struct DIDManager has key {
        id: UID,
        admin: address,
        identities: Table<address, Identity>,
        community_verifiers: Table<address, CommunityVerifier>,
        verification_requests: Table<ID, ID>, // Just store request IDs since objects are shared
        reputation_system: ReputationSystem,
        privacy_settings: Table<address, PrivacySettings>,
    }

    struct Identity has store {
        did: String,
        verification_level: u8,
        attributes: VecMap<String, String>, // Encrypted attributes
        reputation_score: u64,
        community_endorsements: vector<address>,
        sustainability_credits: u64,
        privacy_hash: vector<u8>, // Zero-knowledge proof hash
        created_at: u64,
        last_updated: u64,
        verified_by: Option<address>,
    }

    struct CommunityVerifier has store {
        verifier_address: address,
        community_name: String,
        verification_count: u64,
        reputation: u64,
        specialization: String, // "refugee_aid", "environmental", "financial_inclusion"
        active: bool,
        did_anchor: Option<String>,
    }

    struct VerificationRequest has key, store {
        id: UID,
        requester: address,
        verification_type: u8,
        evidence_hash: vector<u8>,
        community_context: Option<String>,
        status: u8, // 0: Pending, 1: Approved, 2: Rejected
        verifier: Option<address>,
        created_at: u64,
        processed_at: Option<u64>,
    }

    struct ReputationSystem has store {
        total_verified_users: u64,
        community_verifications: u64,
        sustainability_actions: u64,
        fraud_reports: Table<address, u64>,
    }

    struct PrivacySettings has store {
        public_profile: bool,
        share_reputation: bool,
        allow_community_verification: bool,
        data_retention_days: u64,
        encryption_key_hash: vector<u8>,
    }

    // Events
    struct IdentityCreated has copy, drop {
        user: address,
        did: String,
        verification_level: u8,
        community_context: Option<String>,
    }

    struct VerificationCompleted has copy, drop {
        user: address,
        new_level: u8,
        verifier: address,
        community: Option<String>,
    }

    struct SustainabilityAction has copy, drop {
        user: address,
        action_type: String,
        credits_earned: u64,
        evidence_hash: vector<u8>,
    }

    // Initialize DID Manager
    fun init(ctx: &mut TxContext) {
        let reputation_system = ReputationSystem {
            total_verified_users: 0,
            community_verifications: 0,
            sustainability_actions: 0,
            fraud_reports: table::new(ctx),
        };

        let did_manager = DIDManager {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            identities: table::new(ctx),
            community_verifiers: table::new(ctx),
            verification_requests: table::new(ctx),
            reputation_system,
            privacy_settings: table::new(ctx),
        };

        transfer::share_object(did_manager);
    }

    // Create privacy-preserving identity
    public entry fun create_identity(
        did_manager: &mut DIDManager,
        did: String,
        encrypted_attributes: vector<String>, // Pre-encrypted client-side
        attribute_keys: vector<String>,
        privacy_hash: vector<u8>,
        community_context: Option<String>,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        assert!(!table::contains(&did_manager.identities, user), E_IDENTITY_EXISTS);

        // Create attribute map from encrypted data
        let attributes = vec_map::empty<String, String>();
        let i = 0;
        while (i < vector::length(&attribute_keys)) {
            vec_map::insert(
                &mut attributes,
                *vector::borrow(&attribute_keys, i),
                *vector::borrow(&encrypted_attributes, i)
            );
            i = i + 1;
        };

        let identity = Identity {
            did,
            verification_level: VERIFICATION_BASIC,
            attributes,
            reputation_score: 100, // Starting reputation
            community_endorsements: vector::empty(),
            sustainability_credits: 0,
            privacy_hash,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            last_updated: tx_context::epoch_timestamp_ms(ctx),
            verified_by: option::none(),
        };

        // Default privacy settings
        let privacy_settings = PrivacySettings {
            public_profile: false,
            share_reputation: true,
            allow_community_verification: true,
            data_retention_days: 365,
            encryption_key_hash: privacy_hash,
        };

        table::add(&mut did_manager.identities, user, identity);
        table::add(&mut did_manager.privacy_settings, user, privacy_settings);

        did_manager.reputation_system.total_verified_users = 
            did_manager.reputation_system.total_verified_users + 1;

        event::emit(IdentityCreated {
            user,
            did,
            verification_level: VERIFICATION_BASIC,
            community_context,
        });
    }

    // Update privacy settings for an identity
    public entry fun update_privacy_settings(
        did_manager: &mut DIDManager,
        public_profile: bool,
        share_reputation: bool,
        allow_community_verification: bool,
        data_retention_days: u64,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        assert!(table::contains(&did_manager.identities, user), E_IDENTITY_NOT_FOUND);

        let privacy_settings = table::borrow_mut(&mut did_manager.privacy_settings, user);
        privacy_settings.public_profile = public_profile;
        privacy_settings.share_reputation = share_reputation;
        privacy_settings.allow_community_verification = allow_community_verification;
        privacy_settings.data_retention_days = data_retention_days;
    }

    // Register community verifier
    public entry fun register_community_verifier(
        did_manager: &mut DIDManager,
        community_name: String,
        specialization: String,
        did_anchor: Option<String>,
        ctx: &mut TxContext
    ) {
        let verifier_address = tx_context::sender(ctx);

        let verifier = CommunityVerifier {
            verifier_address,
            community_name,
            verification_count: 0,
            reputation: 100,
            specialization,
            active: true,
            did_anchor,
        };

        table::add(&mut did_manager.community_verifiers, verifier_address, verifier);
    }

    // Request verification upgrade
    public entry fun request_verification(
        did_manager: &mut DIDManager,
        verification_type: u8,
        evidence_hash: vector<u8>,
        community_context: Option<String>,
        ctx: &mut TxContext
    ) {
        let requester = tx_context::sender(ctx);
        assert!(table::contains(&did_manager.identities, requester), E_NOT_AUTHORIZED);

        let request = VerificationRequest {
            id: object::new(ctx),
            requester,
            verification_type,
            evidence_hash,
            community_context,
            status: 0, // Pending
            verifier: option::none(),
            created_at: tx_context::epoch_timestamp_ms(ctx),
            processed_at: option::none(),
        };

        let request_id = object::id(&request);
        transfer::share_object(request);
        table::add(&mut did_manager.verification_requests, request_id, request_id);
    }

    // Process verification (by community verifiers)
    public entry fun process_verification(
        did_manager: &mut DIDManager,
        request: &mut VerificationRequest,
        approved: bool,
        ctx: &mut TxContext
    ) {
        let verifier = tx_context::sender(ctx);
        assert!(table::contains(&did_manager.community_verifiers, verifier), E_NOT_AUTHORIZED);

        assert!(request.status == 0, E_INVALID_VERIFICATION); // Must be pending

        request.status = if (approved) 1 else 2;
        request.verifier = option::some(verifier);
        request.processed_at = option::some(tx_context::epoch_timestamp_ms(ctx));

        if (approved) {
            // Upgrade user's verification level
            let identity = table::borrow_mut(&mut did_manager.identities, request.requester);
            if (request.verification_type > identity.verification_level) {
                identity.verification_level = request.verification_type;
                identity.verified_by = option::some(verifier);
                identity.last_updated = tx_context::epoch_timestamp_ms(ctx);
            };

            // Update verifier stats
            let verifier_info = table::borrow_mut(&mut did_manager.community_verifiers, verifier);
            verifier_info.verification_count = verifier_info.verification_count + 1;
            verifier_info.reputation = verifier_info.reputation + 5;

            did_manager.reputation_system.community_verifications = 
                did_manager.reputation_system.community_verifications + 1;

            event::emit(VerificationCompleted {
                user: request.requester,
                new_level: request.verification_type,
                verifier,
                community: request.community_context,
            });
        };
    }

    // Record sustainability action for micro-credits
    public entry fun record_sustainability_action(
        did_manager: &mut DIDManager,
        action_type: String,
        credits_earned: u64,
        evidence_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        assert!(table::contains(&did_manager.identities, user), E_NOT_AUTHORIZED);

        let identity = table::borrow_mut(&mut did_manager.identities, user);
        identity.sustainability_credits = identity.sustainability_credits + credits_earned;
        identity.reputation_score = identity.reputation_score + (credits_earned / 10);
        identity.last_updated = tx_context::epoch_timestamp_ms(ctx);

        did_manager.reputation_system.sustainability_actions = 
            did_manager.reputation_system.sustainability_actions + 1;

        event::emit(SustainabilityAction {
            user,
            action_type,
            credits_earned,
            evidence_hash,
        });
    }

    // Community endorsement system
    public entry fun endorse_community_member(
        did_manager: &mut DIDManager,
        endorsee: address,
        ctx: &mut TxContext
    ) {
        let endorser = tx_context::sender(ctx);
        assert!(table::contains(&did_manager.identities, endorser), E_NOT_AUTHORIZED);
        assert!(table::contains(&did_manager.identities, endorsee), E_NOT_AUTHORIZED);

        let endorser_identity = table::borrow(&did_manager.identities, endorser);
        assert!(endorser_identity.verification_level >= VERIFICATION_COMMUNITY, E_INSUFFICIENT_REPUTATION);

        let endorsee_identity = table::borrow_mut(&mut did_manager.identities, endorsee);
        vector::push_back(&mut endorsee_identity.community_endorsements, endorser);
        endorsee_identity.reputation_score = endorsee_identity.reputation_score + 10;
    }

    // Getter functions with privacy controls
    public fun get_public_identity_info(
        did_manager: &DIDManager,
        user: address
    ): (u8, u64, u64, bool) {
        if (table::contains(&did_manager.identities, user) && 
            table::contains(&did_manager.privacy_settings, user)) {
            
            let identity = table::borrow(&did_manager.identities, user);
            let privacy = table::borrow(&did_manager.privacy_settings, user);
            
            if (privacy.public_profile) {
                (
                    identity.verification_level,
                    if (privacy.share_reputation) identity.reputation_score else 0,
                    identity.sustainability_credits,
                    true
                )
            } else {
                (0, 0, 0, false)
            }
        } else {
            (0, 0, 0, false)
        }
    }

    public fun get_verification_level(did_manager: &DIDManager, user: address): u8 {
        if (table::contains(&did_manager.identities, user)) {
            let identity = table::borrow(&did_manager.identities, user);
            identity.verification_level
        } else {
            0
        }
    }

    public fun get_manager_stats(did_manager: &DIDManager): (u64, u64, u64) {
        (
            did_manager.reputation_system.total_verified_users,
            did_manager.reputation_system.community_verifications,
            did_manager.reputation_system.sustainability_actions
        )
    }

    // Test-only functions
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
