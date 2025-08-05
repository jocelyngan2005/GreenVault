// File: tests/fractional_credits_tests.move
// Comprehensive test suite for Fractional Credits module

#[test_only]
#[allow(unused_use, unused_variable)]
module greenvault::fractional_credits_tests {
    use greenvault::fractional_credits::{Self, FractionalPool, MicroCreditSystem, FractionalCredit};
    use greenvault::carbon_credit::{Self, CarbonCredit, ProjectRegistry};
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use std::vector;
    use std::option;

    // Test addresses
    const ADMIN: address = @0xAD;
    const USER1: address = @0x1234;
    const USER2: address = @0x5678;
    const ISSUER: address = @0x9ABC;
    const BUYER: address = @0xDEF0;

    #[test]
    fun test_fractional_credits_initialization() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize fractional credits system (micro-credit system only)
        {
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);

        // Verify micro credit system was created
        let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);
        
        // Check initial state
        let (earned, performed, limit_reached) = 
            fractional_credits::get_daily_limit_info(&micro_system, USER1);
        assert!(earned == 0, 0);
        assert!(performed == 0, 1);
        assert!(!limit_reached, 2);

        test_scenario::return_shared(micro_system);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_action_rewards_setup() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);

        let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);

        // Setup action rewards
        fractional_credits::setup_action_rewards(
            &mut micro_system,
            string::utf8(b"recycling"),
            25, // 25 micro-credits per recycling action
            test_scenario::ctx(test)
        );

        fractional_credits::setup_action_rewards(
            &mut micro_system,
            string::utf8(b"tree_planting"),
            50, // 50 micro-credits per tree planting
            test_scenario::ctx(test)
        );

        fractional_credits::setup_action_rewards(
            &mut micro_system,
            string::utf8(b"energy_saving"),
            15, // 15 micro-credits per energy saving action
            test_scenario::ctx(test)
        );

        test_scenario::return_shared(micro_system);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_micro_credit_claiming() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);

        // Setup system and create treasury cap for testing
        let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);
        let treasury_cap = fractional_credits::create_treasury_cap_for_testing(test_scenario::ctx(test));

        // Setup action reward
        fractional_credits::setup_action_rewards(
            &mut micro_system,
            string::utf8(b"plastic_recycling"),
            30,
            test_scenario::ctx(test)
        );

        test_scenario::return_shared(micro_system);
        test_scenario::return_to_sender(test, treasury_cap);

        // User claims micro-credits
        test_scenario::next_tx(test, USER1);
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);

            fractional_credits::claim_micro_credits(
                &mut micro_system,
                string::utf8(b"plastic_recycling"),
                b"recycling_evidence_photo_hash",
                &mut treasury_cap,
                test_scenario::ctx(test)
            );

            // Check daily limits were updated
            let (earned, performed, limit_reached) = 
                fractional_credits::get_daily_limit_info(&micro_system, USER1);
            assert!(earned == 30, 0);
            assert!(performed == 1, 1);
            assert!(!limit_reached, 2);

            test_scenario::return_shared(micro_system);
            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        // Verify user received the fractional credits
        test_scenario::next_tx(test, USER1);
        {
            let micro_credits = test_scenario::take_from_sender<Coin<FractionalCredit>>(test);
            assert!(coin::value(&micro_credits) == 30, 3);
            test_scenario::return_to_sender(test, micro_credits);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_daily_limits_enforcement() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize and setup
        {
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);

            fractional_credits::setup_action_rewards(
                &mut micro_system,
                string::utf8(b"high_value_action"),
                95, // High value action - close to daily limit
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(micro_system);
        };

        // First claim - should succeed
        test_scenario::next_tx(test, USER1);
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);

            fractional_credits::claim_micro_credits(
                &mut micro_system,
                string::utf8(b"high_value_action"),
                b"evidence1",
                &mut treasury_cap,
                test_scenario::ctx(test)
            );

            let (earned, performed, limit_reached) = 
                fractional_credits::get_daily_limit_info(&micro_system, USER1);
            assert!(earned == 95, 0);
            assert!(performed == 1, 1);
            assert!(!limit_reached, 2); // Not reached yet (95 < 100)

            test_scenario::return_shared(micro_system);
            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        // Setup small action
        test_scenario::next_tx(test, ADMIN);
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);

            fractional_credits::setup_action_rewards(
                &mut micro_system,
                string::utf8(b"small_action"),
                10,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(micro_system);
        };

        // Second claim - should trigger daily limit
        test_scenario::next_tx(test, USER1);
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);

            fractional_credits::claim_micro_credits(
                &mut micro_system,
                string::utf8(b"small_action"),
                b"evidence2",
                &mut treasury_cap,
                test_scenario::ctx(test)
            );

            let (earned, performed, limit_reached) = 
                fractional_credits::get_daily_limit_info(&micro_system, USER1);
            assert!(earned == 105, 3); // 95 + 10
            assert!(performed == 2, 4);
            assert!(limit_reached, 5); // Limit should be reached now (105 >= 100)

            test_scenario::return_shared(micro_system);
            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_credit_fractionalization() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize both systems
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);

        // Setup carbon credit system
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        let treasury_cap = test_scenario::take_from_sender<TreasuryCap<FractionalCredit>>(test);

        // Add verified issuer and register project
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        
        carbon_credit::register_project(
            &mut registry,
            string::utf8(b"FOREST_001"),
            string::utf8(b"Amazon Reforestation"),
            string::utf8(b"Community forest restoration"),
            string::utf8(b"Brazil"),
            0, // Reforestation
            1000000, // 1000 tons capacity
            option::some(string::utf8(b"Local Community")),
            string::utf8(b"satellite_monitoring"),
            option::none(),
            test_scenario::ctx(test)
        );

        carbon_credit::verify_project(&mut registry, string::utf8(b"FOREST_001"), test_scenario::ctx(test));

        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(test, treasury_cap);

        // Mint carbon credit
        test_scenario::next_tx(test, ISSUER);
        {
            let registry = test_scenario::take_shared<ProjectRegistry>(test);

            carbon_credit::mint_carbon_credit(
                &mut registry,
                string::utf8(b"FOREST_001"),
                string::utf8(b"CC_001"),
                2024,
                5000, // 5 tons
                string::utf8(b"VM0015"),
                string::utf8(b"https://metadata.uri"),
                b"co2_data_hash",
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(registry);
        };

        // Fractionalize the credit
        test_scenario::next_tx(test, ISSUER);
        {
            let credit = test_scenario::take_from_sender<CarbonCredit>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);

            fractional_credits::fractionalize_credit(
                credit,
                1000, // 1000 fractions
                50,   // 50 SUI per fraction
                10,   // Min purchase 10 fractions
                &mut treasury_cap,
                test_scenario::ctx(test)
            );

            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        // Verify fractional pool was created
        test_scenario::next_tx(test, BUYER);
        {
            let pool = test_scenario::take_shared<FractionalPool>(test);
            
            let (total_fractions, available, price, project_id) = 
                fractional_credits::get_pool_info(&pool);
            
            assert!(total_fractions == 1000, 0);
            assert!(available == 1000, 1);
            assert!(price == 50, 2);
            assert!(project_id == string::utf8(b"FOREST_001"), 3);

            test_scenario::return_shared(pool);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_fraction_purchase() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Setup similar to fractionalization test
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        // Create and fractionalize a credit (abbreviated setup)
        test_scenario::next_tx(test, ADMIN);
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        carbon_credit::register_project(
            &mut registry, string::utf8(b"FOREST_001"), string::utf8(b"Forest Project"),
            string::utf8(b"Description"), string::utf8(b"Location"), 0, 1000000,
            option::none(), string::utf8(b"oracle"), option::none(), test_scenario::ctx(test)
        );
        carbon_credit::verify_project(&mut registry, string::utf8(b"FOREST_001"), test_scenario::ctx(test));
        test_scenario::return_shared(registry);

        test_scenario::next_tx(test, ISSUER);
        {
            let registry = test_scenario::take_shared<ProjectRegistry>(test);
            carbon_credit::mint_carbon_credit(
                &mut registry, string::utf8(b"FOREST_001"), string::utf8(b"CC_001"),
                2024, 5000, string::utf8(b"VM0015"), string::utf8(b"uri"),
                b"hash", option::none(), test_scenario::ctx(test)
            );
            test_scenario::return_shared(registry);
        };

        test_scenario::next_tx(test, ISSUER);
        {
            let credit = test_scenario::take_from_sender<CarbonCredit>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);
            fractional_credits::fractionalize_credit(
                credit, 1000, 50, 10, &mut treasury_cap, test_scenario::ctx(test)
            );
            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        // Now test purchasing fractions
        test_scenario::next_tx(test, BUYER);
        {
            let pool = test_scenario::take_shared<FractionalPool>(test);
            
            // Create payment (50 fractions * 50 SUI = 2500 SUI)
            let payment = coin::mint_for_testing<SUI>(2500, test_scenario::ctx(test));
            
            fractional_credits::purchase_fractions(
                &mut pool,
                50, // Buy 50 fractions
                payment,
                test_scenario::ctx(test)
            );

            // Verify pool state updated
            let (total_fractions, available, _, _) = fractional_credits::get_pool_info(&pool);
            assert!(total_fractions == 1000, 0);
            assert!(available == 950, 1); // 1000 - 50

            // Verify buyer's holding record
            let user_balance = fractional_credits::get_user_fraction_balance(&pool, BUYER);
            assert!(user_balance == 50, 2);

            test_scenario::return_shared(pool);
        };

        // Verify buyer received fractional credits
        test_scenario::next_tx(test, BUYER);
        {
            let fraction_coin = test_scenario::take_from_sender<Coin<FractionalCredit>>(test);
            assert!(coin::value(&fraction_coin) == 50, 3);
            test_scenario::return_to_sender(test, fraction_coin);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_fraction_retirement() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);
            let treasury_cap = test_scenario::take_from_sender<TreasuryCap<FractionalCredit>>(test);

            // Setup action and claim some credits
            fractional_credits::setup_action_rewards(
                &mut micro_system,
                string::utf8(b"recycling"),
                100,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(micro_system);
            test_scenario::return_to_sender(test, treasury_cap);
        };

        test_scenario::next_tx(test, USER1);
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);

            fractional_credits::claim_micro_credits(
                &mut micro_system,
                string::utf8(b"recycling"),
                b"evidence",
                &mut treasury_cap,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(micro_system);
            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        // Retire the fractional credits
        test_scenario::next_tx(test, USER1);
        {
            let fraction_coin = test_scenario::take_from_sender<Coin<FractionalCredit>>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);
            
            assert!(coin::value(&fraction_coin) == 100, 0);

            fractional_credits::retire_fractions(
                fraction_coin,
                string::utf8(b"Carbon offsetting for personal use"),
                &mut treasury_cap,
                test_scenario::ctx(test)
            );

            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1)] // E_NOT_AUTHORIZED
    fun test_unauthorized_action_setup() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        // Non-admin tries to setup action rewards
        test_scenario::next_tx(test, USER1); // USER1 is not admin
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);

            // This should fail with E_NOT_AUTHORIZED
            fractional_credits::setup_action_rewards(
                &mut micro_system,
                string::utf8(b"unauthorized_action"),
                50,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(micro_system);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)] // E_INVALID_FRACTION
    fun test_invalid_fractionalization_parameters() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Setup minimal carbon credit
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        carbon_credit::register_project(
            &mut registry, string::utf8(b"TEST"), string::utf8(b"Test"),
            string::utf8(b"Desc"), string::utf8(b"Loc"), 0, 1000,
            option::none(), string::utf8(b"oracle"), option::none(), test_scenario::ctx(test)
        );
        carbon_credit::verify_project(&mut registry, string::utf8(b"TEST"), test_scenario::ctx(test));
        test_scenario::return_shared(registry);

        test_scenario::next_tx(test, ISSUER);
        {
            let registry = test_scenario::take_shared<ProjectRegistry>(test);
            carbon_credit::mint_carbon_credit(
                &mut registry, string::utf8(b"TEST"), string::utf8(b"CC_001"),
                2024, 1000, string::utf8(b"VM0015"), string::utf8(b"uri"),
                b"hash", option::none(), test_scenario::ctx(test)
            );
            test_scenario::return_shared(registry);
        };

        // Try to fractionalize with invalid parameters
        test_scenario::next_tx(test, ISSUER);
        {
            let credit = test_scenario::take_from_sender<CarbonCredit>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);

            // This should fail - too many fractions (> 10000)
            fractional_credits::fractionalize_credit(
                credit,
                15000, // Invalid: > 10000
                50,
                10,
                &mut treasury_cap,
                test_scenario::ctx(test)
            );

            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)] // E_INVALID_FRACTION
    fun test_claim_nonexistent_action() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        // Try to claim credits for an action that hasn't been set up
        test_scenario::next_tx(test, USER1);
        {
            let micro_system = test_scenario::take_shared<MicroCreditSystem>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);

            // This should fail - action not set up
            fractional_credits::claim_micro_credits(
                &mut micro_system,
                string::utf8(b"nonexistent_action"),
                b"evidence",
                &mut treasury_cap,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(micro_system);
            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 2)] // E_INSUFFICIENT_BALANCE  
    fun test_insufficient_payment_for_fractions() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Create a fractional pool (abbreviated setup)
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
            fractional_credits::init_for_testing(test_scenario::ctx(test));
        };

        // Setup and fractionalize (minimal version)
        test_scenario::next_tx(test, ADMIN);
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        carbon_credit::register_project(
            &mut registry, string::utf8(b"TEST"), string::utf8(b"Test"),
            string::utf8(b"Desc"), string::utf8(b"Loc"), 0, 1000,
            option::none(), string::utf8(b"oracle"), option::none(), test_scenario::ctx(test)
        );
        carbon_credit::verify_project(&mut registry, string::utf8(b"TEST"), test_scenario::ctx(test));
        test_scenario::return_shared(registry);

        test_scenario::next_tx(test, ISSUER);
        {
            let registry = test_scenario::take_shared<ProjectRegistry>(test);
            carbon_credit::mint_carbon_credit(
                &mut registry, string::utf8(b"TEST"), string::utf8(b"CC_001"),
                2024, 1000, string::utf8(b"VM0015"), string::utf8(b"uri"),
                b"hash", option::none(), test_scenario::ctx(test)
            );
            test_scenario::return_shared(registry);
        };

        test_scenario::next_tx(test, ISSUER);
        {
            let credit = test_scenario::take_from_sender<CarbonCredit>(test);
            let treasury_cap = test_scenario::take_from_address<TreasuryCap<FractionalCredit>>(test, ADMIN);
            fractional_credits::fractionalize_credit(
                credit, 1000, 100, 10, &mut treasury_cap, test_scenario::ctx(test)
            );
            test_scenario::return_to_address(ADMIN, treasury_cap);
        };

        // Try to buy with insufficient payment
        test_scenario::next_tx(test, BUYER);
        {
            let pool = test_scenario::take_shared<FractionalPool>(test);
            
            // Need 10 * 100 = 1000 SUI, but only providing 500
            let insufficient_payment = coin::mint_for_testing<SUI>(500, test_scenario::ctx(test));
            
            // This should fail with E_INSUFFICIENT_BALANCE
            fractional_credits::purchase_fractions(
                &mut pool,
                10, // Want to buy 10 fractions
                insufficient_payment,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(pool);
        };

        test_scenario::end(scenario);
    }
}
