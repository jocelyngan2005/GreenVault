// File: sources/integration_bridge.move
// Integration bridge between all GreenVault modules

module greenvault::integration_bridge {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::coin::Coin;
    use sui::sui::SUI;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use std::vector;

    // Import other modules
    use greenvault::carbon_credit::{Self, ProjectRegistry, Marketplace};
    use greenvault::oracle_integration::{Self, OracleRegistry, CO2VerificationRequest};
    use greenvault::did_manager::{Self, DIDManager};
    use greenvault::fractional_credits::{Self, MicroCreditSystem};

    // Central coordination hub
    struct GreenVaultHub has key {
        id: UID,
        admin: address,
        carbon_registry_id: ID,
        marketplace_id: ID,
        oracle_registry_id: ID,
        did_manager_id: ID,
        micro_system_id: ID,
        integration_stats: IntegrationStats,
        cross_module_permissions: Table<address, Permissions>,
    }

    struct IntegrationStats has store {
        total_verified_projects: u64,
        total_community_members: u64,
        total_micro_actions: u64,
        oracle_verifications: u64,
        fractional_trades: u64,
    }

    struct Permissions has store, drop {
        can_verify_projects: bool,
        can_process_oracle_data: bool,
        can_validate_community: bool,
        can_mint_micro_credits: bool,
        reputation_level: u8,
    }

    // Complete project lifecycle event
    struct ProjectLifecycleCompleted has copy, drop {
        project_id: String,
        developer: address,
        total_credits_issued: u64,
        oracle_verifications: u64,
        community_participants: u64,
        impact_score: u64,
    }

    // Initialize the integration hub
    public entry fun initialize_hub(
        carbon_registry: &ProjectRegistry,
        marketplace: &Marketplace,
        oracle_registry: &OracleRegistry,
        did_manager: &DIDManager,
        micro_system: &MicroCreditSystem,
        ctx: &mut TxContext
    ) {
        let stats = IntegrationStats {
            total_verified_projects: 0,
            total_community_members: 0,
            total_micro_actions: 0,
            oracle_verifications: 0,
            fractional_trades: 0,
        };

        let hub = GreenVaultHub {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            carbon_registry_id: object::id(carbon_registry),
            marketplace_id: object::id(marketplace),
            oracle_registry_id: object::id(oracle_registry),
            did_manager_id: object::id(did_manager),
            micro_system_id: object::id(micro_system),
            integration_stats: stats,
            cross_module_permissions: table::new(ctx),
        };

        transfer::share_object(hub);
    }

    // Integrated project registration with oracle verification
    #[allow(unused_variable)]
    public entry fun register_verified_project(
        hub: &mut GreenVaultHub,
        registry: &mut ProjectRegistry,
        _oracle_registry: &mut OracleRegistry,
        project_id: String,
        name: String,
        description: String,
        location: String,
        project_type: u8,
        co2_reduction_capacity: u64,
        beneficiary_community: Option<String>,
        oracle_data_source: String,
        measurement_methodology: String,
        ctx: &mut TxContext
    ) {
        let _developer = tx_context::sender(ctx);

        // 1. Register the project
        carbon_credit::register_project(
            registry,
            project_id,
            name,
            description,
            location,
            project_type,
            co2_reduction_capacity,
            beneficiary_community,
            oracle_data_source,
            option::none(),
            ctx
        );

        // 2. Request oracle verification
        oracle_integration::request_co2_verification(
            project_id,
            string::utf8(b"co2_sequestration_capacity"),
            co2_reduction_capacity,
            string::utf8(b"tons_co2_per_year"),
            b"location_hash_placeholder",
            measurement_methodology,
            ctx
        );

        // 3. Update hub stats
        hub.integration_stats.total_verified_projects = 
            hub.integration_stats.total_verified_projects + 1;
    }

    // Community member onboarding with DID and micro-credits
    #[allow(unused_variable)]
    public entry fun onboard_community_member(
        hub: &mut GreenVaultHub,
        did_manager: &mut DIDManager,
        micro_system: &mut MicroCreditSystem,
        did: String,
        encrypted_attributes: vector<String>,
        attribute_keys: vector<String>,
        privacy_hash: vector<u8>,
        community_context: Option<String>,
        ctx: &mut TxContext
    ) {
        let _user = tx_context::sender(ctx);

        // 1. Create DID identity
        did_manager::create_identity(
            did_manager,
            did,
            encrypted_attributes,
            attribute_keys,
            privacy_hash,
            community_context,
            ctx
        );

        // 2. Setup initial micro-credit actions for new users
        if (community_context == option::some(string::utf8(b"refugee"))) {
            // Special onboarding rewards for refugees
            let _welcome_actions = vector[
                string::utf8(b"identity_verification"),
                string::utf8(b"basic_recycling"),
                string::utf8(b"water_conservation")
            ];
            let i = 0;
            while (i < 3) {
                fractional_credits::setup_action_rewards(
                    micro_system,
                    *vector::borrow(&_welcome_actions, i),
                    25, // 25 micro-credits per action
                    ctx
                );
                i = i + 1;
            };
        };

        // 3. Update hub stats
        hub.integration_stats.total_community_members = 
            hub.integration_stats.total_community_members + 1;
    }

