"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Cyber Threat Detection
//
// Description:
// Detects and logs potential cyber threats within the National Defense HQ Node's
// network. Monitors incoming transactions, block validations, and network traffic
// for malicious patterns or anomalies.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For logging threat detection events.
// - path: For managing logs directory.
// - lodash: For data pattern matching.
// - monitoringConfig: Contains thresholds and detection settings.
// - activityAuditLogger: Logs detection activities.
//
// Usage:
// const { detectCyberThreat } = require('./cyberThreatDetection');
// detectCyberThreat(activity).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const _ = require("lodash");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const monitoringConfig = require("../Config/monitoringConfig.json");

// Paths
const THREAT_LOG_DIR = path.resolve(__dirname, "../../../Logs/ThreatDetection/");

/**
 * Monitors and detects potential cyber threats.
 * @param {Object} activity - The activity or event to analyze.
 * @returns {Promise<void>}
 */
async function detectCyberThreat(activity) {
    logInfo(`Analyzing activity for potential cyber threats: ${activity.type}`);

    try {
        // Validate input
        if (!activity || typeof activity !== "object" || !activity.type) {
            throw new Error("Invalid activity data provided.");
        }

        // Step 1: Analyze activity against configured threat patterns
        const threatPatterns = monitoringConfig.threatPatterns || [];
        const detectedThreats = threatPatterns.filter((pattern) =>
            matchThreatPattern(activity, pattern)
        );

        if (detectedThreats.length > 0) {
            logThreat(activity, detectedThreats);
        } else {
            logInfo(`No threats detected in activity: ${activity.type}`);
        }
    } catch (error) {
        logError(`Error during cyber threat detection: ${error.message}`);
        throw error;
    }
}

/**
 * Matches an activity against a given threat pattern.
 * @param {Object} activity - The activity to analyze.
 * @param {Object} pattern - The threat pattern to check against.
 * @returns {boolean} - Whether the activity matches the pattern.
 */
function matchThreatPattern(activity, pattern) {
    return _.isMatch(activity, pattern.criteria);
}

/**
 * Logs detected threats to the threat detection log.
 * @param {Object} activity - The activity that triggered the detection.
 * @param {Array<Object>} threats - The detected threats.
 */
async function logThreat(activity, threats) {
    const logFilePath = path.join(THREAT_LOG_DIR, "cyberThreats.json");

    try {
        await fs.ensureDir(THREAT_LOG_DIR);

        // Prepare log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            activity,
            threats,
        };

        // Append to log file
        const existingLogs = (await fs.readJson(logFilePath, { throws: false })) || [];
        existingLogs.push(logEntry);
        await fs.writeJson(logFilePath, existingLogs, { spaces: 2 });

        logInfo(`Threat detected and logged: ${JSON.stringify(logEntry)}`);
    } catch (error) {
        logError(`Failed to log threat detection: ${error.message}`);
    }
}

module.exports = {
    detectCyberThreat,
};
