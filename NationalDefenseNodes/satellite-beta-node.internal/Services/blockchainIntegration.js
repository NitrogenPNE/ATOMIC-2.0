"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Beta Node Blockchain Integration
// ------------------------------------------------------------------------------

// Dependencies
const { logToBlockchain, fetchBlockchainState } = require("../../../atomic-blockchain/core/blockchainLogger");
const { validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");
const { Transaction } = require("../../../atomic-blockchain/core/transaction");
const winston = require("winston");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "../Logs/blockchainIntegration.log" })
    ]
});

// Configuration
const BLOCKCHAIN_CONFIG = {
    nodeUrl: process.env.BLOCKCHAIN_NODE_URL || "http://localhost:8545",
    shardManagerModule: "../../../atomic-blockchain/scripts/shardMetadataManager",
    transactionModule: "../../../atomic-blockchain/core/transaction"
};

/**
 * Log an action to the blockchain with token validation.
 * @param {Object} actionDetails - Details of the action to log (e.g., action type, satellite ID, status).
 * @param {Object} tokenDetails - Proof-of-Access token details including tokenId and encryptedToken.
 * @returns {Promise<boolean>} - True if the log is successful.
 */
async function logActionToBlockchain(actionDetails, tokenDetails) {
    logger.info("Logging action to blockchain with token validation...", actionDetails);

    try {
        // Validate the token
        const isValidToken = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!isValidToken) {
            logger.error("Token validation failed. Action not logged to blockchain.");
            return false;
        }

        // Log the action to the blockchain
        const result = await logToBlockchain(actionDetails, BLOCKCHAIN_CONFIG.nodeUrl);
        logger.info("Action logged to blockchain successfully.", { result });
        return true;
    } catch (error) {
        logger.error("Failed to log action to blockchain.", { error: error.message });
        return false;
    }
}

/**
 * Fetch the current state of the blockchain.
 * @returns {Promise<Object>} - The current blockchain state.
 */
async function fetchBlockchainStateData() {
    logger.info("Fetching blockchain state...");

    try {
        const state = await fetchBlockchainState(BLOCKCHAIN_CONFIG.nodeUrl);
        logger.info("Blockchain state fetched successfully.", { state });
        return state;
    } catch (error) {
        logger.error("Failed to fetch blockchain state.", { error: error.message });
        throw error;
    }
}

/**
 * Submit a satellite communication transaction to the blockchain with token validation.
 * @param {Object} transactionDetails - Details of the communication transaction (e.g., message, satellite ID).
 * @param {Object} tokenDetails - Proof-of-Access token details including tokenId and encryptedToken.
 * @returns {Promise<boolean>} - True if the transaction is submitted successfully.
 */
async function submitCommunicationTransaction(transactionDetails, tokenDetails) {
    logger.info("Submitting communication transaction to blockchain...", transactionDetails);

    try {
        // Validate the token
        const isValidToken = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!isValidToken) {
            logger.error("Token validation failed. Transaction not submitted.");
            return false;
        }

        // Create a transaction object
        const transaction = new Transaction(
            [],
            [{ address: BLOCKCHAIN_CONFIG.nodeUrl, amount: 0 }],
            { shardID: "satellite-communications", frequency: 500 },
            { tokenId: tokenDetails.tokenId, encryptedToken: tokenDetails.encryptedToken }
        );

        // Sign the transaction
        transaction.sign(tokenDetails.keyPair);

        // Validate the transaction
        if (!(await transaction.validate())) {
            logger.error("Transaction validation failed.");
            return false;
        }

        logger.info("Transaction submitted successfully.");
        return true;
    } catch (error) {
        logger.error("Failed to submit communication transaction.", { error: error.message });
        return false;
    }
}

module.exports = {
    logActionToBlockchain,
    fetchBlockchainStateData,
    submitCommunicationTransaction
};
