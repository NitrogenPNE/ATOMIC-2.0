"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Quantum Supercomputer Orchestrator
//
// Description:
// This script orchestrates the quantum-inspired simulation environment for the 
// ATOMIC HQ Node. It initializes the quantum environment, manages resources, 
// simulates quantum gates, and validates outputs for compliance.
//
// Features:
// - Initializes quantum simulation environment.
// - Allocates system resources dynamically.
// - Executes quantum gate simulations.
// - Logs results and metrics for analysis.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// Governed by Canadian law and the Province of British Columbia.
//
// Dependencies:
// - initQuantum.js: Quantum environment initialization.
// - resourceAllocator.js: Dynamic resource management.
// - quantumGateSimulator.js: Quantum gate operations.
// - performanceMonitor.js: System performance monitoring.
// - logger.js: Centralized logging.
// - gpu-info: GPU detection.
//
// Contact:
// Email: licensing@atomic.ca | Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const path = require("path");
const gpuInfo = require("gpu-info"); // Ensure this library is installed via npm

// Import dependencies using relative paths
const { initQuantumEnvironment } = require(path.join(__dirname, "./Simulation/initQuantum.js"));
const { manageResources } = require(path.join(__dirname, "./Simulation/resourceAllocator.js"));
const { simulateQuantumGates } = require(path.join(__dirname, "./Simulation/quantumGateSimulator.js"));
const { startPerformanceMonitoring } = require(path.join(__dirname, "./Utilities/performanceMonitor.js"));
const logger = require(path.join(__dirname, "./Utilities/logger.js"));

// Configuration
const LOG_FILE = path.join(__dirname, "./Logs/quantumSupercomputer.log");

// Logging utility
function logMessage(message, level = "INFO") {
    const levels = {
        DEBUG: logger.debug,
        INFO: logger.info,
        WARN: logger.warn,
        ERROR: logger.error,
    };

    const logFunction = levels[level.toUpperCase()] || logger.info; // Default to INFO
    logFunction(message, LOG_FILE);
}

// GPU Monitoring
async function checkGPUAvailability() {
    try {
        const gpus = await gpuInfo();
        if (gpus.length > 0) {
            logMessage(`GPUs detected: ${gpus.map(gpu => gpu.model).join(", ")}`, "INFO");
            return true;
        } else {
            logMessage("No GPUs detected. Falling back to CPU-only mode.", "WARN");
            return false;
        }
    } catch (error) {
        logMessage(`Error during GPU detection: ${error.message}. Falling back to CPU-only mode.`, "WARN");
        return false;
    }
}

// Main quantum supercomputer function
async function runQuantumSupercomputer() {
    try {
        logMessage("Starting the ATOMIC Quantum Supercomputer simulation...");

        // Step 1: Check GPU availability
        const gpuAvailable = await checkGPUAvailability();
        if (!gpuAvailable) {
            logMessage("Running in CPU-only mode due to lack of GPU resources.", "WARN");
        }

        // Step 2: Initialize Quantum Environment
        logMessage("Initializing quantum environment...");
        initQuantumEnvironment();

        // Step 3: Start Performance Monitoring
        logMessage("Starting system performance monitoring...");
        startPerformanceMonitoring();

        // Step 4: Manage Resources
        logMessage("Allocating and managing system resources...");
        manageResources();

        // Step 5: Execute Quantum Gate Simulations
        logMessage("Executing quantum gate simulations...");
        simulateQuantumGates();

        // Step 6: Finalization
        logMessage("Quantum Supercomputer simulation completed successfully.");
    } catch (error) {
        logMessage(`Error in Quantum Supercomputer simulation: ${error.message}`, "ERROR");
    }
}

// Run orchestrator if executed directly
if (require.main === module) {
    runQuantumSupercomputer();
}

module.exports = { runQuantumSupercomputer };

// ------------------------------------------------------------------------------
// End of Quantum Supercomputer Orchestrator
// Version: 1.0.1 | Updated: 2024-11-30
// ------------------------------------------------------------------------------