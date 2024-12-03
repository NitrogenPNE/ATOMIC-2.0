"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Alpha Node Blockchain Integration
// ------------------------------------------------------------------------------

// Dependencies
const { logToBlockchain, fetchBlockchainState } = require("../../../atomic-blockchain/core/blockchainLogger");
const { Transaction } = require("../../../atomic-blockchain/core/transaction");
const { validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");
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

// Blockchain Configuration
const BLOCKCHAIN_CONFIG = {
    nodeUrl: process.env.BLOCKCHAIN_NODE_URL || "http://localhost:8545",
    shardManagerModule: "../../../atomic-blockchain/core/shardManager",
    transactionModule: "../../../atomic-blockchain/core/transaction"
};

/**
 * Log an action to the blockchain.
 * @param {Object} actionDetails - Details of the action to log (e.g., satellite ID, status).
 * @returns {Promise<boolean>} - True if the log is successful, otherwise false.
 */
async function logActionToBlockchain(actionDetails) {
    logger.info("Logging action to blockchain...", actionDetails);

    try {
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
 * Submit a satellite communication transaction to the blockchain.
 * @param {Object} transactionDetails - Details of the communication transaction (e.g., message, satellite ID, token).
 * @returns {Promise<boolean>} - True if the transaction is submitted successfully, otherwise false.
 */
async function submitCommunicationTransaction(transactionDetails) {
    logger.info("Submitting communication transaction to blockchain...", transactionDetails);

    try {
        // Validate Token for PoA
        const isTokenValid = await validateToken(transactionDetails.tokenId, transactionDetails.encryptedToken);
        if (!isTokenValid) {
            logger.error("Token validation failed. Transaction aborted.", { tokenId: transactionDetails.tokenId });
            return false;
        }

        logger.info("Token validation successful. Proceeding with transaction submission...");

        // Create and sign the transaction
        const transaction = new Transaction(
            [], // Inputs
            [{ address: BLOCKCHAIN_CONFIG.nodeUrl, amount: 0 }], // Outputs
            { shardID: "satellite-alpha-communications", frequency: 500 }, // Shard Metadata
            { tokenId: transactionDetails.tokenId, encryptedToken: transactionDetails.encryptedToken } // Token Metadata
        );

        transaction.sign(transactionDetails.keyPair);

        // Validate the transaction
        if (!(await transaction.validate())) {
            logger.error("Transaction validation failed.");
            return false;
        }

        // Log the transaction to the blockchain
        const result = await logToBlockchain(transaction.toJSON(), BLOCKCHAIN_CONFIG.nodeUrl);
        if (result) {
            logger.info("Transaction submitted and logged successfully.");
            return true;
        } else {
            logger.error("Failed to log transaction to blockchain.");
            return false;
        }
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
