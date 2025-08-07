# GreenVault Smart Contract Testing Guide
(How to test functions using sui client call)

## 📋 Required Deployment Information

After deploying your GreenVault smart contract, you'll need to collect the following IDs from your deployment output:

- **PACKAGE_ID:** The main contract package ID (starts with 0x...)
- **REGISTRY_ID:** The carbon credit registry shared object ID
- **DID_REGISTRY_ID:** The DID registry shared object ID  
- **ORACLE_REGISTRY_ID:** The oracle registry shared object ID
- **MARKETPLACE_ID:** The marketplace shared object ID
- **DID_MANAGER_ID:** The DID manager shared object ID
- **MICRO_CREDIT_SYSTEM_ID:** The micro credit system shared object ID
- **TREASURY_CAP_ID:** The treasury capability object ID

## Prerequisites
Before testing, make sure you have:
1. Successfully deployed the GreenVault contract
2. Collected all the required object IDs from deployment
3. Sui CLI installed and configured
4. Active Sui wallet with sufficient SUI for gas fees

## 🚀 Deploying the GreenVault Smart Contract

Follow these steps to deploy your GreenVault contract on Sui:

### 1. (Optional) Create a New Address

If you want to use a fresh address for deployment:

```sh
sui client new-address ed25519
```

- Follow the prompts to create and name your new address.

### 2. (Optional) Fund Your Address with SUI

If you are on a testnet, request SUI from the faucet:

```sh
sui client faucet
```

- Make sure your address has enough SUI for deployment gas fees.

### 3. Build the Move Package

Navigate to your contract directory and build the package:

```sh
cd /path/to/greenvault/move
sui move build
```

### 4. Publish the Package

Deploy the contract to the Sui network:

```sh
sui client publish --gas-budget 100000000
```

- This command will output your `PACKAGE_ID` and initial shared object IDs.

### 5. Record Deployment Output

Copy and save the following IDs from the publish output:
- `PACKAGE_ID`
- `REGISTRY_ID`
- `DID_REGISTRY_ID`
- `ORACLE_REGISTRY_ID`
- `MARKETPLACE_ID`
- `DID_MANAGER_ID`
- `MICRO_CREDIT_SYSTEM_ID`
- `TREASURY_CAP_ID`

You will need these for all subsequent testing steps.

### 6. Verify Deployment

Check that your package and objects exist:

```sh
sui client object PACKAGE_ID
sui client object REGISTRY_ID
```

If you see object details, your deployment was successful.

## Step 1: Get Your Address

```sh
sui client active-address
```

## Step 2: Get Oracle Addresses

### Option 1: Use your own address as oracle (for testing)
```sh
# Get your current address to use as oracle
export ORACLE_ADDRESS=$(sui client active-address)
echo $ORACLE_ADDRESS
```

### Option 2: Create new addresses for different oracles
```sh
# Create new addresses for testing multiple oracles
sui client new-address ed25519
sui client new-address ed25519
sui client new-address ed25519

# List all your addresses
sui client addresses

# Switch between addresses
sui client switch --address ADDRESS_ALIAS_OR_ADDRESS
```

## Step 3: Get Shared Objects (after deployment)

```sh
sui client object REGISTRY_ID
sui client object MARKETPLACE_ID
sui client object ORACLE_REGISTRY_ID
```

## Example Test Commands  
Replace all uppercase placeholders (e.g., `PACKAGE_ID`, `REGISTRY_ID`, etc.) with your actual IDs.

### 1. Register a Carbon Offset Project

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function register_project \
    --args REGISTRY_ID \
        "FOREST_001" \
        "Amazon Reforestation Project" \
        "Community-led reforestation in the Amazon rainforest" \
        "Brazil, Para State" \
        0 \
        100000 \
        '["Kayapo Indigenous Community"]' \
        "satellite_monitoring_api" \
        '["did:greenvault:kayapo123"]' \
    --gas-budget 10000000
```

### 2. Add Verified Issuer (Admin only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function add_verified_issuer \
    --args REGISTRY_ID \
        YOUR_ADDRESS \
    --gas-budget 10000000
```

