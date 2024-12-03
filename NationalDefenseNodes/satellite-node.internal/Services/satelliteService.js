"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Node Service
// ------------------------------------------------------------------------------

// Dependencies
const fs = require("fs-extra");
const path = require("path");
const { encryptMessage, decryptMessage } = require("../Utilities/encryptionUtils");
const { logToBlockchain } = require("../../../atomic-blockchain/core/blockchainLogger");
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

// Configuration Path
const CONFIG_PATH = path.resolve(__dirname, "../Config/satelliteConfig.json");

/**
 * Initialize the Satellite Node Service.
 * @returns {Promise<void>}
 */
async function initializeSatelliteService() {
    logger.info("Initializing Satellite Node Service...");

    try {
        const config = await fs.readJson(CONFIG_PATH);
        logger.info("Satellite configuration loaded successfully.", { config });

        // Establish secure communication
        const handshakeKey = Buffer.from(config.communication.handshakeKey, "utf-8");
        logger.info("Secure handshake key initialized for satellite communication.");

        // Additional node-specific initialization
        logger.info("Satellite Node Service is ready.");
    } catch (error) {
        logger.error("Failed to initialize Satellite Node Service.", { error: error.message });
        throw error;
    }
}

/**
 * Transmit a secure message to another node or satellite.
 * @param {string} satelliteId - The ID of the satellite to transmit to.
 * @param {string} message - The message payload.
 * @returns {Promise<boolean>}
 */
async function transmitMessage(satelliteId, message) {
    logger.info(`Transmitting message to satellite: ${satelliteId}`);
    try {
        const encryptedMessage = encryptMessage(message, "secure-encryption-key");

        // Simulate transmission and blockchain logging
        await logToBlockchain({
            action: "transmit",
            satelliteId,
            encryptedMessage,
        });

        logger.info(`Message transmitted successfully to satellite: ${satelliteId}`);
        return true;
    } catch (error) {
        logger.error("Message transmission failed.", { error: error.message });
        return false;
    }
}

/**
 * Receive and decrypt a secure message from another node or satellite.
 * @param {string} encryptedPayload - The encrypted message payload.
 * @returns {Promise<string>}
 */
async function receiveMessage(encryptedPayload) {
    logger.info("Receiving encrypted message...");
    try {
        const decryptedMessage = decryptMessage(encryptedPayload, "secure-encryption-key");
        logger.info("Message decrypted successfully.");
        return decryptedMessage;
    } catch (error) {
        logger.error("Message decryption failed.", { error: error.message });
        throw error;
    }
}

module.exports = {
    initializeSatelliteService,
    transmitMessage,
    receiveMessage,
};
