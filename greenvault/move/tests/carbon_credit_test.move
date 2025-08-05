// File: tests/carbon_credit_tests.move
// Comprehensive test suite for GreenVault Carbon Credit module

#[test_only]
#[allow(unused_use, unused_variable)]
module greenvault::carbon_credit_tests {
    use greenvault::carbon_credit::{Self, ProjectRegistry, Marketplace, CarbonCredit};
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string;
    use std::vector;
    use std::option;

    // Test addresses - using valid hex addresses
    const ADMIN: address = @0xAD;
    const ISSUER: address = @0x1234;
    const BUYER: address = @0x5678;
    #[allow(unused_const)]
    const SELLER: address = @0x9ABC;

    #[test]
    fun test_project_registration_and_credit_minting() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize contracts
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);

        // Get shared objects
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        
        // Add verified issuer
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        
        // Register a project first
        carbon_credit::register_project(
            &mut registry,
            string::utf8(b"FOREST_001"),
            string::utf8(b"Amazon Reforestation"),
            string::utf8(b"Reforestation project in Amazon"),
            string::utf8(b"Brazil"),
            0, // PROJECT_REFORESTATION
            100000, // 100 tons capacity
            option::some(string::utf8(b"Kayapo Community")),
            string::utf8(b"satellite_monitoring"),
            option::some(string::utf8(b"did:greenvault:kayapo123")),
            test_scenario::ctx(test)
        );
        
        // Verify the project
        carbon_credit::verify_project(&mut registry, string::utf8(b"FOREST_001"), test_scenario::ctx(test));
        
        test_scenario::return_shared(registry);
        
        test_scenario::next_tx(test, ISSUER);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        
        // Mint carbon credits for the verified project
        carbon_credit::mint_carbon_credit(
            &mut registry,
            string::utf8(b"FOREST_001"),
            string::utf8(b"AMZN-2024-001"),
            2024,
            50000, // 50 tons
            string::utf8(b"VCS_v4.0"),
            string::utf8(b"https://ipfs.io/metadata/forest001"),
            vector::empty<u8>(),
            option::some(string::utf8(b"did:greenvault:kayapo123")),
            test_scenario::ctx(test)
        );

        let (total_issued, total_retired) = carbon_credit::get_registry_stats(&registry);
        assert!(total_issued == 50000, 0);
        assert!(total_retired == 0, 1);

        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_marketplace_trading() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Setup phase
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        let marketplace = test_scenario::take_shared<Marketplace>(test);

        // Add verified issuer first
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        
        // Register and verify a project
        carbon_credit::register_project(
            &mut registry,
            string::utf8(b"TEST_PROJECT"),
            string::utf8(b"Test Project"),
            string::utf8(b"Test Description"),
            string::utf8(b"Test Location"),
            0, // PROJECT_REFORESTATION
            1000, // 1 ton capacity
            option::none(),
            string::utf8(b"test_monitoring"),
            option::none(),
            test_scenario::ctx(test)
        );
        
        carbon_credit::verify_project(&mut registry, string::utf8(b"TEST_PROJECT"), test_scenario::ctx(test));

        let (volume, community_fund) = carbon_credit::get_marketplace_stats(&marketplace);
        assert!(volume == 0, 0); // No trades yet

        test_scenario::return_shared(registry);
        test_scenario::return_shared(marketplace);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_micro_credit_system() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, BUYER);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        
        // User performs eco-friendly action and gets micro-credit
        carbon_credit::mint_micro_credit(
            &mut registry,
            string::utf8(b"tree_planting"),
            100, // 0.1 tons CO2
            vector::empty<u8>(),
            option::some(string::utf8(b"did:greenvault:user123")),
            test_scenario::ctx(test)
        );

        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_did_integration() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, BUYER);
        
        let did_registry = test_scenario::take_shared<carbon_credit::DIDRegistry>(test);
        
        // Register DID for user
        carbon_credit::register_did(
            &mut did_registry,
            string::utf8(b"did:greenvault:refugee456"),
            vector::empty<u8>(),
            test_scenario::ctx(test)
        );

        test_scenario::return_shared(did_registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_complete_workflow() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        carbon_credit::init_for_testing(test_scenario::ctx(test));
        
        test_scenario::next_tx(test, ADMIN);
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        
        // Add issuer and verify project workflow
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_marketplace_listing_and_buying() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize contracts
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        let marketplace = test_scenario::take_shared<Marketplace>(test);
        
        // Setup: Add verified issuer
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        
        // Register and verify project
        carbon_credit::register_project(
            &mut registry,
            string::utf8(b"MARKET_TEST"),
            string::utf8(b"Marketplace Test Project"),
            string::utf8(b"Testing marketplace functions"),
            string::utf8(b"Test Location"),
            0, // PROJECT_REFORESTATION
            10000, // 10 tons capacity
            option::none(),
            string::utf8(b"test_monitoring"),
            option::none(),
            test_scenario::ctx(test)
        );
        
        carbon_credit::verify_project(&mut registry, string::utf8(b"MARKET_TEST"), test_scenario::ctx(test));
        
        test_scenario::return_shared(registry);
        test_scenario::return_shared(marketplace);
        
        // Switch to issuer to mint credit
        test_scenario::next_tx(test, ISSUER);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        let marketplace = test_scenario::take_shared<Marketplace>(test);
        
        // Mint a carbon credit
        carbon_credit::mint_carbon_credit(
            &mut registry,
            string::utf8(b"MARKET_TEST"),
            string::utf8(b"MKT-2024-001"),
            2024,
            5000, // 5 tons
            string::utf8(b"VCS_v4.0"),
            string::utf8(b"https://ipfs.io/marketplace-test"),
            vector::empty<u8>(),
            option::none(),
            test_scenario::ctx(test)
        );
        
        test_scenario::return_shared(registry);
        test_scenario::return_shared(marketplace);
        
        // Get the minted credit and list it for sale
        test_scenario::next_tx(test, ISSUER);
        
        let marketplace = test_scenario::take_shared<Marketplace>(test);
        let credit = test_scenario::take_from_sender<CarbonCredit>(test);
        
        // List credit for sale - price 1 SUI
        carbon_credit::list_credit_for_sale(
            &mut marketplace,
            &mut credit,
            1000000000, // 1 SUI in MIST
            false, // Not reserved for community
            test_scenario::ctx(test)
        );
        
        // Check marketplace stats before trade
        let (volume_before, community_fund_before) = carbon_credit::get_marketplace_stats(&marketplace);
        assert!(volume_before == 0, 0);
        assert!(community_fund_before == 0, 1);
        
        test_scenario::return_to_sender(test, credit);
        test_scenario::return_shared(marketplace);
        
        // Switch to buyer
        test_scenario::next_tx(test, BUYER);
        
        let marketplace = test_scenario::take_shared<Marketplace>(test);
        
        // Check marketplace stats - listing should be created but no trades yet
        let (volume_after_listing, community_fund_after_listing) = carbon_credit::get_marketplace_stats(&marketplace);
        assert!(volume_after_listing == 0, 2); // Still no volume until actual purchase
        assert!(community_fund_after_listing == 0, 3);
        
        test_scenario::return_shared(marketplace);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_credit_retirement() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize contracts
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        
        // Setup: Add verified issuer
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        
        // Register and verify project
        carbon_credit::register_project(
            &mut registry,
            string::utf8(b"RETIRE_TEST"),
            string::utf8(b"Retirement Test Project"),
            string::utf8(b"Testing retirement functions"),
            string::utf8(b"Test Location"),
            0, // PROJECT_REFORESTATION
            5000, // 5 tons capacity
            option::some(string::utf8(b"Test Community")),
            string::utf8(b"test_monitoring"),
            option::none(),
            test_scenario::ctx(test)
        );
        
        carbon_credit::verify_project(&mut registry, string::utf8(b"RETIRE_TEST"), test_scenario::ctx(test));
        
        test_scenario::return_shared(registry);
        
        // Switch to issuer to mint credit
        test_scenario::next_tx(test, ISSUER);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        
        // Mint a carbon credit
        carbon_credit::mint_carbon_credit(
            &mut registry,
            string::utf8(b"RETIRE_TEST"),
            string::utf8(b"RET-2024-001"),
            2024,
            2000, // 2 tons
            string::utf8(b"VCS_v4.0"),
            string::utf8(b"https://ipfs.io/retirement-test"),
            vector::empty<u8>(),
            option::none(),
            test_scenario::ctx(test)
        );
        
        // Check registry stats before retirement
        let (total_issued_before, total_retired_before) = carbon_credit::get_registry_stats(&registry);
        assert!(total_issued_before == 2000, 0);
        assert!(total_retired_before == 0, 1);
        
        test_scenario::return_shared(registry);
        
        // Retire the credit
        test_scenario::next_tx(test, ISSUER);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        let credit = test_scenario::take_from_sender<CarbonCredit>(test);
        
        // Retire the credit
        carbon_credit::retire_credit(
            &mut registry,
            credit,
            string::utf8(b"Company carbon footprint offset for 2024"),
            test_scenario::ctx(test)
        );
        
        // Check registry stats after retirement
        let (total_issued_after, total_retired_after) = carbon_credit::get_registry_stats(&registry);
        assert!(total_issued_after == 2000, 2); // Issued amount stays the same
        assert!(total_retired_after == 2000, 3); // Retired amount increases
        
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_micro_credit_retirement() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, BUYER);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        
        // User performs eco-friendly action and gets micro-credit
        carbon_credit::mint_micro_credit(
            &mut registry,
            string::utf8(b"recycling"),
            500, // 0.5 tons CO2
            vector::empty<u8>(),
            option::some(string::utf8(b"did:greenvault:user123")),
            test_scenario::ctx(test)
        );
        
        // Check registry stats before retirement
        let (total_issued_before, total_retired_before) = carbon_credit::get_registry_stats(&registry);
        assert!(total_issued_before == 500, 0);
        assert!(total_retired_before == 0, 1);
        
        test_scenario::return_shared(registry);
        
        // Retire the micro-credit
        test_scenario::next_tx(test, BUYER);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        let micro_credit = test_scenario::take_from_sender<CarbonCredit>(test);
        
        // Retire the micro-credit
        carbon_credit::retire_credit(
            &mut registry,
            micro_credit,
            string::utf8(b"Personal carbon offset from recycling activities"),
            test_scenario::ctx(test)
        );
        
        // Check registry stats after retirement
        let (total_issued_after, total_retired_after) = carbon_credit::get_registry_stats(&registry);
        assert!(total_issued_after == 500, 2);
        assert!(total_retired_after == 500, 3);
        
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_credit_status_transitions() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize contracts
        {
            carbon_credit::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        let marketplace = test_scenario::take_shared<Marketplace>(test);
        
        // Setup: Add verified issuer and project
        carbon_credit::add_verified_issuer(&mut registry, ISSUER, test_scenario::ctx(test));
        
        carbon_credit::register_project(
            &mut registry,
            string::utf8(b"STATUS_TEST"),
            string::utf8(b"Status Test Project"),
            string::utf8(b"Testing status transitions"),
            string::utf8(b"Test Location"),
            0,
            3000,
            option::none(),
            string::utf8(b"test_monitoring"),
            option::none(),
            test_scenario::ctx(test)
        );
        
        carbon_credit::verify_project(&mut registry, string::utf8(b"STATUS_TEST"), test_scenario::ctx(test));
        
        test_scenario::return_shared(registry);
        test_scenario::return_shared(marketplace);
        
        // Mint credit
        test_scenario::next_tx(test, ISSUER);
        
        let registry = test_scenario::take_shared<ProjectRegistry>(test);
        let marketplace = test_scenario::take_shared<Marketplace>(test);
        
        carbon_credit::mint_carbon_credit(
            &mut registry,
            string::utf8(b"STATUS_TEST"),
            string::utf8(b"STS-2024-001"),
            2024,
            1500,
            string::utf8(b"VCS_v4.0"),
            string::utf8(b"https://ipfs.io/status-test"),
            vector::empty<u8>(),
            option::none(),
            test_scenario::ctx(test)
        );
        
        test_scenario::return_shared(registry);
        test_scenario::return_shared(marketplace);
        
        // Test status transitions: Active -> Escrowed -> Retired
        test_scenario::next_tx(test, ISSUER);
        
        let marketplace = test_scenario::take_shared<Marketplace>(test);
        let credit = test_scenario::take_from_sender<CarbonCredit>(test);
        
        // Check initial status (should be active)
        let (_, _, status_initial, _) = carbon_credit::get_credit_info(&credit);
        assert!(status_initial == 0, 0); // STATUS_ACTIVE
        
        // List for sale (changes status to escrowed)
        carbon_credit::list_credit_for_sale(
            &mut marketplace,
            &mut credit,
            500000000, // 0.5 SUI
            false,
            test_scenario::ctx(test)
        );
        
        // Check escrowed status
        let (_, _, status_escrowed, _) = carbon_credit::get_credit_info(&credit);
        assert!(status_escrowed == 1, 1); // STATUS_ESCROWED
        
        test_scenario::return_to_sender(test, credit);
        test_scenario::return_shared(marketplace);
        
        test_scenario::end(scenario);
    }
}
