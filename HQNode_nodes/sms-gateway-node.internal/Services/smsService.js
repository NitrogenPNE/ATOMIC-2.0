"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC SMS Gateway Node - Service with Token ID Integration
// ------------------------------------------------------------------------------

const axios = require("axios");
const winston = require("winston");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { encryptWithQuantum, decryptWithQuantum } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { validateToken } = require("../../../Pricing/TokenManagement/tokenValidation");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "../Logs/smsService.log" })
    ]
});

// Key storage paths
const KEYS_PATH = path.join(__dirname, "../Config/keys");
const TOKEN_KEY_FILE = path.join(KEYS_PATH, "tokenKeys.json");

/**
 * Ensure the keys directory exists.
 */
function ensureKeysDirectory() {
    if (!fs.existsSync(KEYS_PATH)) {
        fs.mkdirSync(KEYS_PATH, { recursive: true });
        logger.info(`Created keys directory at: ${KEYS_PATH}`);
    }
}

/**
 * Generate or retrieve encryption keys associated with token IDs.
 * @param {string} tokenId - The token ID to associate with the key.
 * @returns {string} - Base64-encoded encryption key.
 */
function getOrCreateTokenKey(tokenId) {
    ensureKeysDirectory();

    let tokenKeys = {};
    if (fs.existsSync(TOKEN_KEY_FILE)) {
        tokenKeys = JSON.parse(fs.readFileSync(TOKEN_KEY_FILE, "utf8"));
    }

    if (tokenKeys[tokenId]) {
        return tokenKeys[tokenId];
    }

    const newKey = crypto.randomBytes(32).toString("base64");
    tokenKeys[tokenId] = newKey;
    fs.writeFileSync(TOKEN_KEY_FILE, JSON.stringify(tokenKeys, null, 2));
    logger.info(`Generated and stored a new encryption key for token ID: ${tokenId}`);
    return newKey;
}

// Configuration
const SMS_GATEWAY_CONFIG = {
    gatewayURL: process.env.SMS_GATEWAY_URL || "https://internal-sms-gateway.atomic/send",
    retryPolicy: {
        maxRetries: 3,
        retryIntervalMs: 5000
    }
};

/**
 * Send a secure SMS message using quantum-resistant encryption and token ID.
 * @param {string} recipientTokenId - The recipient's token ID.
 * @param {string} message - The SMS message content.
 * @param {string} senderTokenId - The sender's token ID for validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @returns {Promise<Object>} - The result of the SMS send operation.
 */
async function sendSecureSMS(recipientTokenId, message, senderTokenId, encryptedToken) {
    logger.info(`Attempting to send secure SMS to token ID: ${recipientTokenId}`);

    // Validate the Proof-of-Access token
    const tokenValidation = await validateToken(senderTokenId, encryptedToken);
    if (!tokenValidation.valid) {
        logger.error("Token validation failed. SMS not sent.");
        return { success: false, error: "Invalid Proof-of-Access token." };
    }

    // Retrieve or generate the encryption key for the recipient token ID
    const encryptionKey = Buffer.from(getOrCreateTokenKey(recipientTokenId), "base64");

    // Encrypt the message payload using quantum-safe encryption
    const encryptedMessage = encryptWithQuantum(Buffer.from(JSON.stringify({ recipientTokenId, message }), "utf-8"), encryptionKey);

    // Attempt to send the SMS
    for (let attempt = 1; attempt <= SMS_GATEWAY_CONFIG.retryPolicy.maxRetries; attempt++) {
        try {
            const response = await axios.post(SMS_GATEWAY_CONFIG.gatewayURL, {
                encryptedPayload: encryptedMessage,
                recipientTokenId,
                senderTokenId
            });

            if (response.status === 200) {
                logger.info("SMS sent successfully.");
                return { success: true, data: response.data };
            }
        } catch (error) {
            logger.warn(`Attempt ${attempt} failed:`, error.message);
            if (attempt === SMS_GATEWAY_CONFIG.retryPolicy.maxRetries) {
                logger.error("Failed to send SMS after maximum retries.");
                return { success: false, error: "Failed to send SMS after retries." };
            }
            await new Promise((resolve) => setTimeout(resolve, SMS_GATEWAY_CONFIG.retryPolicy.retryIntervalMs));
        }
    }
}

module.exports = { sendSecureSMS };
