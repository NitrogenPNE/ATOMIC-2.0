"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Utility Functions for Token-Based Communication Node
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const winston = require("winston");
const { validateToken } = require("../../atomic-blockchain/core/tokenValidation");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "../Logs/token-communication-utils.log" }),
    ],
});

// Configuration
const ENCRYPTION_CONFIG = {
    algorithm: "aes-256-gcm",
    keyLength: 32, // 256-bit key
    ivLength: 16,  // Initialization Vector (IV)
};

/**
 * Generate a cryptographic key.
 * @returns {Buffer} - A securely generated random key.
 */
function generateKey() {
    return crypto.randomBytes(ENCRYPTION_CONFIG.keyLength);
}

/**
 * Encrypt a payload securely using AES-256-GCM.
 * @param {Object} payload - The JSON payload to encrypt.
 * @param {Buffer} encryptionKey - The encryption key.
 * @returns {Object} - The encrypted payload with metadata.
 */
function encryptPayload(payload, encryptionKey) {
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, encryptionKey, iv);

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
        encryptedData: encrypted.toString("hex"),
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
    };
}

/**
 * Decrypt an encrypted payload securely using AES-256-GCM.
 * @param {Object} encryptedPayload - The encrypted payload with metadata.
 * @param {Buffer} decryptionKey - The decryption key.
 * @returns {Object} - The decrypted payload.
 */
function decryptPayload(encryptedPayload, decryptionKey) {
    const { encryptedData, iv, authTag } = encryptedPayload;

    const decipher = crypto.createDecipheriv(
        ENCRYPTION_CONFIG.algorithm,
        decryptionKey,
        Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData, "hex")),
        decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Generate a secure hash for verification purposes.
 * @param {string} data - The data to hash.
 * @param {string} algorithm - The hashing algorithm (default: sha3-256).
 * @returns {string} - The resulting hash in hexadecimal format.
 */
function generateHash(data, algorithm = "sha3-256") {
    return crypto.createHash(algorithm).update(data).digest("hex");
}

/**
 * Log a critical event for compliance and auditing.
 * @param {string} event - Description of the critical event.
 * @param {Object} details - Additional details about the event.
 */
function logCriticalEvent(event, details = {}) {
    logger.error("Critical Event Logged:", { event, details });
}

/**
 * Log a standard operational event.
 * @param {string} event - Description of the operational event.
 * @param {Object} details - Additional details about the event.
 */
function logEvent(event, details = {}) {
    logger.info("Event Logged:", { event, details });
}

/**
 * Validate a recipient's token ID.
 * @param {string} tokenId - The token ID to validate.
 * @returns {Promise<boolean>} - True if valid, false otherwise.
 */
async function validateTokenId(tokenId) {
    try {
        const validation = await validateToken(tokenId);
        if (!validation.valid) {
            logger.warn(`Token validation failed: ${tokenId}`);
            return false;
        }
        logger.info(`Token validated successfully: ${tokenId}`);
        return true;
    } catch (error) {
        logger.error(`Error validating token: ${tokenId}`, error);
        return false;
    }
}

module.exports = {
    generateKey,
    encryptPayload,
    decryptPayload,
    generateHash,
    logCriticalEvent,
    logEvent,
    validateTokenId,
};