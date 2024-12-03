"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Alpha Node - Main Entry Point
// ------------------------------------------------------------------------------

// Dependencies
const path = require("path");
const winston = require("winston");

// Services and Utilities
const { establishConnection, sendMessage, receiveMessage } = require("./Services/satelliteService");
const { logActionToBlockchain, fetchBlockchainStateData, submitCommunicationTransaction } = require("./Services/blockchainIntegration");
const { initializeCryptoUtils } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, "Logs", "satelliteNode.log") })
    ]
});

// Configuration Path
const CONFIG_PATH = path.join(__dirname, "Config", "satelliteConfig.json");

// Node Initialization
async function initializeNode() {
    logger.info("Initializing Satellite Alpha Node...");

    try {
        // Load Configuration
        const config = require(CONFIG_PATH);
        logger.info("Configuration loaded successfully.", { config });

        // Initialize Cryptographic Utilities
        await initializeCryptoUtils();
        logger.info("Quantum-resistant cryptographic utilities initialized.");

        // Establish Connection with Satellites
        for (const satellite of config.satellites) {
            const connectionSuccess = await establishConnection(satellite, "token-id-placeholder", "encrypted-token-placeholder");
            if (connectionSuccess) {
                logger.info(`Connection established with satellite: ${satellite.name}`);
            } else {
                logger.warn(`Failed to establish connection with satellite: ${satellite.name}`);
            }
        }

        // Fetch Blockchain State
        const blockchainState = await fetchBlockchainStateData();
        logger.info("Blockchain state fetched successfully.", { blockchainState });

        // Submit Test Transaction to Blockchain
        const transactionDetails = {
            tokenId: "test-token-id",
            encryptedToken: "test-encrypted-token",
            keyPair: {
                privateKey: "private-key-placeholder",
                publicKey: "public-key-placeholder"
            }
        };

        const transactionSuccess = await submitCommunicationTransaction(transactionDetails);
        if (transactionSuccess) {
            logger.info("Test transaction submitted successfully to the blockchain.");
        } else {
            logger.error("Test transaction submission failed.");
        }

        logger.info("Satellite Alpha Node initialized successfully.");
    } catch (error) {
        logger.error("Failed to initialize Satellite Alpha Node.", { error: error.message });
        process.exit(1);
    }
}

// Start the Node
initializeNode().catch((error) => {
    logger.error("Unexpected error during initialization.", { error: error.message });
    process.exit(1);
});