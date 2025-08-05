// GreenVault Carbon Credit Trading System
// File: sources/carbon_credit.move

module greenvault::carbon_credit {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_QUANTITY: u64 = 2;
    const E_CREDIT_RETIRED: u64 = 3;
    const E_INSUFFICIENT_FUNDS: u64 = 4;
    const E_INVALID_PROJECT: u64 = 5;

    // Credit statuses
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_ESCROWED: u8 = 1;
    #[allow(unused_const)]
    const STATUS_RETIRED: u8 = 2;
    const STATUS_PENDING: u8 = 3;

    // Project types for underserved communities
    #[allow(unused_const)]
    const PROJECT_REFORESTATION: u8 = 0;
    #[allow(unused_const)]
    const PROJECT_CLEAN_COOKING: u8 = 1;
    #[allow(unused_const)]
    const PROJECT_RENEWABLE_ENERGY: u8 = 2;
    const PROJECT_WASTE_MANAGEMENT: u8 = 3;
    #[allow(unused_const)]
    const PROJECT_AGRICULTURE: u8 = 4;

    // Carbon Credit NFT Structure
    struct CarbonCredit has key, store {
        id: UID,
        project_id: String,
        serial_number: String,
        vintage_year: u16,
        quantity: u64, // CO2 tons * 1000 (for precision)
        methodology: String,
        project_type: u8,
        issuer: address,
        did_anchor: Option<String>, // DID reference for identity verification
        status: u8,
        metadata_uri: String,
        co2_data_hash: vector<u8>, // Oracle verified CO2 data
        created_at: u64,
        retired_at: Option<u64>,
        beneficiary_community: Option<String>, // For underserved community projects
    }

    // Project Registry for tracking sustainability projects
    struct ProjectRegistry has key {
        id: UID,
        admin: address,
        projects: Table<String, Project>,
        verified_issuers: Table<address, bool>,
        total_credits_issued: u64,
        total_credits_retired: u64,
    }

    struct Project has store {
        id: String,
        name: String,
        description: String,
        location: String,
        project_type: u8,
        developer: address,
        did_anchor: Option<String>,
        verified: bool,
        co2_reduction_capacity: u64,
        credits_issued: u64,
        beneficiary_community: Option<String>,
        oracle_data_source: String,
        created_at: u64,
    }

    // Marketplace for trading
    struct Marketplace has key {
        id: UID,
        admin: address,
        fee_rate: u64, // Basis points (e.g., 250 = 2.5%)
        treasury: address,
        listings: Table<ID, Listing>,
        total_volume: u64,
        community_fund: u64, // Portion of fees for underserved communities
    }

    struct Listing has store, drop {
        credit_id: ID,
        seller: address,
        price: u64,
        quantity_available: u64,
        listing_type: u8, // 0: Fixed price, 1: Auction
        expiry: u64,
        reserved_for_community: bool, // Priority for underserved buyers
    }

    // DID Identity anchor (optional integration)
    struct DIDRegistry has key {
        id: UID,
        identities: Table<address, DIDInfo>,
        verified_count: u64,
    }

    struct DIDInfo has store {
        did: String,
        verification_level: u8, // 0: Basic, 1: KYC, 2: Community verified
        attributes_hash: vector<u8>,
        created_at: u64,
        updated_at: u64,
    }

    // Events
    struct CreditMinted has copy, drop {
        credit_id: ID,
        project_id: String,
        quantity: u64,
        issuer: address,
        beneficiary_community: Option<String>,
    }

    struct CreditTraded has copy, drop {
        credit_id: ID,
        seller: address,
        buyer: address,
        price: u64,
        quantity: u64,
    }

    struct CreditRetired has copy, drop {
        credit_id: ID,
        retired_by: address,
        quantity: u64,
        retirement_reason: String,
    }

    struct ProjectRegistered has copy, drop {
        project_id: String,
        developer: address,
        project_type: u8,
        beneficiary_community: Option<String>,
    }

    // Initialize the system
    fun init(ctx: &mut TxContext) {
        let registry = ProjectRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            projects: table::new(ctx),
            verified_issuers: table::new(ctx),
            total_credits_issued: 0,
            total_credits_retired: 0,
        };

        let marketplace = Marketplace {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            fee_rate: 250, // 2.5%
            treasury: tx_context::sender(ctx),
            listings: table::new(ctx),
            total_volume: 0,
            community_fund: 0,
        };

        let did_registry = DIDRegistry {
            id: object::new(ctx),
            identities: table::new(ctx),
            verified_count: 0,
        };