### 3. Verify Project (Admin only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function verify_project \
    --args REGISTRY_ID \
        "FOREST_001" \
    --gas-budget 10000000
```

### 4. Mint Carbon Credit

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function mint_carbon_credit \
    --args REGISTRY_ID \
        "FOREST_001" \
        "AMZN-2024-001" \
        2024 \
        50000 \
        "VCS_v4.0" \
        "https://ipfs.io/metadata/forest001" \
        "[]" \
        '["did:greenvault:kayapo123"]' \
    --gas-budget 10000000
```

### 5. Register DID Identity

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function register_did \
    --args DID_REGISTRY_ID \
        "did:greenvault:user123" \
        "[]" \
    --gas-budget 10000000
```

### 6. Mint Micro Credit (for small actions)

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function mint_micro_credit \
    --args REGISTRY_ID \
        "recycling" \
        100 \
        "[]" \
        '["did:greenvault:user123"]' \
    --gas-budget 10000000
```

### 7. List Credit for Sale (requires owning a credit)

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function list_credit_for_sale \
    --args MARKETPLACE_ID \
        CREDIT_ID \
        1000000000 \
        false \
    --gas-budget 10000000
```

### 8. Buy Credit (requires listed credit and SUI payment)

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function buy_credit \
    --args MARKETPLACE_ID \
        CREDIT_ID \
        PAYMENT_COIN_ID \
    --gas-budget 10000000
```

### 9. Retire Credit (permanently remove from circulation)

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function retire_credit \
    --args REGISTRY_ID \
        CREDIT_ID \
        "Retirement reason text" \
    --gas-budget 10000000
```

### 10. Query Functions (Read-only, no gas required)

#### Get marketplace stats

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function get_marketplace_stats \
    --args MARKETPLACE_ID
```

#### Get registry stats

```sh
sui client call \
    --package PACKAGE_ID \
    --module carbon_credit \
    --function get_registry_stats \
    --args REGISTRY_ID
```

### 11. Oracle Integration Testing

**Note**: Replace `ORACLE_ADDRESS` with actual addresses. See "Step 2: Get Oracle Addresses" section above for how to obtain them.

#### Register oracle (Admin only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function register_oracle \
    --args ORACLE_REGISTRY_ID \
        ORACLE_ADDRESS \
        5000 \
    --gas-budget 10000000
```

#### Request CO2 verification

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function request_co2_verification \
    --args "FOREST_001" \
        "co2_sequestered" \
        25000 \
        "tonnes_co2" \
        "[]" \
        "satellite_monitoring" \
    --gas-budget 10000000
```

#### Submit oracle verification (Oracle only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function submit_oracle_verification \
    --args ORACLE_REGISTRY_ID \
        VERIFICATION_REQUEST_ID \
        25000 \
        95 \
        "[]" \
    --gas-budget 10000000
```

#### Update data feed (Oracle only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function update_data_feed \
    --args ORACLE_REGISTRY_ID \
        "co2_emissions_global" \
        0 \
        450000000 \
        "[]" \
    --gas-budget 10000000
```

#### Slash oracle for malicious behavior (Admin only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function slash_oracle \
    --args ORACLE_REGISTRY_ID \
        ORACLE_ADDRESS \
        "Submitting false data" \
        1000 \
    --gas-budget 10000000
```

#### Query oracle reputation (Read-only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function get_oracle_reputation \
    --args ORACLE_REGISTRY_ID \
        ORACLE_ADDRESS
```

#### Query data feed (Read-only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function get_data_feed \
    --args ORACLE_REGISTRY_ID \
        "co2_emissions_global"
```

#### Validate data feed (Read-only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function validate_data_feed \
    --args ORACLE_REGISTRY_ID \
        "co2_emissions_global"
```

#### Check verification status (Read-only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function is_verification_complete \
    --args VERIFICATION_REQUEST_ID
```

#### Get data feed by type (Read-only)

```sh
sui client call \
    --package PACKAGE_ID \
    --module oracle_integration \
    --function get_data_feed_by_type \
    --args ORACLE_REGISTRY_ID \
        0
