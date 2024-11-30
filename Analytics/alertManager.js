"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Alert Manager
 *
 * Description:
 * Generates and manages text-based alerts for the ATOMIC system.
 * Alerts are triggered based on threshold breaches, anomalies, or system events.
 *
 * Features:
 * - Customizable alert templates.
 * - Supports alert levels (info, warning, critical).
 * - Integrates with real-time monitoring and metrics collectors.
 * ---------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");

// Default alert templates path
const ALERT_TEMPLATES_PATH = path.resolve(__dirname, "./templates/alertTemplate.json");

// Default alert levels
const ALERT_LEVELS = {
    INFO: "Info",
    WARNING: "Warning",
    CRITICAL: "Critical",
};

/**
 * Load alert templates from JSON.
 * @returns {Object} - Alert templates.
 */
async function loadAlertTemplates() {
    try {
        if (!fs.existsSync(ALERT_TEMPLATES_PATH)) {
            throw new Error("Alert templates not found at: " + ALERT_TEMPLATES_PATH);
        }
        return await fs.readJson(ALERT_TEMPLATES_PATH);
    } catch (error) {
        console.error("Error loading alert templates:", error.message);
        throw error;
    }
}

/**
 * Generate an alert message based on the provided details.
 * @param {Object} details - Details of the alert.
 * @param {string} details.issue - The issue or event description.
 * @param {string} details.nodeId - The ID of the affected node (optional).
 * @param {string} level - The alert level (Info, Warning, Critical).
 * @returns {string} - Generated alert message.
 */
async function generateAlert(details, level = ALERT_LEVELS.INFO) {
    try {
        const templates = await loadAlertTemplates();
        const template = templates.template || "Alert: {issue} on Node {nodeId}.";

        // Replace placeholders in the template
        let alertMessage = template
            .replace("{issue}", details.issue || "Unknown issue")
            .replace("{nodeId}", details.nodeId || "Unknown");

        alertMessage = `[${level}] ${alertMessage}`;
        console.log("Generated alert:", alertMessage);
        return alertMessage;
    } catch (error) {
        console.error("Error generating alert:", error.message);
        throw error;
    }
}

/**
 * Send an alert to the appropriate recipients (console log, messaging system, etc.).
 * @param {string} message - The alert message to send.
 */
function sendAlert(message) {
    // In a real system, integrate with messaging platforms or APIs
    console.log("Sending alert:", message);
}

/**
 * Create and send an alert.
 * @param {Object} details - Details for the alert.
 * @param {string} level - The alert level (Info, Warning, Critical).
 */
async function createAndSendAlert(details, level) {
    try {
        const alertMessage = await generateAlert(details, level);
        sendAlert(alertMessage);
    } catch (error) {
        console.error("Error creating and sending alert:", error.message);
    }
}

// Exported functions
module.exports = {
    createAndSendAlert,
    ALERT_LEVELS,
};
