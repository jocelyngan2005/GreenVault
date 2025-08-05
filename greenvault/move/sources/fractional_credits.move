// File: sources/fractional_credits.move
// Fractional Carbon Credit System for Micro-transactions

module greenvault::fractional_credits {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // Import the main carbon credit module
    use greenvault::carbon_credit::{CarbonCredit};

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_INVALID_FRACTION: u64 = 3;
    #[allow(unused_const)]
    const E_CREDIT_NOT_FRACTIONAL: u64 = 4;

    // One-time witness for coin creation (must match module name in uppercase)
    struct FRACTIONAL_CREDITS has drop {}

    // Fractional Credit Pool
    struct FractionalPool has key {
        id: UID,
        original_credit_id: ID,
        total_fractions: u64,
        available_fractions: Balance<FRACTIONAL_CREDITS>,
        min_purchase: u64, // Minimum fractions per purchase
        price_per_fraction: u64, // In SUI tokens
        metadata: CreditMetadata,
        holders: Table<address, u64>, // Track fraction ownership
        created_at: u64,
    }

    struct CreditMetadata has store {
        project_id: String,
        project_type: u8,
        vintage_year: u16,
        methodology: String,
        beneficiary_community: Option<String>,
        co2_per_fraction: u64, // CO2 offset per fraction (in grams)
    }

    // Micro-transaction system for small eco-friendly actions
    struct MicroCreditSystem has key {
        id: UID,
        admin: address,
        action_rewards: Table<String, u64>, // Action type -> fraction reward
        daily_limits: Table<address, DailyLimit>,
        total_micro_credits_issued: u64,
        community_pool: Balance<FRACTIONAL_CREDITS>,
    }

    struct DailyLimit has store {
        date: u64, // Day timestamp
        credits_earned: u64,
        actions_performed: u64,
        limit_reached: bool,
    }

    // Events
    struct CreditFractionalized has copy, drop {
        original_credit_id: ID,
        pool_id: ID,
        total_fractions: u64,
        price_per_fraction: u64,
    }

    struct FractionsPurchased has copy, drop {
        buyer: address,
        pool_id: ID,
        fractions_bought: u64,
        total_cost: u64,
    }

    struct MicroCreditEarned has copy, drop {
        user: address,
        action_type: String,
        fractions_earned: u64,
        evidence_hash: vector<u8>,
    }

    struct FractionalCreditRetired has copy, drop {
        retired_by: address,
        fractions_retired: u64,
        retirement_reason: String,
    }

    // Initialize the fractional credit system
    fun init(witness: FRACTIONAL_CREDITS, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency<FRACTIONAL_CREDITS>(
            witness,
            6, // 6 decimal places for precision
            b"GVCF", // GreenVault Carbon Fraction
            b"GreenVault Fractional Carbon Credits",
            b"Fractional carbon credits for micro-transactions and inclusive trading",
            option::none(),
            ctx
        );

        // Store treasury cap for minting fractions
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);

        // Create micro-credit system
        let micro_system = MicroCreditSystem {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            action_rewards: table::new(ctx),
            daily_limits: table::new(ctx),
            total_micro_credits_issued: 0,
            community_pool: balance::zero<FRACTIONAL_CREDITS>(),
        };

