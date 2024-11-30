"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Incident Response Handler
//
// Description:
// Provides automated incident detection and response capabilities for the 
// National Defense HQ Node. Monitors critical events, triggers predefined 
// response actions, and ensures rapid mitigation of security incidents.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For logging incident responses.
// - path: For incident log file paths.
// - activityAuditLogger: For logging incident details and resolutions.
// - alertsConfig: For configuring and dispatching alerts to relevant parties.
//
// Usage:
// const { handleIncident } = require('./incidentResponseHandler');
// handleIncident("Unauthorized access attempt", { sourceIP: "192.168.0.1" })
//     .then(console.log)
//     .catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const alertsConfig = require("../Monitoring/alertsConfig.json");

// Paths
const INCIDENT_LOG_DIR = path.resolve(__dirname, "../../Logs/Incidents/");
const ALERT_DISPATCH_FILE = path.resolve(__dirname, "../../Alerts/dispatch.json");

/**
 * Handles a detected security incident by logging it and triggering responses.
 * @param {string} incidentType - Description of the incident.
 * @param {Object} incidentDetails - Additional details about the incident.
 * @returns {Promise<void>}
 */
async function handleIncident(incidentType, incidentDetails = {}) {
    logInfo(`Incident detected: ${incidentType}`);

    try {
        // Step 1: Log the incident
        const logEntry = await logIncident(incidentType, incidentDetails);

        // Step 2: Trigger predefined response actions
        await triggerResponseActions(incidentType, incidentDetails);

        logInfo(`Incident handled successfully: ${incidentType}`, { logEntry });
    } catch (error) {
        logError(`Error handling incident: ${incidentType}`, { error: error.message });
        throw error;
    }
}

/**
 * Logs the incident details into a structured log file.
 * @param {string} incidentType - Description of the incident.
 * @param {Object} incidentDetails - Additional details about the incident.
 * @returns {Promise<Object>} - The logged entry.
 */
async function logIncident(incidentType, incidentDetails) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, incidentType, details: incidentDetails };

    const logFilePath = path.join(INCIDENT_LOG_DIR, `incidentLog_${Date.now()}.json`);

    await fs.ensureDir(INCIDENT_LOG_DIR);
    await fs.writeJson(logFilePath, logEntry, { spaces: 2 });

    logInfo(`Incident logged to ${logFilePath}`);
    return logEntry;
}

/**
 * Triggers response actions based on the incident type and details.
 * @param {string} incidentType - Description of the incident.
 * @param {Object} incidentDetails - Additional details about the incident.
 * @returns {Promise<void>}
 */
async function triggerResponseActions(incidentType, incidentDetails) {
    const predefinedActions = getResponseActions(incidentType);

    if (!predefinedActions || predefinedActions.length === 0) {
        logInfo(`No predefined actions for incident type: ${incidentType}`);
        return;
    }

    for (const action of predefinedActions) {
        logInfo(`Executing response action: ${action}`);
        await executeResponseAction(action, incidentDetails);
    }

    logInfo(`All response actions executed for incident type: ${incidentType}`);
}

/**
 * Retrieves predefined response actions based on the incident type.
 * @param {string} incidentType - The type of the incident.
 * @returns {Array<string>} - List of response actions.
 */
function getResponseActions(incidentType) {
    return alertsConfig.incidentResponses[incidentType] || [];
}

/**
 * Executes a specific response action.
 * @param {string} action - The action to execute.
 * @param {Object} incidentDetails - Additional details about the incident.
 * @returns {Promise<void>}
 */
async function executeResponseAction(action, incidentDetails) {
    switch (action) {
        case "alertAdmin":
            await dispatchAlert("Admin", `Incident detected: ${JSON.stringify(incidentDetails)}`);
            break;
        case "lockNode":
            logInfo("Locking down affected node...");
            // Implement node lockdown logic here
            break;
        case "blockIP":
            logInfo(`Blocking IP address: ${incidentDetails.sourceIP}`);
            // Implement IP blocking logic here
            break;
        default:
            logError(`Unknown response action: ${action}`);
    }
}

/**
 * Dispatches an alert to a specified recipient.
 * @param {string} recipient - Recipient of the alert (e.g., Admin, SecurityTeam).
 * @param {string} message - Alert message.
 * @returns {Promise<void>}
 */
async function dispatchAlert(recipient, message) {
    const alert = { recipient, message, timestamp: new Date().toISOString() };

    await fs.ensureFile(ALERT_DISPATCH_FILE);
    const existingAlerts = (await fs.readJson(ALERT_DISPATCH_FILE, { throws: false })) || [];
    existingAlerts.push(alert);

    await fs.writeJson(ALERT_DISPATCH_FILE, existingAlerts, { spaces: 2 });
    logInfo(`Alert dispatched to ${recipient}: ${message}`);
}

module.exports = {
    handleIncident,
};

// ------------------------------------------------------------------------------
// End of Module: Incident Response Handler
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation of incident response automation.
// ------------------------------------------------------------------------------
