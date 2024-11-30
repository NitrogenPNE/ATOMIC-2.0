"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Start ATOMIC 2.0
//
// Description:
// Bootstraps and initializes the ATOMIC 2.0 blockchain environment. Ensures
// secure startup of all critical components, including supernodes, worker nodes,
// NIKI AI module, and shard management.
//
// Dependencies:
// - child_process: For launching subprocesses securely.
// - winston: For structured logging.
// - fs-extra: For file and directory validation.
//
// Features:
// - Starts supernodes, worker nodes, and NIKI AI module.
// - Ensures all configurations are validated before startup.
// - Centralized logging for startup events with traceability.
// - Safe process termination and cleanup on failure.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const winston = require("winston");

// Logger Configuration
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join("C:\\ATOMIC 2.0\\Logs", "startup.log") }),
    ],
});

// Component Paths
const components = {
    supernodes: path.join("C:\\ATOMIC 2.0\\Supernodes", "index.js"),
    workerNodes: path.join("C:\\ATOMIC 2.0\\WorkerNode", "index.js"),
    nikiAI: path.join("C:\\ATOMIC 2.0\\NIKI", "index.js"),
    atomicBlockchain: path.join("C:\\ATOMIC 2.0\\atomic-blockchain", "index.js"),
};

// Validation Checkpoints
function validateConfiguration() {
    logger.info("Validating ATOMIC 2.0 configurations...");
    const configPath = path.join("C:\\ATOMIC 2.0\\Config", "config.json");

    if (!fs.existsSync(configPath)) {
        logger.error("Configuration file missing. Ensure 'config.json' exists in 'Config' directory.");
        throw new Error("Configuration validation failed: Missing 'config.json'.");
    }

    const config = fs.readJsonSync(configPath);
    if (!config.supernode || !config.network) {
        logger.error("Invalid configuration: Missing required fields 'supernode' or 'network'.");
        throw new Error("Configuration validation failed: Invalid structure.");
    }

    logger.info("Configuration validation passed.");
}

// Start a Component
function startComponent(name, scriptPath) {
    logger.info(`Starting ${name}...`);

    if (!fs.existsSync(scriptPath)) {
        logger.error(`Script not found for ${name}: ${scriptPath}`);
        throw new Error(`Startup failed: ${name} script is missing.`);
    }

    const process = spawn("node", [scriptPath], {
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "production" },
    });

    process.on("error", (err) => {
        logger.error(`Error starting ${name}: ${err.message}`);
    });

    process.on("exit", (code) => {
        if (code !== 0) {
            logger.error(`${name} exited with error code ${code}`);
        } else {
            logger.info(`${name} started successfully.`);
        }
    });

    return process;
}

// Main Startup Logic
function startAtomic() {
    try {
        logger.info("Initializing ATOMIC 2.0 startup process...");

        // Validate configuration before starting components
        validateConfiguration();

        // Start ATOMIC components
        const processes = [];
        processes.push(startComponent("Supernodes", components.supernodes));
        processes.push(startComponent("Worker Nodes", components.workerNodes));
        processes.push(startComponent("NIKI AI Module", components.nikiAI));
        processes.push(startComponent("Blockchain Engine", components.atomicBlockchain));

        logger.info("ATOMIC 2.0 components started successfully.");
        return processes;
    } catch (error) {
        logger.error(`Startup failed: ${error.message}`);
        process.exit(1);
    }
}

// Start the ATOMIC System
const activeProcesses = startAtomic();

// Graceful Shutdown Handler
process.on("SIGINT", () => {
    logger.warn("Received SIGINT. Shutting down ATOMIC 2.0...");
    activeProcesses.forEach((proc) => proc.kill());
    logger.info("All processes terminated. Goodbye.");
    process.exit(0);
});

process.on("SIGTERM", () => {
    logger.warn("Received SIGTERM. Shutting down ATOMIC 2.0...");
    activeProcesses.forEach((proc) => proc.kill());
    logger.info("All processes terminated. Goodbye.");
    process.exit(0);
});