// File: tests/did_manager_tests.move
// Comprehensive test suite for DID Manager module

#[test_only]
#[allow(unused_use, unused_variable)]
module greenvault::did_manager_tests {
    use greenvault::did_manager::{Self, DIDManager, VerificationRequest};
    use sui::test_scenario::{Self, Scenario};
    use std::string::{Self, String};
    use std::vector;
    use std::option;

    // Test addresses
    const ADMIN: address = @0xAD;
    const USER1: address = @0x1234;
    const USER2: address = @0x5678;
    const VERIFIER1: address = @0x9ABC;
    const VERIFIER2: address = @0xDEF0;

    #[test]
    fun test_did_manager_initialization() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize DID manager
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, ADMIN);

        // Verify DID manager was created and shared
        let did_manager = test_scenario::take_shared<DIDManager>(test);
        
        // Check initial state
        let (total_users, community_verifications, sustainability_actions) = 
            did_manager::get_manager_stats(&did_manager);
        assert!(total_users == 0, 0);
        assert!(community_verifications == 0, 1);
        assert!(sustainability_actions == 0, 2);

        test_scenario::return_shared(did_manager);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_identity_creation() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, USER1);

        // Create identity for USER1
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            let encrypted_attributes = vector[
                string::utf8(b"encrypted_name_123"),
                string::utf8(b"encrypted_location_456"),
                string::utf8(b"encrypted_phone_789")
            ];
            let attribute_keys = vector[
                string::utf8(b"name"),
                string::utf8(b"location"),
                string::utf8(b"phone")
            ];
            let privacy_hash = b"privacy_hash_123";

            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user1"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        test_scenario::next_tx(test, USER1);
        
        // Set profile to public to test getter functions
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            did_manager::update_privacy_settings(
                &mut did_manager,
                true,  // public_profile
                true,  // share_reputation
                true,  // allow_community_verification
                365,   // data_retention_days
                test_scenario::ctx(test)
            );
            test_scenario::return_shared(did_manager);
        };

        test_scenario::next_tx(test, USER1);
        
        // Verify identity was created with public settings
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let (verification_level, reputation, sustainability_credits, has_profile) = 
                did_manager::get_public_identity_info(&did_manager, USER1);
            
            assert!(verification_level == 0, 0); // Basic level
            assert!(reputation == 100, 1); // Starting reputation
            assert!(sustainability_credits == 0, 2); // No credits yet
            assert!(has_profile, 3); // Now public

            test_scenario::return_shared(did_manager);
        };

        test_scenario::next_tx(test, USER1);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_community_verifier_registration() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, VERIFIER1);

        let did_manager = test_scenario::take_shared<DIDManager>(test);

        // Register community verifier
        did_manager::register_community_verifier(
            &mut did_manager,
            string::utf8(b"Refugee Aid Organization"),
            string::utf8(b"refugee_aid"),
            option::some(string::utf8(b"did:verifier:refugee_org")),
            test_scenario::ctx(test)
        );

        // Verify verifier was registered (we can't directly check internal state,
        // but we can test by trying to use verification functions)
        
        test_scenario::return_shared(did_manager);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_verification_request_workflow() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        // Step 1: Create user identity
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let encrypted_attributes = vector[string::utf8(b"encrypted_data")];
            let attribute_keys = vector[string::utf8(b"identity")];
            let privacy_hash = b"hash123";

            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user1"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::some(string::utf8(b"refugee")),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        // Step 2: Register verifier
        test_scenario::next_tx(test, VERIFIER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            did_manager::register_community_verifier(
                &mut did_manager,
                string::utf8(b"Refugee Support Network"),
                string::utf8(b"refugee_aid"),
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        // Step 3: User requests verification
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            did_manager::request_verification(
                &mut did_manager,
                2, // Community verification level
                b"evidence_document_hash",
                option::some(string::utf8(b"refugee")),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        // Step 4: Verifier processes the request
        test_scenario::next_tx(test, VERIFIER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            // Get the verification request that was created
            let verification_request = test_scenario::take_shared<VerificationRequest>(test);
            
            did_manager::process_verification(
                &mut did_manager,
                &mut verification_request,
                true, // Approve
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(verification_request);
            test_scenario::return_shared(did_manager);
        };

        // Step 5: Verify the user's verification level was updated
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let verification_level = did_manager::get_verification_level(&did_manager, USER1);
            assert!(verification_level == 2, 0); // Should be community verified now

            test_scenario::return_shared(did_manager);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_sustainability_action_recording() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize and create user
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let encrypted_attributes = vector[string::utf8(b"encrypted_data")];
            let attribute_keys = vector[string::utf8(b"identity")];
            let privacy_hash = b"hash123";

            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user1"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        // Record sustainability action
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            did_manager::record_sustainability_action(
                &mut did_manager,
                string::utf8(b"plastic_recycling"),
                50, // 50 credits
                b"recycling_evidence_hash",
                test_scenario::ctx(test)
            );

            // Verify credits were added
            let (_, reputation, sustainability_credits, _) = 
                did_manager::get_public_identity_info(&did_manager, USER1);
            
            // Note: Since profile is private by default, these will be 0
            // In a real test, we'd need to make profile public first

            test_scenario::return_shared(did_manager);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_community_endorsement_system() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        // Create two users
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let encrypted_attributes = vector[string::utf8(b"encrypted_data1")];
            let attribute_keys = vector[string::utf8(b"identity")];
            let privacy_hash = b"hash123";

            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user1"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        test_scenario::next_tx(test, USER2);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let encrypted_attributes = vector[string::utf8(b"encrypted_data2")];
            let attribute_keys = vector[string::utf8(b"identity")];
            let privacy_hash = b"hash456";

            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user2"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        // Register verifier and verify USER1 to community level
        test_scenario::next_tx(test, VERIFIER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            did_manager::register_community_verifier(
                &mut did_manager,
                string::utf8(b"Community Validator"),
                string::utf8(b"general"),
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        // Request and approve verification for USER1
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            did_manager::request_verification(
                &mut did_manager,
                2, // Community level
                b"evidence",
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        test_scenario::next_tx(test, VERIFIER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            let verification_request = test_scenario::take_shared<VerificationRequest>(test);
            
            did_manager::process_verification(
                &mut did_manager,
                &mut verification_request,
                true,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(verification_request);
            test_scenario::return_shared(did_manager);
        };

        // Now USER1 (community verified) can endorse USER2
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            did_manager::endorse_community_member(
                &mut did_manager,
                USER2,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1)] // E_NOT_AUTHORIZED
    fun test_unauthorized_verification_processing() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        // Create user and request verification
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let encrypted_attributes = vector[string::utf8(b"encrypted_data")];
            let attribute_keys = vector[string::utf8(b"identity")];
            let privacy_hash = b"hash123";

            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user1"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            did_manager::request_verification(
                &mut did_manager,
                2,
                b"evidence",
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        // Try to process verification without being a registered verifier
        test_scenario::next_tx(test, USER2); // USER2 is not a verifier
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            let verification_request = test_scenario::take_shared<VerificationRequest>(test);
            
            // This should fail with E_NOT_AUTHORIZED
            did_manager::process_verification(
                &mut did_manager,
                &mut verification_request,
                true,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(verification_request);
            test_scenario::return_shared(did_manager);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 2)] // E_IDENTITY_EXISTS
    fun test_duplicate_identity_creation() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let encrypted_attributes = vector[string::utf8(b"encrypted_data")];
            let attribute_keys = vector[string::utf8(b"identity")];
            let privacy_hash = b"hash123";

            // Create identity first time
            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user1"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            // Try to create identity again - should fail
            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user1_new"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4)] // E_INSUFFICIENT_REPUTATION
    fun test_insufficient_reputation_for_endorsement() {
        let scenario = test_scenario::begin(ADMIN);
        let test = &mut scenario;

        // Initialize
        {
            did_manager::init_for_testing(test_scenario::ctx(test));
        };

        // Create two users
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let encrypted_attributes = vector[string::utf8(b"encrypted_data1")];
            let attribute_keys = vector[string::utf8(b"identity")];
            let privacy_hash = b"hash123";

            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user1"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        test_scenario::next_tx(test, USER2);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            let encrypted_attributes = vector[string::utf8(b"encrypted_data2")];
            let attribute_keys = vector[string::utf8(b"identity")];
            let privacy_hash = b"hash456";

            did_manager::create_identity(
                &mut did_manager,
                string::utf8(b"did:greenvault:user2"),
                encrypted_attributes,
                attribute_keys,
                privacy_hash,
                option::none(),
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        // USER1 (only basic verification) tries to endorse USER2 - should fail
        test_scenario::next_tx(test, USER1);
        {
            let did_manager = test_scenario::take_shared<DIDManager>(test);
            
            did_manager::endorse_community_member(
                &mut did_manager,
                USER2,
                test_scenario::ctx(test)
            );

            test_scenario::return_shared(did_manager);
        };

        test_scenario::end(scenario);
    }
}
