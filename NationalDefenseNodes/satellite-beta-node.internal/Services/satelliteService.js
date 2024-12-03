"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Beta Node - Satellite Service with Token PoA Integration
// ------------------------------------------------------------------------------

// Dependencies
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const winston = require("winston");
const { validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");
const { encryptWithQuantum, decryptWithQuantum } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { logActionToBlockchain, submitCommunicationTransaction } = require("./blockchainIntegration");

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

// Configuration Paths
const CONFIG_PATH = path.resolve(__dirname, "../Config/satelliteConfig.json");
const LOG_PATH = path.resolve(__dirname, "../Logs/satelliteCommLogs.json");

// Load configuration
let satelliteConfig;
(async () => {
    try {
        satelliteConfig = await fs.readJson(CONFIG_PATH);
        logger.info("Satellite configuration loaded successfully.");
    } catch (error) {
        logger.error("Failed to load satellite configuration.", { error: error.message });
        process.exit(1);
    }
})();

/**
 * Establish a connection to the satellite endpoint with token validation.
 * @param {string} satelliteId - The ID of the satellite to connect to.
 * @param {Object} tokenDetails - The token ID and encrypted token for Proof-of-Access.
 * @returns {Promise<boolean>} - True if the connection succeeds.
 */
async function establishConnection(satelliteId, tokenDetails) {
    logger.info(`Establishing connection to satellite: ${satelliteId}`);

    try {
        // Validate token authenticity for PoA
        const isValidToken = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!isValidToken) {
            logger.error("Token validation failed. Connection aborted.");
            return false;
        }

        // Locate satellite configuration
        const satellite = satelliteConfig.satellites.find((s) => s.id === satelliteId);
        if (!satellite) throw new Error(`Satellite ID ${satelliteId} not found in configuration.`);

        // Simulate connection attempt (extend as needed)
        const response = await axios.get(`${satellite.endpoint}/connect`);
        if (response.status === 200) {
            logger.info(`Successfully connected to satellite: ${satelliteId}`);
            return true;
        }
    } catch (error) {
        logger.error(`Failed to connect to satellite: ${satelliteId}`, { error: error.message });
        return false;
    }
}

/**
 * Send a message to a satellite with token validation and blockchain logging.
 * @param {string} satelliteId - The target satellite ID.
 * @param {string} message - The message payload.
 * @param {Object} tokenDetails - The token ID and encrypted token for Proof-of-Access.
 * @returns {Promise<boolean>} - True if the message is sent successfully.
 */
async function sendMessage(satelliteId, message, tokenDetails) {
    logger.info(`Sending message to satellite: ${satelliteId}`);

    try {
        // Validate the token for PoA
        const isValidToken = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!isValidToken) {
            logger.error("Token validation failed. Aborting message send.");
            return false;
        }

        // Encrypt the message
        const encryptionKey = Buffer.from(satelliteConfig.security.handshakeKey, "utf-8");
        const encryptedMessage = encryptWithQuantum(Buffer.from(message, "utf-8"), encryptionKey);

        // Send message
        const satellite = satelliteConfig.satellites.find((s) => s.id === satelliteId);
        if (!satellite) throw new Error(`Satellite ID ${satelliteId} not found in configuration.`);

        const response = await axios.post(`${satellite.endpoint}/send`, { encryptedPayload: encryptedMessage });
        if (response.status === 200) {
            logger.info("Message sent successfully.");

            // Log communication and submit to blockchain
            await logCommunication("uplink", satelliteId, message);
            await submitCommunicationTransaction({ tokenId: tokenDetails.tokenId, encryptedToken: tokenDetails.encryptedToken });

            return true;
        }
    } catch (error) {
        logger.error(`Failed to send message to satellite: ${satelliteId}`, { error: error.message });
        return false;
    }
}

/**
 * Receive a message from a satellite with token validation.
 * @param {string} satelliteId - The satellite ID.
 * @param {Object} tokenDetails - The token ID and encrypted token for Proof-of-Access.
 * @returns {Promise<string>} - The decrypted message payload.
 */
async function receiveMessage(satelliteId, tokenDetails) {
    logger.info(`Receiving message from satellite: ${satelliteId}`);

    try {
        // Validate token for PoA
        const isValidToken = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!isValidToken) {
            logger.error("Token validation failed. Aborting message receive.");
            return null;
        }

        const satellite = satelliteConfig.satellites.find((s) => s.id === satelliteId);
        if (!satellite) throw new Error(`Satellite ID ${satelliteId} not found in configuration.`);

        const response = await axios.get(`${satellite.endpoint}/receive`);
        if (response.status === 200) {
            const encryptionKey = Buffer.from(satelliteConfig.security.handshakeKey, "utf-8");
            const decryptedMessage = decryptWithQuantum(response.data.encryptedPayload, encryptionKey);

            logger.info("Message received successfully.");
            await logCommunication("downlink", satelliteId, decryptedMessage);

            return decryptedMessage;
        }
    } catch (error) {
        logger.error(`Failed to receive message from satellite: ${satelliteId}`, { error: error.message });
        return null;
    }
}

/**
 * Log communication to the local log file.
 * @param {string} direction - Either "uplink" or "downlink".
 * @param {string} satelliteId - The satellite ID.
 * @param {string} message - The message content.
 */
async function logCommunication(direction, satelliteId, message) {
    try {
        const logs = (await fs.readJson(LOG_PATH, { throws: false })) || [];
        logs.push({ timestamp: new Date().toISOString(), direction, satelliteId, message });
        await fs.writeJson(LOG_PATH, logs, { spaces: 2 });
        logger.info("Communication logged successfully.");
    } catch (error) {
        logger.error("Failed to log communication.", { error: error.message });
    }
}

module.exports = { establishConnection, sendMessage, receiveMessage };