```

### 12. Oracle Testing Workflow Example

```sh
# Step 0: Get oracle addresses (choose one method)
# Method A: Use your own address for all oracles (simple testing)
ORACLE1_ADDRESS=$(sui client active-address)
ORACLE2_ADDRESS=$(sui client active-address)  
ORACLE3_ADDRESS=$(sui client active-address)

# Method B: Create separate addresses for each oracle
# sui client new-address ed25519  # Creates ORACLE1
# sui client new-address ed25519  # Creates ORACLE2  
# sui client new-address ed25519  # Creates ORACLE3
# Then use: sui client addresses  # to see all addresses

# Step 1: Register multiple oracles (as admin)
sui client call --package PACKAGE_ID --module oracle_integration --function register_oracle --args ORACLE_REGISTRY_ID $ORACLE1_ADDRESS 5000 --gas-budget 10000000
sui client call --package PACKAGE_ID --module oracle_integration --function register_oracle --args ORACLE_REGISTRY_ID $ORACLE2_ADDRESS 7500 --gas-budget 10000000
sui client call --package PACKAGE_ID --module oracle_integration --function register_oracle --args ORACLE_REGISTRY_ID $ORACLE3_ADDRESS 6000 --gas-budget 10000000

# Step 1.5: Check initial oracle reputations (should all be 100)
echo "=== INITIAL ORACLE REPUTATIONS ==="
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE1_ADDRESS
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE2_ADDRESS
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE3_ADDRESS

# Step 2: Request CO2 verification
sui client call --package PACKAGE_ID --module oracle_integration --function request_co2_verification --args "PROJECT_001" "co2_sequestered" 35000 "tonnes_co2" "[]" "satellite_monitoring" --gas-budget 10000000

# Step 3: Multiple oracles submit verification (switch addresses)
# Note: To simulate different oracles, you need to switch active addresses

# Oracle 1 submits (ensure you're using the right address)
sui client switch --address $ORACLE1_ADDRESS  # Switch to oracle 1
sui client call --package PACKAGE_ID --module oracle_integration --function submit_oracle_verification --args ORACLE_REGISTRY_ID VERIFICATION_REQUEST_ID 35000 95 "[]" --gas-budget 10000000

# Oracle 2 submits  
sui client switch --address $ORACLE2_ADDRESS  # Switch to oracle 2
sui client call --package PACKAGE_ID --module oracle_integration --function submit_oracle_verification --args ORACLE_REGISTRY_ID VERIFICATION_REQUEST_ID 34800 92 "[]" --gas-budget 10000000

# Oracle 3 submits (completes verification)
sui client switch --address $ORACLE3_ADDRESS  # Switch to oracle 3
sui client call --package PACKAGE_ID --module oracle_integration --function submit_oracle_verification --args ORACLE_REGISTRY_ID VERIFICATION_REQUEST_ID 35100 90 "[]" --gas-budget 10000000

# Step 4: Check verification is complete
# Note: Any address can check verification status (read-only function)
sui client call --package PACKAGE_ID --module oracle_integration --function is_verification_complete --args VERIFICATION_REQUEST_ID

# Step 5: Check oracle reputations increased
# Note: Any address can query oracle reputations (read-only function)
# You can use any active address to check reputation of specific oracles
echo "=== FINAL ORACLE REPUTATIONS (should be 101 each) ==="
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE1_ADDRESS
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE2_ADDRESS
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE3_ADDRESS

# Expected result: Each oracle's reputation should increase from 100 to 101
# - New oracles start with reputation 100
# - Each successful verification participation adds +1 to reputation
```

### 13. Oracle Reputation Tracking

#### How Oracle Reputation Works:
- **Initial reputation**: 100 (when first registered)
- **Successful verification**: +1 reputation per participation
- **Malicious behavior (slashing)**: -10 reputation per slash

#### How to Track Reputation Changes:
```sh
# Step 1: Check initial reputation after registering oracles
echo "=== CHECKING INITIAL REPUTATIONS ==="
INITIAL_REP1=$(sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE1_ADDRESS)
INITIAL_REP2=$(sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE2_ADDRESS)
INITIAL_REP3=$(sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE3_ADDRESS)

