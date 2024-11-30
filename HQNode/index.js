"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC HQ Node Initialization
//
// Description:
// The entry point for the ATOMIC HQ Node. Initializes and manages subsystems
// including validation, arbitration, orchestration, and monitoring.
//
// Dependencies:
// - Monitoring: Tracks performance and system health.
// - Arbitration: Manages consensus and dispute resolution.
// - Orchestration: Balances workloads and coordinates tasks.
// - ConfigLoader: Loads settings from the configuration file.
//
// Author: ATOMIC, Ltd.
// ------------------------------------------------------------------------------

const path = require("path");
const { initializeMonitoring } = require("./Monitoring/systemMonitor");
const { initializeArbitration } = require("./Arbitration/consensusArbitrator");
const { initializeOrchestration } = require("./Orchestration/taskCoordinator");
const { initializeValidation } = require("./Validation/blockValidator");
const { loadConfig } = require("./Config/configLoader");

async function initializeHQNode() {
    try {
        console.log("Initializing ATOMIC HQ Node...");

        // Load configuration
        const configPath = path.join(__dirname, "Config", "hqConfig.json");
        const config = await loadConfig(configPath);

        console.log("Configuration loaded successfully:", config);

        // Initialize subsystems
        await initializeMonitoring(config.monitoring);
        await initializeArbitration(config.arbitration);
        await initializeOrchestration(config.orchestration);
        await initializeValidation(config.validation);

        console.log("HQ Node subsystems initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize HQ Node:", error.message);
        process.exit(1);
    }
}

// Start the HQ Node
initializeHQNode();
