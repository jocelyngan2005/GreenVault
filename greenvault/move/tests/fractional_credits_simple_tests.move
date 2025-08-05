// File: tests/fractional_credits_simple_tests.move
// Simplified test suite for Fractional Credits module (testing MicroCreditSystem only)

#[test_only]
#[allow(unused_use, unused_variable)]
module greenvault::fractional_credits_simple_tests {
    use greenvault::fractional_credits::{Self, MicroCreditSystem};
    use sui::test_scenario::{Self, Scenario};
    use std::string::{Self, String};

    // Test addresses
    const ADMIN: address = @0xAD;
    const USER1: address = @0x1234;

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
}
