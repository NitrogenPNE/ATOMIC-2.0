"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Satellite Gamma Node Validation Utilities
// ------------------------------------------------------------------------------

// Dependencies
const { validateTransaction, validateBlock, validateShard, validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");
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
        new winston.transports.File({ filename: "../Logs/validationUtils.log" })
    ]
});

/**
 * Validate a satellite-specific communication payload.
 * @param {Object} payload - The communication payload.
 * @param {string} tokenId - The token ID for validation.
 * @param {string} encryptedToken - The encrypted token for validation.
 * @returns {Promise<boolean>} - Whether the payload is valid.
 */
async function validateSatellitePayload(payload, tokenId, encryptedToken) {
    logger.info("Validating satellite payload...", { payload });

    try {
        // Validate the token associated with the payload
        const isTokenValid = await validateToken({ tokenId, encryptedToken });
        if (!isTokenValid) {
            logger.error("Token validation failed for satellite payload.", { tokenId });
            return false;
        }

        // Validate the payload schema (example: shard-level or atomic metadata)
        if (!payload.metadata || !payload.data) {
            logger.error("Invalid payload structure: Missing metadata or data.", { payload });
            return false;
        }

        logger.info("Satellite payload validated successfully.");
        return true;
    } catch (error) {
        logger.error("Failed to validate satellite payload.", { error: error.message });
        return false;
    }
}

/**
 * Verify a shard received by the satellite node.
 * @param {Object} shard - The shard object containing metadata and data hash.
 * @returns {boolean} - Whether the shard is valid.
 */
function verifySatelliteShard(shard) {
    logger.info("Verifying satellite shard...", { shard });

    if (!validateShard(shard)) {
        logger.error("Shard validation failed for satellite node.", { shardId: shard.id });
        return false;
    }

    logger.info("Satellite shard validated successfully.");
    return true;
}

/**
 * Validate a blockchain transaction specific to the satellite node.
 * @param {Object} transaction - The transaction object to validate.
 * @returns {boolean} - Whether the transaction is valid.
 */
function validateSatelliteTransaction(transaction) {
    logger.info("Validating satellite blockchain transaction...", { transactionId: transaction.id });

    if (!validateTransaction(transaction)) {
        logger.error("Transaction validation failed for satellite node.", { transactionId: transaction.id });
        return false;
    }

    logger.info("Satellite transaction validated successfully.");
    return true;
}

/**
 * Generate a secure hash for satellite communications.
 * @param {string} data - The data to hash.
 * @returns {string} - The resulting secure hash.
 */
function generateSatelliteHash(data) {
    logger.info("Generating secure hash for satellite data.");
    return crypto.createHash("sha256").update(data).digest("hex");
}

module.exports = {
    validateSatellitePayload,
    verifySatelliteShard,
    validateSatelliteTransaction,
    generateSatelliteHash
};