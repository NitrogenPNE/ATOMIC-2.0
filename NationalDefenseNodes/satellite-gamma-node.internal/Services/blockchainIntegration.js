"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Blockchain Integration Service with Token Authenticity and Proof of Work
 * -------------------------------------------------------------------------------
 */

const axios = require("axios");
const { encryptWithQuantum, decryptWithQuantum } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { validateBlock, validateTransaction } = require("../../../atomic-blockchain/Utilities/validationUtils");
const { validateToken } = require("../../../Pricing/TokenManagement/tokenValidation");
const winston = require("winston");
const crypto = require("crypto");

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
    encryptionKey: process.env.BLOCKCHAIN_ENCRYPTION_KEY || "default-gamma-encryption-key",
    difficulty: 4, // Proof-of-Work difficulty level
    timeoutMs: 10000
};

/**
 * Validate and submit a block to the blockchain with token authenticity and PoW.
 * @param {Object} block - The block to submit.
 * @param {Object} tokenDetails - Token details including tokenId and encryptedToken.
 * @returns {Promise<Object>} - Result of the block submission.
 */
async function submitBlock(block, tokenDetails) {
    logger.info("Submitting block to blockchain...", { blockId: block.id });

    try {
        // Step 1: Validate Token
        const tokenValidation = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!tokenValidation.valid) {
            logger.error("Token validation failed. Submission aborted.", { blockId: block.id });
            return { success: false, error: "Invalid token." };
        }

        // Step 2: Validate Block
        if (!validateBlock(block)) {
            logger.error("Block validation failed. Submission aborted.", { blockId: block.id });
            return { success: false, error: "Invalid block." };
        }

        // Step 3: Validate Proof-of-Work
        if (!isValidProofOfWork(block)) {
            logger.error("Block PoW validation failed. Submission aborted.", { blockId: block.id });
            return { success: false, error: "Invalid PoW." };
        }

        // Step 4: Encrypt Block
        const encryptedBlock = encryptWithQuantum(
            JSON.stringify(block),
            Buffer.from(BLOCKCHAIN_CONFIG.encryptionKey, "utf-8")
        );

        // Step 5: Submit to Blockchain
        const response = await axios.post(
            `${BLOCKCHAIN_CONFIG.nodeUrl}/submitBlock`,
            { encryptedBlock, tokenId: tokenDetails.tokenId },
            { timeout: BLOCKCHAIN_CONFIG.timeoutMs }
        );

        logger.info("Block submitted successfully.", { response: response.data });
        return { success: true, data: response.data };
    } catch (error) {
        logger.error("Failed to submit block.", { error: error.message });
        return { success: false, error: error.message };
    }
}

/**
 * Fetch and decrypt the latest transactions with token validation.
 * @param {Object} tokenDetails - Token details for authorization.
 * @returns {Promise<Array>} - Array of transactions.
 */
async function fetchTransactions(tokenDetails) {
    logger.info("Fetching latest transactions from blockchain...");

    try {
        // Step 1: Validate Token
        const tokenValidation = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error("Invalid token for transaction fetch.");
        }

        // Step 2: Fetch Encrypted Transactions
        const response = await axios.get(`${BLOCKCHAIN_CONFIG.nodeUrl}/transactions`, {
            headers: { "x-token-id": tokenDetails.tokenId },
            timeout: BLOCKCHAIN_CONFIG.timeoutMs
        });

        const encryptedTransactions = response.data;

        // Step 3: Decrypt Transactions
        const transactions = encryptedTransactions.map(tx =>
            JSON.parse(decryptWithQuantum(tx, Buffer.from(BLOCKCHAIN_CONFIG.encryptionKey, "utf-8")))
        );

        logger.info("Transactions fetched and decrypted successfully.");
        return transactions;
    } catch (error) {
        logger.error("Failed to fetch transactions.", { error: error.message });
        throw new Error("Transaction fetch failed.");
    }
}

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
 * Process and validate incoming transactions with token validation.
 * @param {Array} transactions - Array of transactions to process.
 * @param {Object} tokenDetails - Token details for authorization.
 */
async function processTransactions(transactions, tokenDetails) {
    logger.info("Processing transactions...");

    // Validate Token
    const tokenValidation = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
    if (!tokenValidation.valid) {
        logger.error("Token validation failed. Transaction processing aborted.");
        return;
    }

    transactions.forEach(transaction => {
        if (validateTransaction(transaction)) {
            logger.info("Transaction validated successfully.", { transactionId: transaction.id });
        } else {
            logger.warn("Transaction validation failed.", { transactionId: transaction.id });
        }
    });

    logger.info("Transaction processing completed.");
}

module.exports = {
    submitBlock,
    fetchTransactions,
    processTransactions
};
