"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: NIKI Node Entry Point (Enhanced)
//
// Description:
// Entry point for the NIKI AI node. Handles configuration loading, service 
// initialization, QKD-based secure key distribution, and real-time operations 
// for the ATOMIC system.
//
// Features:
// - Quantum Key Distribution (QKD) for secure communication.
// - Secure configuration handling with obfuscation of sensitive data.
// - Integration with tamper detection, shard prediction, task scheduling, and NATO protocols.
// - Enhanced error handling with structured logging.
// - Blockchain-backed logging and diagnostics.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const winston = require("winston"); // Logging framework
const { initializeLogs, generateDiagnosticReport } = require("./AI/Utilities/monitoringTools"); // Monitoring tools
const { monitorAndDetectTampering } = require("./AI/Models/tamperDetectionModel");
const { monitorAndPredictShards } = require("./AI/Models/shardPredictionModel");
const { monitorAndScheduleTasks } = require("./AI/Models/taskSchedulerModel");
const { performQKD } = require("./Utilities/quantumCryptographyUtils"); // QKD integration
const { initializeQKD } = require("./Utilities/qkdUtils"); // QKD initialization
const { sendSecureNATOMessage } = require("./Transport/natoTransport"); // NATO protocol
const { logEventToBlockchain } = require("./Utilities/blockchainUtils");

// Log the start of the application
console.log("Initializing NIKI AI Node...");

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({ level: "info" }),
        new winston.transports.File({ filename: "logs/niki_node.log", level: "info" }),
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    ],
});

// **Configuration Loading**
const CONFIG_FILE_PATH = path.join(__dirname, "config.json");

/**
 * Load the configuration file securely.
 * @param {string} filePath - Path to the config file.
 * @returns {Object} - Parsed configuration object.
 */
function loadConfig(filePath) {
    try {
        const rawData = fs.readFileSync(filePath, "utf8");
        const config = JSON.parse(rawData);
        logger.info("Configuration loaded successfully.", { filePath });

        // Log the event to the blockchain for integrity
        logEventToBlockchain("CONFIG_LOADED", { filePath });

        return config;
    } catch (error) {
        logger.error("Error loading configuration file:", { error: error.message });
        process.exit(1); // Exit the process if config loading fails
    }
}

// Load the configuration
const config = loadConfig(CONFIG_FILE_PATH);

// Log the loaded configuration (obfuscating sensitive fields)
logger.info("Application Configuration:", {
    application: config.application,
    sharding: config.sharding,
    logging: config.logging,
    api: { endpoint: config.api.endpoint, timeout: config.api.timeout },
});

// **Application Initialization**
/**
 * Initialize core services and dependencies.
 */
async function initializeServices() {
    try {
        logger.info("Initializing monitoring logs...");
        await initializeLogs();

        logger.info("Generating initial diagnostic report...");
        await generateDiagnosticReport("initialDiagnostics");

        logger.info("Initializing Quantum Key Distribution (QKD) utilities...");
        await initializeQKD();

        logger.info("Starting Quantum Key Distribution (QKD) for secure key exchange...");
        await performQKD("HQ"); // Example: Perform QKD with HQ

        logger.info("Starting Tamper Detection Model...");
        monitorAndDetectTampering();

        logger.info("Starting Shard Prediction Model...");
        monitorAndPredictShards();

        logger.info("Starting Task Scheduler Model...");
        monitorAndScheduleTasks();

        logger.info("Testing NATO Transport Protocol...");
        const testData = { message: "NIKI Node Initialization Test" };
        await sendSecureNATOMessage("HQ", testData, { nodeId: "NIKI-001", privateKey: "./Config/privateKey.pem" });

        logger.info("All services initialized successfully. NIKI is operational.");
    } catch (error) {
        logger.error("Error during service initialization:", { error: error.message });

        // Log the error to the blockchain for transparency
        logEventToBlockchain("SERVICE_INIT_FAILURE", { error: error.message });

        process.exit(1); // Exit if critical initialization fails
    }
}

// **Error Handling**
process.on("uncaughtException", async (err) => {
    logger.error("Uncaught Exception:", { error: err.message, stack: err.stack });

    // Log the exception to the blockchain
    await logEventToBlockchain("UNCAUGHT_EXCEPTION", { error: err.message, stack: err.stack });

    process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
    logger.error("Unhandled Rejection:", { reason, promise });

    // Log the rejection to the blockchain
    await logEventToBlockchain("UNHANDLED_REJECTION", { reason, promise });

    process.exit(1);
});

// **Startup Sequence**
(async () => {
    logger.info("Starting NIKI AI Node...");

    // Core Initialization
    await initializeServices();

    logger.info("NIKI AI Node is running and awaiting tasks...");
})();
