"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Intrusion Prevention System (IPS)
//
// Description:
// Implements a real-time Intrusion Prevention System (IPS) for the National Defense HQ Node. 
// Monitors network traffic and activities to detect and prevent unauthorized access or malicious 
// activities. Incorporates adaptive response mechanisms.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file operations and logging.
// - path: For managing configuration paths.
// - activityAuditLogger: Logs detection activities and incidents.
// - firewallController: Handles dynamic firewall rule updates.
// - threatDetectionEngine: Detects suspicious patterns in network and system activities.
//
// Usage:
// const { startIPS, stopIPS } = require('./intrusionPreventionSystem');
// startIPS().then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const firewallController = require("./firewallController");
const threatDetectionEngine = require("./threatDetectionEngine");

// Paths
const IPS_CONFIG_PATH = "./Config/ipsConfig.json";
const INCIDENT_LOGS_PATH = "./Logs/Security/incidents.json";

// Configuration
let ipsConfig = {
    monitoringInterval: 5000,
    adaptiveResponses: true,
};

let ipsRunning = false;
let monitoringIntervalId;

/**
 * Initializes and starts the Intrusion Prevention System.
 * @returns {Promise<void>}
 */
async function startIPS() {
    logInfo("Starting Intrusion Prevention System (IPS)...");

    try {
        // Load IPS configuration
        ipsConfig = await loadConfig();
        ipsRunning = true;

        // Start monitoring loop
        monitoringIntervalId = setInterval(async () => {
            try {
                await monitorNetworkAndSystem();
            } catch (error) {
                logError("Error during IPS monitoring.", { error: error.message });
            }
        }, ipsConfig.monitoringInterval);

        logInfo("IPS started successfully.");
    } catch (error) {
        logError("Failed to start IPS.", { error: error.message });
        throw error;
    }
}

/**
 * Stops the Intrusion Prevention System.
 * @returns {Promise<void>}
 */
async function stopIPS() {
    logInfo("Stopping Intrusion Prevention System (IPS)...");

    try {
        if (monitoringIntervalId) {
            clearInterval(monitoringIntervalId);
            monitoringIntervalId = null;
        }
        ipsRunning = false;

        logInfo("IPS stopped successfully.");
    } catch (error) {
        logError("Error stopping IPS.", { error: error.message });
        throw error;
    }
}

/**
 * Monitors network traffic and system activities for potential threats.
 * @returns {Promise<void>}
 */
async function monitorNetworkAndSystem() {
    if (!ipsRunning) {
        return;
    }

    logInfo("Monitoring network traffic and system activities...");

    try {
        const suspiciousActivities = await threatDetectionEngine.detectThreats();

        if (suspiciousActivities.length > 0) {
            logInfo(`Detected ${suspiciousActivities.length} suspicious activities.`);
            await handleThreats(suspiciousActivities);
        } else {
            logInfo("No suspicious activities detected.");
        }
    } catch (error) {
        logError("Error during monitoring.", { error: error.message });
        throw error;
    }
}

/**
 * Handles detected threats by logging incidents and triggering adaptive responses.
 * @param {Array<Object>} threats - List of detected threats.
 * @returns {Promise<void>}
 */
async function handleThreats(threats) {
    for (const threat of threats) {
        logInfo(`Handling threat: ${JSON.stringify(threat)}`);

        try {
            // Log the threat
            await logIncident(threat);

            // Apply adaptive response if enabled
            if (ipsConfig.adaptiveResponses) {
                await applyAdaptiveResponse(threat);
            }
        } catch (error) {
            logError("Error handling threat.", { threat, error: error.message });
        }
    }
}

/**
 * Applies adaptive responses to mitigate threats.
 * @param {Object} threat - The detected threat.
 * @returns {Promise<void>}
 */
async function applyAdaptiveResponse(threat) {
    logInfo(`Applying adaptive response to threat: ${threat.type}`);

    switch (threat.type) {
        case "unauthorized_access":
            await firewallController.blockIP(threat.sourceIP);
            logInfo(`Blocked IP: ${threat.sourceIP}`);
            break;

        case "ddos_attack":
            await firewallController.activateRateLimiting();
            logInfo("Activated rate limiting to mitigate DDoS attack.");
            break;

        case "malware_activity":
            logInfo("Isolating affected node for malware activity.");
            // Placeholder for node isolation logic
            break;

        default:
            logInfo(`No predefined response for threat type: ${threat.type}`);
    }
}

/**
 * Logs an incident to the incident log file.
 * @param {Object} incident - The incident details.
 * @returns {Promise<void>}
 */
async function logIncident(incident) {
    try {
        await fs.ensureFile(INCIDENT_LOGS_PATH);
        const incidents = (await fs.readJson(INCIDENT_LOGS_PATH, { throws: false })) || [];
        incidents.push({ ...incident, timestamp: new Date().toISOString() });

        await fs.writeJson(INCIDENT_LOGS_PATH, incidents, { spaces: 2 });
        logInfo(`Incident logged: ${incident.type}`);
    } catch (error) {
        logError("Failed to log incident.", { error: error.message });
        throw error;
    }
}

/**
 * Loads IPS configuration from file.
 * @returns {Promise<Object>} - Loaded configuration.
 */
async function loadConfig() {
    try {
        if (await fs.pathExists(IPS_CONFIG_PATH)) {
            return await fs.readJson(IPS_CONFIG_PATH);
        }
        return ipsConfig; // Default configuration
    } catch (error) {
        logError("Failed to load IPS configuration.", { error: error.message });
        throw error;
    }
}

module.exports = {
    startIPS,
    stopIPS,
};

// ------------------------------------------------------------------------------
// End of Module: Intrusion Prevention System
// Version: 1.0.0 | Updated: 2024-11-27
// Change Log: Initial implementation with real-time threat monitoring and adaptive responses.
// ------------------------------------------------------------------------------