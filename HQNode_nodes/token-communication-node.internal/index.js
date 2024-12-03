"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Token Communication Node - Main Entry Point
// ------------------------------------------------------------------------------

// Dependencies
const path = require("path");
const winston = require("winston");
const { validateTokenPoA } = require("./Services/tokenValidationService");
const { routeMessage } = require("./Services/messageRoutingService");
const { encryptPayload, decryptPayload } = require("./Utilities/encryptionUtils");
const { logInfo, logError } = require("../../../atomic-blockchain/Utilities/loggingUtils");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "./Logs/tokenCommunicationNode.log" })
    ]
});

// Configuration Path
const CONFIG_PATH = path.resolve(__dirname, "./Config/routingRules.json");

// Node Initialization
async function initializeNode() {
    try {
        logger.info("Initializing Token Communication Node...");

        // Load Routing Rules
        const routingRules = require(CONFIG_PATH);
        logger.info("Routing rules loaded successfully.", { routingRules });

        // Simulate Node Services
        logger.info("Starting token validation service...");
        await simulateService(validateTokenPoA, "Validation");

        logger.info("Starting message routing service...");
        await simulateService(routeMessage, "Routing");

        logger.info("Token Communication Node initialized successfully.");
    } catch (error) {
        logger.error("Failed to initialize Token Communication Node.", { error: error.message });
        process.exit(1);
    }
}

// Simulate Service Operations
async function simulateService(serviceFunction, serviceName) {
    try {
        logger.info(`Simulating ${serviceName} service operation...`);
        // Placeholder for actual service operation simulation logic
        const testPayload = {
            tokenId: "test-token-id",
            encryptedToken: "test-encrypted-token",
            message: "Hello from Token Communication Node",
        };
        await serviceFunction(testPayload); // Simulating call to the service
        logger.info(`${serviceName} service simulated successfully.`);
    } catch (error) {
        logger.error(`Failed to simulate ${serviceName} service.`, { error: error.message });
    }
}

// Start the Node
initializeNode().catch((error) => {
    logger.error("Unexpected error during node initialization.", { error: error.message });
    process.exit(1);
});