"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Incident Playbook Manager
//
// Description:
// Manages and executes predefined playbooks for responding to security incidents
// within the National Defense HQ Node. Ensures standardized and rapid responses
// to various threat scenarios, including new triggers from airGapManager.js and biometricAuthenticator.js.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For managing playbook files and logs.
// - path: For resolving playbook paths.
// - activityAuditLogger: Logs playbook execution and updates.
// - alertsDispatcher: Sends alerts to stakeholders when playbooks are triggered.
//
// Usage:
// const { loadPlaybook, executePlaybook } = require('./incidentPlaybookManager');
// executePlaybook("dataBreach").then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const { sendAlert } = require("../Security/alertsDispatcher");
const airGapManager = require("../Validation/airGapManager");
const biometricAuthenticator = require("../Security/biometricAuthenticator");

// Paths
const PLAYBOOK_DIR = path.resolve(__dirname, "../Config/IncidentPlaybooks/");
const INCIDENT_LOG_DIR = path.resolve(__dirname, "../Logs/IncidentResponses/");

/**
 * Loads a specified incident playbook.
 * @param {string} playbookName - The name of the playbook to load.
 * @returns {Promise<Object>} - Parsed JSON content of the playbook.
 */
async function loadPlaybook(playbookName) {
    logInfo(`Loading incident playbook: ${playbookName}`);

    try {
        const playbookPath = path.join(PLAYBOOK_DIR, `${playbookName}.json`);

        if (!(await fs.pathExists(playbookPath))) {
            throw new Error(`Playbook not found: ${playbookName}`);
        }

        const playbook = await fs.readJson(playbookPath);
        return playbook;
    } catch (error) {
        logError(`Failed to load playbook: ${playbookName}`, { error: error.message });
        throw error;
    }
}

/**
 * Executes a specified playbook and logs the actions taken.
 * @param {string} playbookName - The name of the playbook to execute.
 * @returns {Promise<void>}
 */
async function executePlaybook(playbookName) {
    logInfo(`Executing incident playbook: ${playbookName}`);

    try {
        const playbook = await loadPlaybook(playbookName);

        if (!playbook || !playbook.steps || playbook.steps.length === 0) {
            throw new Error(`Playbook ${playbookName} is empty or invalid.`);
        }

        for (const step of playbook.steps) {
            logInfo(`Executing step: ${step.description}`);
            await executePlaybookStep(step);
        }

        logPlaybookExecution(playbookName, playbook.steps);
        logInfo(`Incident playbook executed successfully: ${playbookName}`);
    } catch (error) {
        logError(`Error executing playbook: ${playbookName}`, { error: error.message });
        throw error;
    }
}

/**
 * Executes a single step in a playbook.
 * @param {Object} step - The step to execute.
 * @returns {Promise<void>}
 */
async function executePlaybookStep(step) {
    switch (step.action) {
        case "notify":
            await sendAlert(step.recipient, step.message);
            break;
        case "lockdown":
            await initiateLockdown(step.target);
            break;
        case "collectLogs":
            await collectIncidentLogs(step.target);
            break;
        case "triggerAirGap":
            await airGapManager.activateAirGap(step.target);
            break;
        case "validateBiometric":
            const isAuthenticated = await biometricAuthenticator.authenticateUser(step.userId);
            if (!isAuthenticated) throw new Error(`Biometric validation failed for user: ${step.userId}`);
            break;
        case "customCommand":
            await executeCustomCommand(step.command);
            break;
        default:
            logError(`Unknown action: ${step.action}`);
    }
}

/**
 * Initiates a system lockdown.
 * @param {string} target - The system or node to lock down.
 * @returns {Promise<void>}
 */
async function initiateLockdown(target) {
    logInfo(`Initiating lockdown on target: ${target}`);
    // Lockdown logic would go here
}

/**
 * Collects logs from a specified target.
 * @param {string} target - The target system or module for log collection.
 * @returns {Promise<void>}
 */
async function collectIncidentLogs(target) {
    logInfo(`Collecting logs for target: ${target}`);
    // Log collection logic would go here
}

/**
 * Executes a custom command as part of the playbook.
 * @param {string} command - The command to execute.
 * @returns {Promise<void>}
 */
async function executeCustomCommand(command) {
    logInfo(`Executing custom command: ${command}`);
    // Command execution logic would go here
}

/**
 * Logs the execution of a playbook.
 * @param {string} playbookName - The name of the executed playbook.
 * @param {Array<Object>} steps - The steps taken during execution.
 * @returns {Promise<void>}
 */
async function logPlaybookExecution(playbookName, steps) {
    const logFilePath = path.join(INCIDENT_LOG_DIR, `${playbookName}_${Date.now()}.json`);

    try {
        await fs.ensureDir(INCIDENT_LOG_DIR);
        const logEntry = {
            timestamp: new Date().toISOString(),
            playbookName,
            steps,
        };

        await fs.writeJson(logFilePath, logEntry, { spaces: 2 });
        logInfo(`Playbook execution logged: ${logFilePath}`);
    } catch (error) {
        logError(`Failed to log playbook execution: ${playbookName}`, { error: error.message });
    }
}

module.exports = {
    loadPlaybook,
    executePlaybook,
};

// ------------------------------------------------------------------------------
// End of Module: Incident Playbook Manager
// Version: 2.0.0 | Updated: 2024-11-27
// Change Log: Added support for triggers from airGapManager.js and biometricAuthenticator.js.
// ------------------------------------------------------------------------------