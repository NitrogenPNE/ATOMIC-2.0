"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Blockchain Security Monitor
//
// Description:
// Monitors the blockchain for potential security threats, such as suspicious 
// transactions, unauthorized access attempts, or chain manipulation. Integrates 
// with the National Defense HQ Node's security framework.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For logging and file operations.
// - path: For log file management.
// - alertsConfig: For sending security alerts.
// - activityAuditLogger: Logs detected issues and resolutions.
//
// Usage:
// const { monitorBlockchainSecurity } = require('./blockchainSecurityMonitor');
// monitorBlockchainSecurity().then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const alertsConfig = require("../Monitoring/alertsConfig.json");

// Paths
const SECURITY_LOG_DIR = path.resolve(__dirname, "../../Logs/Security/");
const ALERT_DISPATCH_FILE = path.resolve(__dirname, "../../Alerts/dispatch.json");

// Monitoring Settings
const SUSPICIOUS_THRESHOLD = 5; // Maximum allowed suspicious activities per session

/**
 * Monitors blockchain activities for suspicious or malicious behavior.
 * @returns {Promise<void>}
 */
async function monitorBlockchainSecurity() {
    logInfo("Starting blockchain security monitoring...");
    try {
        const activities = await fetchBlockchainActivities();

        const suspiciousActivities = activities.filter(isSuspiciousActivity);
        if (suspiciousActivities.length > 0) {
            logInfo(`Suspicious activities detected: ${suspiciousActivities.length}`);
            await handleSuspiciousActivities(suspiciousActivities);
        } else {
            logInfo("No suspicious activities detected.");
        }
    } catch (error) {
        logError("Error during blockchain security monitoring.", { error: error.message });
        throw error;
    }
}

/**
 * Fetches blockchain activities for analysis.
 * @returns {Promise<Array<Object>>} - List of blockchain activities.
 */
async function fetchBlockchainActivities() {
    // Simulated blockchain activity fetching
    return [
        { type: "transaction", details: { amount: 1000000, from: "unknown", to: "node123" } },
        { type: "access", details: { user: "maliciousActor", attempt: "failed" } },
        { type: "chainModification", details: { block: 123, action: "unauthorized" } },
    ];
}

/**
 * Determines whether an activity is suspicious.
 * @param {Object} activity - Blockchain activity to evaluate.
 * @returns {boolean} - True if the activity is suspicious, false otherwise.
 */
function isSuspiciousActivity(activity) {
    switch (activity.type) {
        case "transaction":
            return activity.details.amount > 500000 || activity.details.from === "unknown";
        case "access":
            return activity.details.attempt === "failed";
        case "chainModification":
            return activity.details.action === "unauthorized";
        default:
            return false;
    }
}

/**
 * Handles detected suspicious activities.
 * @param {Array<Object>} activities - List of suspicious activities.
 * @returns {Promise<void>}
 */
async function handleSuspiciousActivities(activities) {
    for (const activity of activities) {
        const action = determineResponseAction(activity);
        logInfo(`Executing response action for activity: ${JSON.stringify(activity)}`);
        await executeResponseAction(action, activity);
    }

    if (activities.length >= SUSPICIOUS_THRESHOLD) {
        await dispatchAlert(
            "SecurityTeam",
            `Multiple suspicious activities detected (${activities.length}). Immediate action required.`
        );
    }
}

/**
 * Determines the response action for a suspicious activity.
 * @param {Object} activity - The suspicious activity.
 * @returns {string} - The response action.
 */
function determineResponseAction(activity) {
    switch (activity.type) {
        case "transaction":
            return "flagTransaction";
        case "access":
            return "blockUser";
        case "chainModification":
            return "rollbackBlock";
        default:
            return "logOnly";
    }
}

/**
 * Executes a response action for a suspicious activity.
 * @param {string} action - The response action.
 * @param {Object} activity - The suspicious activity.
 * @returns {Promise<void>}
 */
async function executeResponseAction(action, activity) {
    switch (action) {
        case "flagTransaction":
            logInfo(`Flagging suspicious transaction: ${JSON.stringify(activity.details)}`);
            // Implement transaction flagging logic
            break;
        case "blockUser":
            logInfo(`Blocking user: ${activity.details.user}`);
            // Implement user blocking logic
            break;
        case "rollbackBlock":
            logInfo(`Rolling back block: ${activity.details.block}`);
            // Implement block rollback logic
            break;
        default:
            logInfo(`Logging activity only: ${JSON.stringify(activity)}`);
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
    monitorBlockchainSecurity,
};

// ------------------------------------------------------------------------------
// End of Module: Blockchain Security Monitor
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for monitoring blockchain security threats.
// ------------------------------------------------------------------------------
