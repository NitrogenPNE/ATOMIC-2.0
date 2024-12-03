"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Token Communication Node - Blockchain Utilities
// ------------------------------------------------------------------------------

// Dependencies
const { logToBlockchain, fetchBlockchainState } = require("../../../atomic-blockchain/core/blockchainLogger");
const { Transaction } = require("../../../atomic-blockchain/core/transaction");
const { validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");
const crypto = require("crypto");
const { logInfo, logError } = require("../../../atomic-blockchain/Utilities/loggingUtils");

// Blockchain Configuration
const BLOCKCHAIN_CONFIG = {
    nodeUrl: process.env.BLOCKCHAIN_NODE_URL || "http://localhost:8545",
    transactionModule: "../../../atomic-blockchain/core/transaction",
    shardManager: "../../../atomic-blockchain/scripts/shardMetadataManager",
};

/**
 * Log an action to the blockchain with token validation.
 * @param {Object} actionDetails - Details of the action to log (e.g., action type, token details).
 * @param {Object} tokenDetails - Proof-of-Access token details including tokenId and encryptedToken.
 * @returns {Promise<boolean>} - True if the action is logged successfully.
 */
async function logActionToBlockchain(actionDetails, tokenDetails) {
    logInfo("Logging action to blockchain...", { actionDetails });

    try {
        // Validate the token
        const isValidToken = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!isValidToken) {
            logError("Token validation failed. Action not logged to blockchain.", { tokenId: tokenDetails.tokenId });
            return false;
        }

        // Log action to the blockchain
        const result = await logToBlockchain(actionDetails, BLOCKCHAIN_CONFIG.nodeUrl);
        logInfo("Action logged to blockchain successfully.", { result });
        return true;
    } catch (error) {
        logError("Failed to log action to blockchain.", { error: error.message });
        return false;
    }
}

/**
 * Fetch the current state of the blockchain.
 * @returns {Promise<Object>} - The current blockchain state.
 */
async function fetchBlockchainStateData() {
    logInfo("Fetching blockchain state...");

    try {
        const state = await fetchBlockchainState(BLOCKCHAIN_CONFIG.nodeUrl);
        logInfo("Blockchain state fetched successfully.", { state });
        return state;
    } catch (error) {
        logError("Failed to fetch blockchain state.", { error: error.message });
        throw error;
    }
}

/**
 * Submit a token communication transaction to the blockchain.
 * @param {Object} transactionDetails - Details of the transaction (e.g., token metadata, message hash).
 * @param {Object} tokenDetails - Proof-of-Access token details including tokenId and encryptedToken.
 * @returns {Promise<boolean>} - True if the transaction is submitted successfully.
 */
async function submitTokenTransaction(transactionDetails, tokenDetails) {
    logInfo("Submitting token communication transaction to blockchain...", { transactionDetails });

    try {
        // Validate the token
        const isValidToken = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!isValidToken) {
            logError("Token validation failed. Transaction not submitted.", { tokenId: tokenDetails.tokenId });
            return false;
        }

        // Create a new transaction
        const transaction = new Transaction(
            [], // Inputs
            [{ address: BLOCKCHAIN_CONFIG.nodeUrl, amount: 0 }], // Outputs
            { shardID: "token-communication", frequency: 500 }, // Shard Metadata
            { tokenId: tokenDetails.tokenId, encryptedToken: tokenDetails.encryptedToken } // Token Metadata
        );

        // Sign and validate the transaction
        transaction.sign(tokenDetails.keyPair);
        if (!(await transaction.validate())) {
            logError("Transaction validation failed.");
            return false;
        }

        // Log the transaction to the blockchain
        const result = await logToBlockchain(transaction.toJSON(), BLOCKCHAIN_CONFIG.nodeUrl);
        if (result) {
            logInfo("Transaction submitted and logged successfully.");
            return true;
        } else {
            logError("Failed to log transaction to blockchain.");
            return false;
        }
    } catch (error) {
        logError("Failed to submit token communication transaction.", { error: error.message });
        return false;
    }
}

module.exports = {
    logActionToBlockchain,
    fetchBlockchainStateData,
    submitTokenTransaction,
};