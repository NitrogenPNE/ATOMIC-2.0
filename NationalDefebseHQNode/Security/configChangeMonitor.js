"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Configuration Change Monitor
//
// Description:
// Monitors critical configuration files for unauthorized changes or tampering.
// Alerts the National Defense HQ Node's security team upon detecting anomalies.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For reading and comparing configuration files.
// - crypto: For generating file hashes.
// - path: For handling configuration file paths.
// - activityAuditLogger: Logs detected changes and alerts.
// - alertsConfig: Sends alerts to relevant teams upon detecting changes.
//
// Usage:
// const { monitorConfigChanges } = require('./configChangeMonitor');
// monitorConfigChanges().then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const crypto = require("crypto");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const alertsConfig = require("../Monitoring/alertsConfig.json");

// Paths
const CONFIG_DIR = path.resolve(__dirname, "../Config/");
const SECURITY_LOG_FILE = path.resolve(__dirname, "../../Logs/Security/configChangeLogs.json");

// Monitoring Settings
const MONITORED_FILES = [
    "hqConfig.json",
    "accessControlRules.json",
    "keyManagementConfig.json",
    "encryptionStandards.json",
    "validationSettings.json",
];
const HASHES_FILE = path.resolve(CONFIG_DIR, "configFileHashes.json");

/**
 * Monitors configuration files for unauthorized changes.
 * @returns {Promise<void>}
 */
async function monitorConfigChanges() {
    logInfo("Starting configuration change monitoring...");

    try {
        // Ensure necessary directories and files exist
        await fs.ensureFile(HASHES_FILE);
        const previousHashes = (await fs.readJson(HASHES_FILE, { throws: false })) || {};

        const currentHashes = {};
        let changesDetected = false;

        for (const file of MONITORED_FILES) {
            const filePath = path.join(CONFIG_DIR, file);

            if (await fs.pathExists(filePath)) {
                const currentHash = await generateFileHash(filePath);
                currentHashes[file] = currentHash;

                if (previousHashes[file] && previousHashes[file] !== currentHash) {
                    logInfo(`Change detected in configuration file: ${file}`);
                    await handleConfigChange(file, filePath);
                    changesDetected = true;
                }
            } else {
                logError(`Monitored file not found: ${file}`);
            }
        }

        // Save the updated hashes
        await fs.writeJson(HASHES_FILE, currentHashes, { spaces: 2 });

        if (!changesDetected) {
            logInfo("No configuration changes detected.");
        }
    } catch (error) {
        logError("Error during configuration monitoring.", { error: error.message });
        throw error;
    }
}

/**
 * Generates a SHA-256 hash of a file's content.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<string>} - SHA-256 hash of the file.
 */
async function generateFileHash(filePath) {
    const fileContent = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(fileContent).digest("hex");
}

/**
 * Handles detected configuration file changes.
 * @param {string} file - The configuration file name.
 * @param {string} filePath - The path to the configuration file.
 * @returns {Promise<void>}
 */
async function handleConfigChange(file, filePath) {
    const timestamp = new Date().toISOString();

    // Log the change
    const changeLog = {
        file,
        timestamp,
        status: "Change Detected",
        details: `Configuration file ${file} was modified.`,
    };
    await appendToChangeLog(changeLog);

    // Dispatch an alert
    await dispatchAlert(
        "SecurityTeam",
        `Configuration change detected in ${file}. Please investigate immediately.`,
        timestamp
    );

    logInfo(`Handled configuration change for file: ${file}`);
}

/**
 * Appends change information to the log file.
 * @param {Object} changeLog - The change log entry.
 */
async function appendToChangeLog(changeLog) {
    await fs.ensureFile(SECURITY_LOG_FILE);
    const logs = (await fs.readJson(SECURITY_LOG_FILE, { throws: false })) || [];
    logs.push(changeLog);

    await fs.writeJson(SECURITY_LOG_FILE, logs, { spaces: 2 });
    logInfo(`Change logged: ${changeLog.file}`);
}

/**
 * Dispatches an alert for a configuration change.
 * @param {string} recipient - Recipient of the alert (e.g., "SecurityTeam").
 * @param {string} message - Alert message.
 * @param {string} timestamp - Timestamp of the alert.
 */
async function dispatchAlert(recipient, message, timestamp) {
    const alert = { recipient, message, timestamp };

    await fs.ensureFile(alertsConfig.alertFile);
    const existingAlerts = (await fs.readJson(alertsConfig.alertFile, { throws: false })) || [];
    existingAlerts.push(alert);

    await fs.writeJson(alertsConfig.alertFile, existingAlerts, { spaces: 2 });
    logInfo(`Alert dispatched to ${recipient}: ${message}`);
}

module.exports = {
    monitorConfigChanges,
};

// ------------------------------------------------------------------------------
// End of Module: Configuration Change Monitor
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for monitoring configuration changes.
// ------------------------------------------------------------------------------