echo "Oracle 1 initial reputation: $INITIAL_REP1 (should be 100)"
echo "Oracle 2 initial reputation: $INITIAL_REP2 (should be 100)"
echo "Oracle 3 initial reputation: $INITIAL_REP3 (should be 100)"

# Step 2: After verification process, check final reputation
echo "=== CHECKING FINAL REPUTATIONS ==="
FINAL_REP1=$(sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE1_ADDRESS)
FINAL_REP2=$(sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE2_ADDRESS)
FINAL_REP3=$(sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE3_ADDRESS)

echo "Oracle 1 final reputation: $FINAL_REP1 (should be 101)"
echo "Oracle 2 final reputation: $FINAL_REP2 (should be 101)"
echo "Oracle 3 final reputation: $FINAL_REP3 (should be 101)"
```

#### Reading the Output:
When you call `get_oracle_reputation`, look for this in the output:
```
╭─────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Effects                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Status: Success                                                                     │
│ Gas used: xxx                                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Return Values                                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──                                                                                │
│  │ Value: 101                    ← This is the reputation score                    │
│  │ Type: u64                                                                        │
│  └──                                                                                │
╰─────────────────────────────────────────────────────────────────────────────────────╯
```

### 14. Address Requirements for Different Operations

#### Admin-only operations (must use admin/deployer address):
- `register_oracle` - Only admin can register new oracles
- `slash_oracle` - Only admin can slash oracles
- `add_verified_issuer` - Only admin can add issuers
- `verify_project` - Only admin can verify projects

#### Oracle-specific operations (must use registered oracle address):
- `submit_oracle_verification` - Only registered oracles can submit
- `update_data_feed` - Only registered oracles can update feeds

#### Issuer-specific operations (must use verified issuer address):
- `mint_carbon_credit` - Only verified issuers can mint
- `register_project` - Any address can register projects

#### Read-only operations (any address can call):
- `get_oracle_reputation` - Check any oracle's reputation
- `is_verification_complete` - Check verification status
- `get_data_feed` - Get data feed information
- `validate_data_feed` - Validate feed existence
- `get_marketplace_stats` - Get marketplace statistics
- `get_registry_stats` - Get registry statistics

#### Practical example for checking operations:
```sh
# Switch to admin address for checking reputations (or use any address)
sui client switch --address ADMIN_ADDRESS

# Check verification status (any address works)
sui client call --package PACKAGE_ID --module oracle_integration --function is_verification_complete --args VERIFICATION_REQUEST_ID

# Check each oracle's reputation (any address works)
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE1_ADDRESS
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE2_ADDRESS
sui client call --package PACKAGE_ID --module oracle_integration --function get_oracle_reputation --args ORACLE_REGISTRY_ID $ORACLE3_ADDRESS
```

### 15. Data Feed Types Reference

- **0**: CO2 Emissions
- **1**: Forest Coverage  
- **2**: Renewable Energy
- **3**: Waste Reduction

### 16. Useful Helper Commands

#### Check your objects (to find credit IDs, etc.)

```sh
sui client objects
```

#### Check specific object details

```sh
sui client object OBJECT_ID
```

#### Check transaction details

```sh
sui client transaction-block TRANSACTION_DIGEST
```

#### Monitor events

```sh
sui client events --package PACKAGE_ID
```

### 17. Testing Workflow Example:
1. Deploy contract → get PACKAGE_ID and shared object IDs
2. Add yourself as verified issuer
3. Register a project 
4. Verify the project
5. Mint carbon credits
6. List credits for sale
7. Test micro-credit minting
8. Register oracles and test verification
9. Query stats to verify everything worked

### 18. Error Handling:
Common errors and solutions:
- E_NOT_AUTHORIZED: Make sure you're added as verified issuer
- E_INVALID_PROJECT: Project must be verified before minting
- E_INVALID_QUANTITY: Quantity must be > 0
- E_INSUFFICIENT_FUNDS: Need enough SUI for gas
- E_ORACLE_NOT_AUTHORIZED: Oracle must be registered first
- E_STALE_DATA: Verification request may be expired or completed
