"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Beta Node - Main Entry Point
// ------------------------------------------------------------------------------

// Dependencies
const path = require("path");
const winston = require("winston");
const { initializeSatelliteService } = require("./Services/satelliteService");
const { initializeBlockchainIntegration } = require("./Services/blockchainIntegration");
const encryptionUtils = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const validationUtils = require("../../../atomic-blockchain/Utilities/validationUtils");

// Logger Setup
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

// Configuration Paths
const CONFIG_PATH = path.join(__dirname, "Config", "satelliteConfig.json");

// Main Initialization Function
async function initializeNode() {
    logger.info("Initializing Satellite Beta Node...");

    try {
        // Load Configuration
        const config = require(CONFIG_PATH);
        logger.info("Configuration loaded successfully.", { config });

        // Initialize Encryption Utilities
        await encryptionUtils.initializeCryptoUtils();
        logger.info("Quantum encryption utilities initialized.");

        // Initialize Blockchain Integration
        await initializeBlockchainIntegration(config, logger);

        // Initialize Satellite Service
        await initializeSatelliteService(config, logger);

        logger.info("Satellite Beta Node initialized and services running.");
    } catch (error) {
        logger.error("Failed to initialize Satellite Beta Node.", { error: error.message });
        process.exit(1); // Exit process with failure code
    }
}

// Start the Node
initializeNode().catch((error) => {
    logger.error("Unexpected error during Satellite Beta Node initialization.", { error: error.message });
    process.exit(1);
});