        transfer::share_object(registry);
        transfer::share_object(marketplace);
        transfer::share_object(did_registry);
    }

    // Register a new carbon offset project
    public entry fun register_project(
        registry: &mut ProjectRegistry,
        project_id: String,
        name: String,
        description: String,
        location: String,
        project_type: u8,
        co2_reduction_capacity: u64,
        beneficiary_community: Option<String>,
        oracle_data_source: String,
        did_anchor: Option<String>,
        ctx: &mut TxContext
    ) {
        let developer = tx_context::sender(ctx);
        
        let project = Project {
            id: project_id,
            name,
            description,
            location,
            project_type,
            developer,
            did_anchor,
            verified: false,
            co2_reduction_capacity,
            credits_issued: 0,
            beneficiary_community,
            oracle_data_source,
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        table::add(&mut registry.projects, project_id, project);

        event::emit(ProjectRegistered {
            project_id,
            developer,
            project_type,
            beneficiary_community,
        });
    }

    // Mint carbon credits (only by verified issuers)
    public entry fun mint_carbon_credit(
        registry: &mut ProjectRegistry,
        project_id: String,
        serial_number: String,
        vintage_year: u16,
        quantity: u64,
        methodology: String,
        metadata_uri: String,
        co2_data_hash: vector<u8>,
        did_anchor: Option<String>,
        ctx: &mut TxContext
    ) {
        let issuer = tx_context::sender(ctx);
        
        // Verify issuer is authorized
        assert!(table::contains(&registry.verified_issuers, issuer), E_NOT_AUTHORIZED);
        assert!(quantity > 0, E_INVALID_QUANTITY);

        // Get project info
        let project = table::borrow_mut(&mut registry.projects, project_id);
        assert!(project.verified, E_INVALID_PROJECT);

        let credit_id = object::new(ctx);
        let credit_id_copy = object::uid_to_inner(&credit_id);

        let credit = CarbonCredit {
            id: credit_id,
            project_id,
            serial_number,
            vintage_year,
            quantity,
            methodology,
            project_type: project.project_type,
            issuer,
            did_anchor,
            status: STATUS_ACTIVE,
            metadata_uri,
            co2_data_hash,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            retired_at: option::none(),
            beneficiary_community: project.beneficiary_community,
        };

        // Update registry stats
        registry.total_credits_issued = registry.total_credits_issued + quantity;
        project.credits_issued = project.credits_issued + quantity;

        event::emit(CreditMinted {
            credit_id: credit_id_copy,
            project_id,
            quantity,
            issuer,
            beneficiary_community: project.beneficiary_community,
        });

        transfer::public_transfer(credit, issuer);
    }

    // List carbon credit for sale
    public entry fun list_credit_for_sale(
        marketplace: &mut Marketplace,
        credit: &mut CarbonCredit,
        price: u64,
        reserved_for_community: bool,
        ctx: &mut TxContext
    ) {
        assert!(credit.status == STATUS_ACTIVE, E_CREDIT_RETIRED);
        
        let seller = tx_context::sender(ctx);
        let credit_id = object::id(credit);
        
        // Change credit status to escrowed
        credit.status = STATUS_ESCROWED;
        
        let listing = Listing {
            credit_id,
            seller,
            price,
            quantity_available: credit.quantity,
            listing_type: 0, // Fixed price
            expiry: tx_context::epoch_timestamp_ms(ctx) + 86400000, // 24 hours
            reserved_for_community,
        };

        table::add(&mut marketplace.listings, credit_id, listing);
    }

    // Buy carbon credit
    public entry fun buy_credit(
        marketplace: &mut Marketplace,
        credit_id: ID,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        
        assert!(table::contains(&marketplace.listings, credit_id), E_INVALID_PROJECT);
        
        let listing = table::remove(&mut marketplace.listings, credit_id);
        let payment_amount = coin::value(&payment);
        
        assert!(payment_amount >= listing.price, E_INSUFFICIENT_FUNDS);

        // Calculate fees
        let fee = (listing.price * marketplace.fee_rate) / 10000;
        let community_fee = fee / 4; // 25% of fees go to community fund

        // Split payment properly
        if (fee > 0) {
            let fee_coin = coin::split(&mut payment, fee, ctx);
            if (community_fee > 0) {
                let treasury_coin = coin::split(&mut fee_coin, fee - community_fee, ctx);
                transfer::public_transfer(treasury_coin, marketplace.treasury);
            };
            transfer::public_transfer(fee_coin, marketplace.treasury);
        };
        
        // Transfer remaining payment to seller
        transfer::public_transfer(payment, listing.seller);

        // Update marketplace stats
        marketplace.total_volume = marketplace.total_volume + listing.price;
        marketplace.community_fund = marketplace.community_fund + community_fee;

        // NOTE: Credit transfer from escrow needs to be handled separately
        // as we can't access the escrowed credit directly in this function

        event::emit(CreditTraded {
            credit_id,
            seller: listing.seller,
            buyer,
            price: listing.price,
            quantity: listing.quantity_available,
        });
    }

    // Retire carbon credit (remove from circulation)
    public entry fun retire_credit(
        registry: &mut ProjectRegistry,
        credit: CarbonCredit,
        retirement_reason: String,
        ctx: &mut TxContext
    ) {
        assert!(credit.status == STATUS_ACTIVE || credit.status == STATUS_ESCROWED, E_CREDIT_RETIRED);
        
        let credit_id = object::id(&credit);
        let quantity = credit.quantity;
        let retired_by = tx_context::sender(ctx);

        // Update registry
        registry.total_credits_retired = registry.total_credits_retired + quantity;

        event::emit(CreditRetired {
            credit_id,
            retired_by,
            quantity,
            retirement_reason,
        });

        // Delete the credit NFT (permanent retirement)
        let CarbonCredit {
            id,
            project_id: _,
            serial_number: _,
            vintage_year: _,
            quantity: _,
            methodology: _,
            project_type: _,
            issuer: _,
            did_anchor: _,
            status: _,
            metadata_uri: _,
            co2_data_hash: _,
            created_at: _,
            retired_at: _,
            beneficiary_community: _,
        } = credit;
        
        object::delete(id);
    }

    // Set credit to pending status for verification
    public entry fun set_credit_pending(
        credit: &mut CarbonCredit,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        assert!(credit.issuer == owner, E_NOT_AUTHORIZED);
        
        credit.status = STATUS_PENDING;
    }

    // DID Registration for identity verification
    public entry fun register_did(
        did_registry: &mut DIDRegistry,
        did: String,
        attributes_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        let did_info = DIDInfo {
            did,
            verification_level: 0, // Basic level
            attributes_hash,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            updated_at: tx_context::epoch_timestamp_ms(ctx),
        };

        table::add(&mut did_registry.identities, user, did_info);
        did_registry.verified_count = did_registry.verified_count + 1;
    }

    // Verify project (admin function)
    public entry fun verify_project(
        registry: &mut ProjectRegistry,
        project_id: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, E_NOT_AUTHORIZED);
        
        let project = table::borrow_mut(&mut registry.projects, project_id);
        project.verified = true;
    }

    // Add verified issuer (admin function)
    public entry fun add_verified_issuer(
        registry: &mut ProjectRegistry,
        issuer: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, E_NOT_AUTHORIZED);
        table::add(&mut registry.verified_issuers, issuer, true);
    }

    // Micro-credit system for small eco-friendly actions
    public entry fun mint_micro_credit(
        registry: &mut ProjectRegistry,
        action_type: String, // "recycling", "tree_planting", etc.
        quantity: u64, // Small amounts
        evidence_hash: vector<u8>,
        did_anchor: Option<String>,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Create micro-credit with special project ID based on action type
        let project_id = action_type; // Use the action_type as project_id
        let serial_number = string::utf8(b"MICRO_ACTION");
        
        let credit_id = object::new(ctx);
        
        let micro_credit = CarbonCredit {
            id: credit_id,
            project_id,
            serial_number,
            vintage_year: 2024,
            quantity,
            methodology: string::utf8(b"GreenVault_Micro_v1.0"),
            project_type: PROJECT_WASTE_MANAGEMENT,
            issuer: user,
            did_anchor,
            status: STATUS_ACTIVE,
            metadata_uri: string::utf8(b""),
            co2_data_hash: evidence_hash,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            retired_at: option::none(),
            beneficiary_community: option::none(),
        };

        // Update registry stats
        registry.total_credits_issued = registry.total_credits_issued + quantity;

        transfer::public_transfer(micro_credit, user);
    }

    // Getter functions for marketplace data
    public fun get_marketplace_stats(marketplace: &Marketplace): (u64, u64) {
        (marketplace.total_volume, marketplace.community_fund)
    }

    public fun get_registry_stats(registry: &ProjectRegistry): (u64, u64) {
        (registry.total_credits_issued, registry.total_credits_retired)
    }

    public fun get_credit_info(credit: &CarbonCredit): (String, u64, u8, Option<String>) {
        (credit.project_id, credit.quantity, credit.status, credit.beneficiary_community)
    }

    // Special function for fractionalization (friend module access in production)
    public fun retire_credit_for_fractionalization(credit: CarbonCredit) {
        let CarbonCredit {
            id,
            project_id: _,
            serial_number: _,
            vintage_year: _,
            quantity: _,
            methodology: _,
            project_type: _,
            issuer: _,
            did_anchor: _,
            status: _,
            metadata_uri: _,
            co2_data_hash: _,
            created_at: _,
            retired_at: _,
            beneficiary_community: _,
        } = credit;
        
        object::delete(id);
    }

    // Enhanced marketplace with community priority
    public entry fun list_credit_with_community_priority(
        marketplace: &mut Marketplace,
        credit: &mut CarbonCredit,
        price: u64,
        community_discount_percent: u64, // 0-100
        reserved_duration_hours: u64,
        ctx: &mut TxContext
    ) {
        assert!(credit.status == STATUS_ACTIVE, E_CREDIT_RETIRED);
        assert!(community_discount_percent <= 50, E_INVALID_QUANTITY); // Max 50% discount
        
        let seller = tx_context::sender(ctx);
        let credit_id = object::id(credit);
        
        credit.status = STATUS_ESCROWED;
        
        let listing = Listing {
            credit_id,
            seller,
            price: if (community_discount_percent > 0) {
                price - (price * community_discount_percent / 100)
            } else {
                price
            },
            quantity_available: credit.quantity,
            listing_type: 0,
            expiry: tx_context::epoch_timestamp_ms(ctx) + (reserved_duration_hours * 3600000),
            reserved_for_community: true,
        };

        table::add(&mut marketplace.listings, credit_id, listing);
    }

    // Test-only initialization function
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
} 