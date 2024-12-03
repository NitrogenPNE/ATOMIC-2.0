"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Satellite Node Main Entry Point
// ------------------------------------------------------------------------------

const path = require("path");
const winston = require("winston");
const fs = require("fs-extra");

// Services and Utilities
const { initializeSatelliteService } = require("./Services/satelliteService");
const { initializeBlockchainIntegration } = require("./Services/blockchainIntegration");
const { encryptWithQuantum, decryptWithQuantum } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { validateTransaction, validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");

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

// Main Initialization
async function initializeNode() {
    logger.info("Initializing Satellite Node...");

    try {
        // Ensure Config Exists
        if (!(await fs.pathExists(CONFIG_PATH))) {
            throw new Error(`Configuration file not found at: ${CONFIG_PATH}`);
        }

        // Load Configuration
        const config = await fs.readJson(CONFIG_PATH);
        logger.info("Configuration loaded successfully.", { config });

        // Initialize Utilities
        await encryptWithQuantum.initializeCryptoUtils(); // Ensure quantum cryptography is ready
        logger.info("Quantum encryption utilities initialized.");

        // Validate the Configuration (if applicable)
        if (!config.communication || !config.satellites) {
            throw new Error("Configuration validation failed: Missing required fields.");
        }

        // Initialize Satellite Services
        await initializeSatelliteService(config, logger);
        logger.info("Satellite service initialized successfully.");

        // Initialize Blockchain Integration
        await initializeBlockchainIntegration(config, logger);
        logger.info("Blockchain integration initialized successfully.");

        logger.info("Satellite Node initialized and operational.");
    } catch (error) {
        logger.error("Failed to initialize Satellite Node.", { error: error.message });
        process.exit(1);
    }
}

// Start the Satellite Node
initializeNode().catch((error) => {
    logger.error("Unexpected error during initialization.", { error: error.message });
    process.exit(1);
});