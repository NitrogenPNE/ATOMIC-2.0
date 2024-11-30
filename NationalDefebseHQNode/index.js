"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: National Defense HQ Node
//
// Description:
// Main entry point for initializing and orchestrating operations for the
// National Defense HQ Node in the ATOMIC network. This script sets up
// subscriptions, monitoring, orchestration, validation, security,
// communication, training, and incident response.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

// Dependencies
const path = require("path");
const { logInfo, logError } = require("./Monitoring/performanceLogger");
const subscriptionManager = require("./Subscriptions/subscriptionManager");
const systemMonitor = require("./Monitoring/systemMonitor");
const orchestrationManager = require("./Orchestration/shardDistributionManager");
const validationEngine = require("./Validation/shardValidator");
const configLoader = require("./Config/configLoader");
const alertsDispatcher = require("./Security/alertsDispatcher");
const trainingScheduler = require("./Training/trainingScheduler");
const incidentPlaybookManager = require("./IncidentResponse/incidentPlaybookManager");
const hardwareResilienceManager = require("./Resilience/hardwareResilienceManager");
const satelliteCommIntegration = require("./Communication/satelliteCommIntegration");
const personnelClearanceManager = require("./Personnel/personnelClearanceManager");

// Global Configurations
const HQ_CONFIG_PATH = path.join(__dirname, "Config", "hqConfig.json");
let hqConfig;

/**
 * Initialize the National Defense HQ Node.
 */
async function initializeHQNode() {
    try {
        logInfo("Initializing National Defense HQ Node...");

        // Load HQ Configurations
        hqConfig = await configLoader.loadConfig(HQ_CONFIG_PATH);
        logInfo("HQ Configuration loaded successfully.", hqConfig);

        // Start Subscriptions
        logInfo("Starting subscription manager...");
        await subscriptionManager.initializeSubscriptions();

        // Start Monitoring Services
        logInfo("Starting system monitoring services...");
        await systemMonitor.startMonitoring();

        // Initialize Orchestration Manager
        logInfo("Initializing orchestration services...");
        orchestrationManager.initializeOrchestration();

        // Validation Services
        logInfo("Initializing validation engine...");
        validationEngine.initializeValidation();

        // Security Services
        logInfo("Initializing security alerts dispatcher...");
        alertsDispatcher.initializeDispatcher();

        // Training Scheduler
        logInfo("Initializing training scheduler...");
        await trainingScheduler.startTrainingScheduler();

        // Incident Response
        logInfo("Initializing incident playbook manager...");
        await incidentPlaybookManager.initializeIncidentResponse();

        // Hardware Resilience
        logInfo("Initializing hardware resilience manager...");
        await hardwareResilienceManager.monitorHardware();

        // Satellite Communication
        logInfo("Initializing satellite communication integration...");
        await satelliteCommIntegration.initializeSatelliteComm();

        // Personnel Clearance
        logInfo("Loading personnel clearance manager...");
        await personnelClearanceManager.initializeClearance();

        logInfo("National Defense HQ Node initialized successfully.");
    } catch (error) {
        logError("Failed to initialize National Defense HQ Node.", { error: error.message });
        process.exit(1);
    }
}

/**
 * Start the National Defense HQ Node.
 */
(async function startHQNode() {
    await initializeHQNode();

    // Maintain a persistent event loop for services
    logInfo("National Defense HQ Node is now operational and running.");
})();