"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Gamma Node Main Entry Point
// ------------------------------------------------------------------------------

// Dependencies
const path = require("path");
const winston = require("winston");

// Services and Utilities
const { initializeSatelliteService } = require("./Services/satelliteService");
const { submitCommunicationTransaction, fetchBlockchainStateData } = require("./Services/blockchainIntegration");
const encryptionUtils = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const validationUtils = require("../../../atomic-blockchain/Utilities/validationUtils");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, "Logs", "satelliteGammaNode.log") })
    ]
});

// Configuration Paths
const CONFIG_PATH = path.join(__dirname, "Config", "satelliteConfig.json");

// Main Initialization
async function initializeNode() {
    logger.info("Initializing Satellite Gamma Node...");

    try {
        // Load Configuration
        const config = require(CONFIG_PATH);
        logger.info("Configuration loaded successfully.", { config });

        // Initialize Utilities
        await encryptionUtils.initializeCryptoUtils();
        logger.info("Encryption utilities initialized.");

        // Initialize Satellite Service
        await initializeSatelliteService(config, logger);
        logger.info("Satellite Gamma Node service started successfully.");

        // Blockchain State Fetch (Optional Monitoring Example)
        const blockchainState = await fetchBlockchainStateData();
        logger.info("Fetched blockchain state for monitoring.", { blockchainState });

        // Example: Submit a Test Communication Transaction
        const testTransactionDetails = {
            satelliteId: "SAT-003",
            message: "Satellite Gamma Node Test Message",
            tokenId: "test-token-id",
            encryptedToken: "test-encrypted-token",
            keyPair: encryptionUtils.generateQuantumKeypair("dilithium") // Example keypair
        };

        const transactionResult = await submitCommunicationTransaction(testTransactionDetails);
        if (transactionResult) {
            logger.info("Test communication transaction submitted successfully.");
        } else {
            logger.warn("Failed to submit test communication transaction.");
        }
    } catch (error) {
        logger.error("Failed to initialize Satellite Gamma Node.", { error: error.message });
        process.exit(1);
    }
}

// Start the Satellite Gamma Node
initializeNode().catch((error) => {
    logger.error("Unexpected error during initialization.", { error: error.message });
    process.exit(1);
});
