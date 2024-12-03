"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Node Blockchain Integration with Token and PoW Validation
// ------------------------------------------------------------------------------

// Dependencies
const { logToBlockchain, fetchBlockchainState } = require("../../../atomic-blockchain/core/blockchainLogger");
const { validateToken } = require("../../../Pricing/TokenManagement/tokenValidation");
const { validateBlock } = require("../../../atomic-blockchain/Utilities/validationUtils");
const crypto = require("crypto");
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
    shardManager: "../../../atomic-blockchain/scripts/shardMetadataManager",
    transactionModule: "../../../atomic-blockchain/core/transaction",
    encryptionKey: process.env.BLOCKCHAIN_ENCRYPTION_KEY || "default-satellite-encryption-key",
    difficulty: 4 // Proof-of-Work difficulty level
};

/**
 * Validate Proof-of-Work (PoW) for a block.
 * @param {Object} block - The block to validate.
 * @returns {boolean} - True if PoW is valid, false otherwise.
 */
function isValidProofOfWork(block) {
    const hash = crypto.createHash("sha256").update(`${block.index}${block.previousHash}${block.timestamp}`).digest("hex");
    const leadingZeros = "0".repeat(BLOCKCHAIN_CONFIG.difficulty);
    return hash.startsWith(leadingZeros);
}

/**
 * Log an action to the blockchain with token validation.
 * @param {Object} actionDetails - Details of the action to log (e.g., action type, satellite ID, status).
 * @param {Object} tokenDetails - Token details for authenticity validation.
 * @returns {Promise<boolean>} - True if the log is successful.
 */
async function logActionToBlockchain(actionDetails, tokenDetails) {
    logger.info("Logging action to blockchain...", actionDetails);

    try {
        // Step 1: Validate Token
        const tokenValidation = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!tokenValidation.valid) {
            logger.error("Token validation failed. Action not logged.");
            return false;
        }

        // Step 2: Log Action to Blockchain
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
 * @param {Object} tokenDetails - Token details for authenticity validation.
 * @returns {Promise<Object>} - The current blockchain state.
 */
async function fetchBlockchainStateData(tokenDetails) {
    logger.info("Fetching blockchain state...");

    try {
        // Step 1: Validate Token
        const tokenValidation = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error("Invalid token for blockchain state fetch.");
        }

        // Step 2: Fetch Blockchain State
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
 * @param {Object} transactionDetails - Details of the communication transaction (e.g., message, satellite ID).
 * @param {Object} tokenDetails - Token details for authenticity validation.
 * @returns {Promise<boolean>} - True if the transaction is submitted successfully.
 */
async function submitCommunicationTransaction(transactionDetails, tokenDetails) {
    logger.info("Submitting communication transaction to blockchain...", transactionDetails);

    try {
        // Step 1: Validate Token
        const tokenValidation = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!tokenValidation.valid) {
            logger.error("Token validation failed. Transaction not submitted.");
            return false;
        }

        // Step 2: Construct Transaction
        const { Transaction } = require(BLOCKCHAIN_CONFIG.transactionModule);
        const transaction = new Transaction(
            [],
            [{ address: BLOCKCHAIN_CONFIG.nodeUrl, amount: 0 }],
            { shardID: "satellite-communications", frequency: 500 },
            { tokenId: tokenDetails.tokenId, encryptedToken: tokenDetails.encryptedToken }
        );

        transaction.sign(tokenValidation.keyPair);

        // Step 3: Validate Transaction and PoW
        if (!(await transaction.validate()) || !isValidProofOfWork(transaction)) {
            logger.error("Transaction validation or PoW failed.");
            return false;
        }

        // Step 4: Submit Transaction
        const result = await logToBlockchain(transaction, BLOCKCHAIN_CONFIG.nodeUrl);
        logger.info("Transaction submitted successfully.", { result });
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