        transfer::share_object(micro_system);
    }

    // Fractionalize a carbon credit NFT
    public entry fun fractionalize_credit(
        credit: CarbonCredit,
        total_fractions: u64,
        price_per_fraction: u64,
        min_purchase: u64,
        treasury_cap: &mut TreasuryCap<FRACTIONAL_CREDITS>,
        ctx: &mut TxContext
    ) {
        assert!(total_fractions > 0 && total_fractions <= 10000, E_INVALID_FRACTION);
        assert!(min_purchase > 0 && min_purchase <= total_fractions / 10, E_INVALID_FRACTION);

        let original_credit_id = object::id(&credit);
        
        // Extract metadata from original credit
        let (project_id, quantity, _, beneficiary_community) = 
            greenvault::carbon_credit::get_credit_info(&credit);

        let metadata = CreditMetadata {
            project_id,
            project_type: 0, // Will be extracted properly in production
            vintage_year: 2024, // Will be extracted properly
            methodology: string::utf8(b"Fractionalization v1.0"),
            beneficiary_community,
            co2_per_fraction: quantity * 1000 / total_fractions, // Convert to grams per fraction
        };

        // Mint fractional tokens
        let fractions = coin::mint(treasury_cap, total_fractions, ctx);
        let fraction_balance = coin::into_balance(fractions);

        let pool = FractionalPool {
            id: object::new(ctx),
            original_credit_id,
            total_fractions,
            available_fractions: fraction_balance,
            min_purchase,
            price_per_fraction,
            metadata,
            holders: table::new(ctx),
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        let pool_id = object::id(&pool);

        event::emit(CreditFractionalized {
            original_credit_id,
            pool_id,
            total_fractions,
            price_per_fraction,
        });

        // Destroy the original NFT as it's now fractionalized
        greenvault::carbon_credit::retire_credit_for_fractionalization(credit);
        
        transfer::share_object(pool);
    }

    // Purchase fractions from a pool
    public entry fun purchase_fractions(
        pool: &mut FractionalPool,
        fractions_to_buy: u64,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        
        assert!(fractions_to_buy >= pool.min_purchase, E_INVALID_FRACTION);
        assert!(
            balance::value(&pool.available_fractions) >= fractions_to_buy,
            E_INSUFFICIENT_BALANCE
        );

        let total_cost = fractions_to_buy * pool.price_per_fraction;
        assert!(coin::value(&payment) >= total_cost, E_INSUFFICIENT_BALANCE);

        // Extract fractions from pool
        let purchased_fractions = balance::split(&mut pool.available_fractions, fractions_to_buy);
        let fraction_coin = coin::from_balance(purchased_fractions, ctx);

        // Update holder records
        if (table::contains(&pool.holders, buyer)) {
            let current = table::remove(&mut pool.holders, buyer);
            table::add(&mut pool.holders, buyer, current + fractions_to_buy);
        } else {
            table::add(&mut pool.holders, buyer, fractions_to_buy);
        };

        // Transfer fractions to buyer
        transfer::public_transfer(fraction_coin, buyer);

        // Handle payment (simplified - in production, send to project developer)
        transfer::public_transfer(payment, @0x1); // Placeholder address

        event::emit(FractionsPurchased {
            buyer,
            pool_id: object::id(pool),
            fractions_bought: fractions_to_buy,
            total_cost,
        });
    }

    // Setup micro-credit rewards for eco-friendly actions
    public entry fun setup_action_rewards(
        micro_system: &mut MicroCreditSystem,
        action_type: String,
        fraction_reward: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == micro_system.admin, E_NOT_AUTHORIZED);
        
        if (table::contains(&micro_system.action_rewards, action_type)) {
            let _current_reward = table::remove(&mut micro_system.action_rewards, action_type);
            table::add(&mut micro_system.action_rewards, action_type, fraction_reward);
        } else {
            table::add(&mut micro_system.action_rewards, action_type, fraction_reward);
        };
    }

    // Claim micro-credits for eco-friendly actions
    public entry fun claim_micro_credits(
        micro_system: &mut MicroCreditSystem,
        action_type: String,
        evidence_hash: vector<u8>,
        treasury_cap: &mut TreasuryCap<FRACTIONAL_CREDITS>,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        assert!(
            table::contains(&micro_system.action_rewards, action_type),
            E_INVALID_FRACTION
        );

        let reward = *table::borrow(&micro_system.action_rewards, action_type);
        
        // Check daily limits
        let today = tx_context::epoch_timestamp_ms(ctx) / 86400000; // Convert to days
        
        if (table::contains(&micro_system.daily_limits, user)) {
            let limit = table::borrow_mut(&mut micro_system.daily_limits, user);
            if (limit.date == today) {
                assert!(!limit.limit_reached, E_INVALID_FRACTION);
                limit.credits_earned = limit.credits_earned + reward;
                limit.actions_performed = limit.actions_performed + 1;
                
                // Set daily limit (e.g., 100 fractions per day)
                if (limit.credits_earned >= 100) {
                    limit.limit_reached = true;
                };
            } else {
                // New day, reset limits
                limit.date = today;
                limit.credits_earned = reward;
                limit.actions_performed = 1;
                limit.limit_reached = false;
            };
        } else {
            let new_limit = DailyLimit {
                date: today,
                credits_earned: reward,
                actions_performed: 1,
                limit_reached: false,
            };
            table::add(&mut micro_system.daily_limits, user, new_limit);
        };

        // Mint micro-credits
        let micro_credits = coin::mint(treasury_cap, reward, ctx);
        transfer::public_transfer(micro_credits, user);

        micro_system.total_micro_credits_issued = 
            micro_system.total_micro_credits_issued + reward;

        event::emit(MicroCreditEarned {
            user,
            action_type,
            fractions_earned: reward,
            evidence_hash,
        });
    }

    // Retire fractional credits for carbon offsetting
    public entry fun retire_fractions(
        fractions: Coin<FRACTIONAL_CREDITS>,
        retirement_reason: String,
        treasury_cap: &mut TreasuryCap<FRACTIONAL_CREDITS>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&fractions);
        let retirer = tx_context::sender(ctx);

        // Burn the fractional credits
        coin::burn(treasury_cap, fractions);

        // In production, this would update a retirement registry
        // and issue retirement certificates

        // Emit local retirement event
        event::emit(FractionalCreditRetired {
            retired_by: retirer,
            fractions_retired: amount,
            retirement_reason,
        });
    }

    // Getter functions
    public fun get_pool_info(pool: &FractionalPool): (u64, u64, u64, String) {
        (
            pool.total_fractions,
            balance::value(&pool.available_fractions),
            pool.price_per_fraction,
            pool.metadata.project_id
        )
    }

    public fun get_user_fraction_balance(pool: &FractionalPool, user: address): u64 {
        if (table::contains(&pool.holders, user)) {
            *table::borrow(&pool.holders, user)
        } else {
            0
        }
    }

    public fun get_daily_limit_info(
        micro_system: &MicroCreditSystem,
        user: address
    ): (u64, u64, bool) {
        if (table::contains(&micro_system.daily_limits, user)) {
            let limit = table::borrow(&micro_system.daily_limits, user);
            (limit.credits_earned, limit.actions_performed, limit.limit_reached)
        } else {
            (0, 0, false)
        }
    }

    // Test-only functions  
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Only create the micro credit system for testing
        let micro_system = MicroCreditSystem {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            action_rewards: table::new(ctx),
            daily_limits: table::new(ctx),
            total_micro_credits_issued: 0,
            community_pool: balance::zero<FRACTIONAL_CREDITS>(),
        };
        transfer::share_object(micro_system);
    }

    #[test_only]
    public fun create_treasury_cap_for_testing(ctx: &mut TxContext): TreasuryCap<FRACTIONAL_CREDITS> {
        coin::create_treasury_cap_for_testing<FRACTIONAL_CREDITS>(ctx)
    }
}
