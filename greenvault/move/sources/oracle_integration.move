// File: sources/oracle_integration.move
// Oasis Oracle Integration for CO2 Data Verification

module greenvault::oracle_integration { 
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};

    // Error codes
    const E_ORACLE_NOT_AUTHORIZED: u64 = 100;
    const E_STALE_DATA: u64 = 102;
    #[allow(unused_const)]
    const E_INVALID_DATA_FEED: u64 = 101;
    #[allow(unused_const)]
    const E_INSUFFICIENT_CONFIRMATIONS: u64 = 103;

    // Oracle data types
    const DATA_TYPE_CO2_EMISSIONS: u8 = 0;
    const DATA_TYPE_FOREST_COVERAGE: u8 = 1;
    const DATA_TYPE_RENEWABLE_ENERGY: u8 = 2;
    const DATA_TYPE_WASTE_REDUCTION: u8 = 3;

    // Oracle Registry
    struct OracleRegistry has key {
        id: UID,
        admin: address,
        authorized_oracles: Table<address, OracleInfo>,
        data_feeds: Table<String, DataFeed>,
        minimum_confirmations: u64,
    }

    struct OracleInfo has store {
        oracle_address: address,
        reputation_score: u64,
        total_submissions: u64,
        successful_verifications: u64,
        stake_amount: u64,
        active: bool,
    }

    struct DataFeed has store {
        feed_id: String,
        data_type: u8,
        latest_value: u64,
        timestamp: u64,
        source_hash: vector<u8>,
        confirmations: u64,
        submitting_oracles: vector<address>,
        confidence_score: u64,
    }

    // CO2 Verification Request
    struct CO2VerificationRequest has key {
        id: UID,
        project_id: String,
        requester: address,
        data_points: vector<DataPoint>,
        required_confirmations: u64,
        current_confirmations: u64,
        status: u8, // 0: Pending, 1: Verified, 2: Rejected
        created_at: u64,
        verified_at: Option<u64>,
    }

    struct DataPoint has store {
        measurement_type: String, // "co2_sequestered", "energy_generated", etc.
        value: u64,
        unit: String,
        measurement_date: u64,
        location_hash: vector<u8>,
        methodology: String,
    }

    // Oracle Submission
    struct OracleSubmission has store, drop {
        oracle: address,
        verified_value: u64,
        confidence: u64,
        timestamp: u64,
        evidence_hash: vector<u8>,
    }

    // Events
    struct DataFeedUpdated has copy, drop {
        feed_id: String,
        new_value: u64,
        confirmations: u64,
        timestamp: u64,
    }

    struct VerificationCompleted has copy, drop {
        request_id: ID,
        project_id: String,
        verified: bool,
        final_value: u64,
    }

    struct OracleSlashed has copy, drop {
        oracle: address,
        reason: String,
        slashed_amount: u64,
    }

    // Initialize Oracle Registry
    fun init(ctx: &mut TxContext) {
        let oracle_registry = OracleRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            authorized_oracles: table::new(ctx),
            data_feeds: table::new(ctx),
            minimum_confirmations: 3,
        };

        transfer::share_object(oracle_registry);
    }

    // Register new Oracle
    public entry fun register_oracle(
        registry: &mut OracleRegistry,
        oracle_address: address,
        stake_amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, E_ORACLE_NOT_AUTHORIZED);

        let oracle_info = OracleInfo {
            oracle_address,
            reputation_score: 100, // Starting score
            total_submissions: 0,
            successful_verifications: 0,
            stake_amount,
            active: true,
        };

        table::add(&mut registry.authorized_oracles, oracle_address, oracle_info);
    }

    // Submit CO2 verification request
    public entry fun request_co2_verification(
        project_id: String,
        measurement_type: String,
        value: u64,
        unit: String,
        location_hash: vector<u8>,
        methodology: String,
        ctx: &mut TxContext
    ) {
        let requester = tx_context::sender(ctx);
        
        let data_point = DataPoint {
            measurement_type,
            value,
            unit,
            measurement_date: tx_context::epoch_timestamp_ms(ctx),
            location_hash,
            methodology,
        };

        let request = CO2VerificationRequest {
            id: object::new(ctx),
            project_id,
            requester,
            data_points: vector::singleton(data_point),
            required_confirmations: 3,
            current_confirmations: 0,
            status: 0, // Pending
            created_at: tx_context::epoch_timestamp_ms(ctx),
            verified_at: option::none(),
        };

        transfer::share_object(request);
    }

    // Oracle submits verification data
    public entry fun submit_oracle_verification(
        registry: &mut OracleRegistry,
        request: &mut CO2VerificationRequest,
        verified_value: u64,
        confidence: u64,
        evidence_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let oracle = tx_context::sender(ctx);
        
        // Verify oracle is authorized and active
        assert!(table::contains(&registry.authorized_oracles, oracle), E_ORACLE_NOT_AUTHORIZED);
        let oracle_info = table::borrow(&registry.authorized_oracles, oracle);
        assert!(oracle_info.active, E_ORACLE_NOT_AUTHORIZED);

        // Check if request is still pending
        assert!(request.status == 0, E_STALE_DATA);

        let _submission = OracleSubmission {
            oracle,
            verified_value,
            confidence,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            evidence_hash,
        };

        // Store the submission data in a simple way
        // In production, you might want to store the full submission details
        
        // Update confirmation count
        request.current_confirmations = request.current_confirmations + 1;

        // Update oracle stats
        let oracle_info_mut = table::borrow_mut(&mut registry.authorized_oracles, oracle);
        oracle_info_mut.total_submissions = oracle_info_mut.total_submissions + 1;
        
        // Increase reputation for participating in verification
        oracle_info_mut.reputation_score = oracle_info_mut.reputation_score + 1;

        // Check if we have enough confirmations
        if (request.current_confirmations >= request.required_confirmations) {
            request.status = 1; // Verified
            request.verified_at = option::some(tx_context::epoch_timestamp_ms(ctx));
            
            oracle_info_mut.successful_verifications = oracle_info_mut.successful_verifications + 1;

            event::emit(VerificationCompleted {
                request_id: object::id(request),
                project_id: request.project_id,
                verified: true,
                final_value: verified_value,
            });
        };
    }

    // Update data feed with oracle data
    public entry fun update_data_feed(
        registry: &mut OracleRegistry,
        feed_id: String,
        data_type: u8,
        value: u64,
        source_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let oracle = tx_context::sender(ctx);
        
        assert!(table::contains(&registry.authorized_oracles, oracle), E_ORACLE_NOT_AUTHORIZED);

        if (table::contains(&registry.data_feeds, feed_id)) {
            let feed = table::borrow_mut(&mut registry.data_feeds, feed_id);
            feed.latest_value = value;
            feed.timestamp = tx_context::epoch_timestamp_ms(ctx);
            feed.source_hash = source_hash;
            feed.confirmations = feed.confirmations + 1;
            vector::push_back(&mut feed.submitting_oracles, oracle);
        } else {
            let new_feed = DataFeed {
                feed_id,
                data_type,
                latest_value: value,
                timestamp: tx_context::epoch_timestamp_ms(ctx),
                source_hash,
                confirmations: 1,
                submitting_oracles: vector::singleton(oracle),
                confidence_score: 85, // Initial confidence
            };
            table::add(&mut registry.data_feeds, feed_id, new_feed);
        };

        event::emit(DataFeedUpdated {
            feed_id,
            new_value: value,
            confirmations: table::borrow(&registry.data_feeds, feed_id).confirmations,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    // Slash oracle for malicious behavior
    public entry fun slash_oracle(
        registry: &mut OracleRegistry,
        oracle_address: address,
        reason: String,
        slash_amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, E_ORACLE_NOT_AUTHORIZED);
        
        let oracle_info = table::borrow_mut(&mut registry.authorized_oracles, oracle_address);
        
        // Prevent underflow in stake amount
        if (oracle_info.stake_amount >= slash_amount) {
            oracle_info.stake_amount = oracle_info.stake_amount - slash_amount;
        } else {
            oracle_info.stake_amount = 0;
        };
        
        // Prevent underflow in reputation score
        if (oracle_info.reputation_score >= 10) {
            oracle_info.reputation_score = oracle_info.reputation_score - 10;
        } else {
            oracle_info.reputation_score = 0;
        };
        
        // Deactivate if stake too low
        if (oracle_info.stake_amount < 1000) {
            oracle_info.active = false;
        };

        event::emit(OracleSlashed {
            oracle: oracle_address,
            reason,
            slashed_amount: slash_amount,
        });
    }

    // Getter functions
    public fun get_data_feed(registry: &OracleRegistry, feed_id: String): (u64, u64, u64) {
        let feed = table::borrow(&registry.data_feeds, feed_id);
        (feed.latest_value, feed.timestamp, feed.confidence_score)
    }

    public fun get_oracle_reputation(registry: &OracleRegistry, oracle: address): u64 {
        let oracle_info = table::borrow(&registry.authorized_oracles, oracle);
        oracle_info.reputation_score
    }

    public fun is_verification_complete(request: &CO2VerificationRequest): bool {
        request.status == 1
    }

    // Get data feed by type
    public fun get_data_feed_by_type(
        _registry: &OracleRegistry,
        data_type: u8
    ): String {
        if (data_type == DATA_TYPE_CO2_EMISSIONS) {
            string::utf8(b"co2_emissions_feed")
        } else if (data_type == DATA_TYPE_FOREST_COVERAGE) {
            string::utf8(b"forest_coverage_feed")
        } else if (data_type == DATA_TYPE_RENEWABLE_ENERGY) {
            string::utf8(b"renewable_energy_feed")
        } else if (data_type == DATA_TYPE_WASTE_REDUCTION) {
            string::utf8(b"waste_reduction_feed")
        } else {
            string::utf8(b"unknown_feed")
        }
    }

    // Validate data feed before submission
    public fun validate_data_feed(
        registry: &OracleRegistry,
        feed_id: String
    ): bool {
        if (table::contains(&registry.data_feeds, feed_id)) {
            let feed = table::borrow(&registry.data_feeds, feed_id);
            // Check if feed exists and has at least 1 confirmation
            if (feed.confirmations >= 1) {
                true
            } else {
                false // E_INSUFFICIENT_CONFIRMATIONS could be used here
            }
        } else {
            false // E_INVALID_DATA_FEED could be used here
        }
    }

    // Test-only initialization function
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}