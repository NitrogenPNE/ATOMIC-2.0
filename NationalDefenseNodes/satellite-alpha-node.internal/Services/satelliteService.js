"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Alpha Node Service
// ------------------------------------------------------------------------------

// Dependencies
const { validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");
const { encryptWithQuantum, decryptWithQuantum } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
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
        new winston.transports.File({ filename: "../Logs/satelliteService.log" })
    ]
});

// Satellite Communication Configuration
const SATELLITE_SERVICE_CONFIG = {
    encryptionKey: process.env.ENCRYPTION_KEY || "replace-with-secure-base64-key",
    handshakeKey: process.env.HANDSHAKE_KEY || "secure-handshake-key",
    protocol: "TCP",
    defaultPort: 8080,
    retries: 3,
    timeoutMs: 10000
};

/**
 * Establishes a secure connection with a satellite.
 * @param {Object} satelliteConfig - Satellite configuration details.
 * @param {string} tokenId - Token ID for Proof of Access (PoA).
 * @param {string} encryptedToken - Encrypted token for validation.
 * @returns {Promise<boolean>} - True if connection is successful, otherwise false.
 */
async function establishConnection(satelliteConfig, tokenId, encryptedToken) {
    logger.info("Establishing connection with satellite...", { satelliteId: satelliteConfig.id });

    try {
        // Validate the token for Proof of Access (PoA)
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            logger.error("Token validation failed. Connection aborted.", { satelliteId: satelliteConfig.id });
            return false;
        }

        logger.info("Token validation successful. Proceeding with connection...");

        // Simulate secure handshake
        const handshake = encryptWithQuantum(SATELLITE_SERVICE_CONFIG.handshakeKey, Buffer.from(SATELLITE_SERVICE_CONFIG.encryptionKey, "base64"));
        logger.info("Secure handshake initiated.", { satelliteId: satelliteConfig.id });

        // Simulate connection establishment
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate connection delay

        logger.info("Connection established with satellite.", { satelliteId: satelliteConfig.id });
        return true;
    } catch (error) {
        logger.error("Failed to establish connection with satellite.", { satelliteId: satelliteConfig.id, error: error.message });
        return false;
    }
}

/**
 * Sends a secure message to the satellite.
 * @param {Object} satelliteConfig - Satellite configuration details.
 * @param {string} message - The message payload.
 * @param {string} tokenId - Token ID for Proof of Access (PoA).
 * @param {string} encryptedToken - Encrypted token for validation.
 * @returns {Promise<boolean>} - True if the message is sent successfully.
 */
async function sendMessage(satelliteConfig, message, tokenId, encryptedToken) {
    logger.info("Sending message to satellite...", { satelliteId: satelliteConfig.id });

    try {
        // Validate token for PoA
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            logger.error("Token validation failed. Message not sent.", { satelliteId: satelliteConfig.id });
            return false;
        }

        // Encrypt the message payload
        const encryptionKey = Buffer.from(SATELLITE_SERVICE_CONFIG.encryptionKey, "base64");
        const encryptedMessage = encryptWithQuantum(message, encryptionKey);

        // Simulate sending message
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate send delay

        logger.info("Message sent to satellite successfully.", { satelliteId: satelliteConfig.id });
        return true;
    } catch (error) {
        logger.error("Failed to send message to satellite.", { satelliteId: satelliteConfig.id, error: error.message });
        return false;
    }
}

/**
 * Receives a secure message from the satellite.
 * @param {Object} satelliteConfig - Satellite configuration details.
 * @param {string} tokenId - Token ID for Proof of Access (PoA).
 * @param {string} encryptedToken - Encrypted token for validation.
 * @returns {Promise<string>} - The decrypted message received.
 */
async function receiveMessage(satelliteConfig, tokenId, encryptedToken) {
    logger.info("Receiving message from satellite...", { satelliteId: satelliteConfig.id });

    try {
        // Validate token for PoA
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            logger.error("Token validation failed. Message reception aborted.", { satelliteId: satelliteConfig.id });
            return null;
        }

        // Simulate receiving encrypted message
        const encryptedMessage = await new Promise((resolve) => setTimeout(() => resolve("encrypted-message-sample"), 1000));

        // Decrypt the received message
        const decryptionKey = Buffer.from(SATELLITE_SERVICE_CONFIG.encryptionKey, "base64");
        const decryptedMessage = decryptWithQuantum({ encryptedData: encryptedMessage, iv: "iv-sample" }, decryptionKey);

        logger.info("Message received from satellite successfully.", { satelliteId: satelliteConfig.id });
        return decryptedMessage;
    } catch (error) {
        logger.error("Failed to receive message from satellite.", { satelliteId: satelliteConfig.id, error: error.message });
        return null;
    }
}

module.exports = {
    establishConnection,
    sendMessage,
    receiveMessage
};
