// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title UserPreferencesStorage
 * @dev Store encrypted user preferences on Oasis Sapphire
 * This contract stores encrypted data - decryption happens client-side
 */
contract UserPreferencesStorage {
    
    // Event emitted when preferences are updated
    event PreferencesUpdated(string indexed userId, uint256 timestamp);
    
    // Mapping from userId to encrypted preferences data
    mapping(string => bytes) private userPreferences;
    
    // Mapping to track if user has preferences
    mapping(string => bool) public hasPreferences;
    
    // Contract owner
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Store encrypted preferences for a user
     * @param userId The user's unique identifier
     * @param encryptedData The encrypted preferences data
     */
    function storePreferences(string memory userId, bytes memory encryptedData) external {
        userPreferences[userId] = encryptedData;
        hasPreferences[userId] = true;
        
        emit PreferencesUpdated(userId, block.timestamp);
    }
    
    /**
     * @dev Retrieve encrypted preferences for a user
     * @param userId The user's unique identifier
     * @return The encrypted preferences data
     */
    function getPreferences(string memory userId) external view returns (bytes memory) {
        return userPreferences[userId];
    }
    
    /**
     * @dev Delete preferences for a user
     * @param userId The user's unique identifier
     */
    function deletePreferences(string memory userId) external {
        delete userPreferences[userId];
        hasPreferences[userId] = false;
        
        emit PreferencesUpdated(userId, block.timestamp);
    }
    
    /**
     * @dev Check if user has stored preferences
     * @param userId The user's unique identifier
     * @return Boolean indicating if preferences exist
     */
    function userHasPreferences(string memory userId) external view returns (bool) {
        return hasPreferences[userId];
    }
}
