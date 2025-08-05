// File: scripts/deployment.move
// Deployment and configuration scripts

module greenvault::deployment {
    use greenvault::carbon_credit;
    use greenvault::oracle_integration;
    use sui::tx_context::TxContext;
    use std::string;
    use std::option;

    // Setup initial configuration for production
    public entry fun setup_production_config(
        registry: &mut carbon_credit::ProjectRegistry,
        oracle_registry: &mut oracle_integration::OracleRegistry,
        ctx: &mut TxContext
    ) {
        // Add verified issuers for major carbon registries
        let verra_issuer = @0x1; // Placeholder for Verra registry
        let gold_standard_issuer = @0x2; // Placeholder for Gold Standard
        
        carbon_credit::add_verified_issuer(registry, verra_issuer, ctx);
        carbon_credit::add_verified_issuer(registry, gold_standard_issuer, ctx);

        // Register initial oracle providers
        oracle_integration::register_oracle(
            oracle_registry,
            @0x3, // Oracle address
            1000, // stake amount
            ctx
        );
    }

    // Setup demo projects for testing
    public entry fun setup_demo_projects(
        registry: &mut carbon_credit::ProjectRegistry,
        ctx: &mut TxContext
    ) {
        // Register a community reforestation project
        carbon_credit::register_project(
            registry,
            string::utf8(b"FOREST_001"),
            string::utf8(b"Amazon Reforestation"),
            string::utf8(b"Community-led reforestation in Amazon"),
            string::utf8(b"Brazil, Para State"),
            0, // PROJECT_REFORESTATION
            100000, // 100 tons CO2 capacity
            option::some(string::utf8(b"Kayapo Indigenous Community")),
            string::utf8(b"satellite_monitoring_api"),
            option::some(string::utf8(b"did:greenvault:kayapo123")),
            ctx
        );

        // Register clean cooking project
        carbon_credit::register_project(
            registry,
            string::utf8(b"COOK_001"),
            string::utf8(b"Clean Cooking Stoves"),
            string::utf8(b"Efficient cooking stoves for rural communities"),
            string::utf8(b"Kenya, Turkana County"),
            1, // PROJECT_CLEAN_COOKING
            50000, // 50 tons CO2 capacity
            option::some(string::utf8(b"Turkana Pastoralist Women Group")),
            string::utf8(b"iot_sensor_network"),
            option::some(string::utf8(b"did:greenvault:turkana456")),
            ctx
        );

        // Register renewable energy project
        carbon_credit::register_project(
            registry,
            string::utf8(b"SOLAR_001"),
            string::utf8(b"Community Solar"),
            string::utf8(b"Solar power for rural electrification"),
            string::utf8(b"India, Rajasthan"),
            2, // PROJECT_RENEWABLE_ENERGY
            80000, // 80 tons CO2 capacity
            option::some(string::utf8(b"Rural Women Cooperative")),
            string::utf8(b"smart_meter_network"),
            option::some(string::utf8(b"did:greenvault:rajasthan789")),
            ctx
        );

        // Register agriculture project
        carbon_credit::register_project(
            registry,
            string::utf8(b"AGRI_001"),
            string::utf8(b"Regenerative Agriculture"),
            string::utf8(b"Sustainable farming practices"),
            string::utf8(b"Ethiopia, Oromia"),
            4, // PROJECT_AGRICULTURE
            60000, // 60 tons CO2 capacity
            option::some(string::utf8(b"Oromo Farmers Association")),
            string::utf8(b"soil_sensor_network"),
            option::some(string::utf8(b"did:greenvault:oromia456")),
            ctx
        );
    }
}