    // Integrated credit issuance with oracle verification
    #[allow(unused_variable)]
    public entry fun issue_verified_credits(
        hub: &mut GreenVaultHub,
        registry: &mut ProjectRegistry,
        _oracle_registry: &OracleRegistry,
        verification_request: &CO2VerificationRequest,
        project_id: String,
        serial_number: String,
        vintage_year: u16,
        quantity: u64,
        methodology: String,
        metadata_uri: String,
        co2_data_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        // 1. Verify oracle confirmation
        assert!(
            oracle_integration::is_verification_complete(verification_request),
            1 // E_NOT_VERIFIED
        );

        // 2. Mint carbon credits
        carbon_credit::mint_carbon_credit(
            registry,
            project_id,
            serial_number,
            vintage_year,
            quantity,
            methodology,
            metadata_uri,
            co2_data_hash,
            option::none(),
            ctx
        );

        // 3. Update integration stats
        hub.integration_stats.oracle_verifications = 
            hub.integration_stats.oracle_verifications + 1;
    }

    // Community trading with DID verification
    public entry fun community_verified_trade(
        hub: &mut GreenVaultHub,
        marketplace: &mut Marketplace,
        did_manager: &DIDManager,
        credit_id: ID,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);

        // 1. Verify buyer has community verification
        let verification_level = did_manager::get_verification_level(did_manager, buyer);
        assert!(verification_level >= 2, 1); // Must be community verified

        // 2. Execute trade with community priority
        carbon_credit::buy_credit(marketplace, credit_id, payment, ctx);

        // 3. Update stats
        hub.integration_stats.fractional_trades = 
            hub.integration_stats.fractional_trades + 1;
    }

    // Comprehensive sustainability action recording
    #[allow(unused_variable)]
    public entry fun record_comprehensive_action(
        hub: &mut GreenVaultHub,
        did_manager: &mut DIDManager,
        _micro_system: &mut MicroCreditSystem,
        action_type: String,
        evidence_hash: vector<u8>,
        _location_context: Option<String>,
        community_verification: bool,
        ctx: &mut TxContext
    ) {
        let _user = tx_context::sender(ctx);

        // 1. Record in DID system for reputation
        did_manager::record_sustainability_action(
            did_manager,
            action_type,
            10, // Base credits
            evidence_hash,
            ctx
        );

        // 2. If community verified, earn additional micro-credits
        if (community_verification) {
            // Additional micro-credits are handled in fractional_credits module
            hub.integration_stats.total_micro_actions = 
                hub.integration_stats.total_micro_actions + 1;
        };
    }

    // Grant cross-module permissions
    public entry fun grant_permissions(
        hub: &mut GreenVaultHub,
        grantee: address,
        can_verify_projects: bool,
        can_process_oracle_data: bool,
        can_validate_community: bool,
        can_mint_micro_credits: bool,
        reputation_level: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == hub.admin, 1);

        let permissions = Permissions {
            can_verify_projects,
            can_process_oracle_data,
            can_validate_community,
            can_mint_micro_credits,
            reputation_level,
        };

        if (table::contains(&hub.cross_module_permissions, grantee)) {
            let _old_permissions = table::remove(&mut hub.cross_module_permissions, grantee);
        };
        table::add(&mut hub.cross_module_permissions, grantee, permissions);
    }

    // Generate comprehensive impact report
    public entry fun generate_impact_report(
        hub: &GreenVaultHub,
        registry: &ProjectRegistry,
        marketplace: &Marketplace,
        project_id: String,
        ctx: &mut TxContext
    ) {
        // Collect stats from all modules
        let (total_issued, _total_retired) = carbon_credit::get_registry_stats(registry);
        let (_market_volume, community_fund) = carbon_credit::get_marketplace_stats(marketplace);

        // Calculate impact score based on various factors
        let impact_score = (
            hub.integration_stats.total_community_members * 10 +
            hub.integration_stats.oracle_verifications * 25 +
            hub.integration_stats.total_micro_actions * 5 +
            (community_fund / 1000) // Convert to simpler metric
        );

        event::emit(ProjectLifecycleCompleted {
            project_id,
            developer: tx_context::sender(ctx),
            total_credits_issued: total_issued,
            oracle_verifications: hub.integration_stats.oracle_verifications,
            community_participants: hub.integration_stats.total_community_members,
            impact_score,
        });
    }

    // Getter functions
    public fun get_hub_stats(hub: &GreenVaultHub): (u64, u64, u64, u64, u64) {
        (
            hub.integration_stats.total_verified_projects,
            hub.integration_stats.total_community_members,
            hub.integration_stats.total_micro_actions,
            hub.integration_stats.oracle_verifications,
            hub.integration_stats.fractional_trades
        )
    }

    public fun has_permission(
        hub: &GreenVaultHub,
        user: address,
        permission_type: u8
    ): bool {
        if (table::contains(&hub.cross_module_permissions, user)) {
            let permissions = table::borrow(&hub.cross_module_permissions, user);
            if (permission_type == 0) permissions.can_verify_projects
            else if (permission_type == 1) permissions.can_process_oracle_data
            else if (permission_type == 2) permissions.can_validate_community
            else if (permission_type == 3) permissions.can_mint_micro_credits
            else false
        } else {
            false
        }
    }

    // Test-only function
    #[test_only]
    #[allow(unused_variable)]
    public fun init_for_testing(_ctx: &mut TxContext) {
        // This would initialize all modules in proper test order
    }
}
