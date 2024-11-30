"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Node Health Monitor
//
// Description:
// Monitors the health and operational status of nodes within the National Defense 
// HQ Node's network. Provides real-time metrics, logs anomalies, and triggers 
// alerts for critical issues.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For writing logs and maintaining node health records.
// - path: For managing paths to logs and status files.
// - activityAuditLogger: Logs health monitoring events.
// - alertsConfig: Sends alerts for node anomalies.
//
// Usage:
// const { monitorNodeHealth } = require('./nodeHealthMonitor');
// monitorNodeHealth().then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const alertsConfig = require("../Monitoring/alertsConfig.json");

// Paths
const NODE_HEALTH_LOG = path.resolve(__dirname, "../../Logs/Infrastructure/nodeHealthLogs.json");
const NODE_STATUS_DIR = path.resolve(__dirname, "../../NodeStatus/");
const ALERTS_LOG_FILE = path.resolve(__dirname, "../../Logs/Infrastructure/nodeAlerts.json");

// Constants
const HEALTH_CHECK_INTERVAL_MS = 60 * 1000; // 1-minute intervals for health checks
const CRITICAL_THRESHOLD = 80; // % threshold for critical CPU/Memory usage

/**
 * Monitors the health of all nodes in the network.
 * @returns {Promise<void>}
 */
async function monitorNodeHealth() {
    logInfo("Starting node health monitoring...");

    try {
        // Ensure necessary directories and files exist
        await fs.ensureFile(NODE_HEALTH_LOG);
        await fs.ensureDir(NODE_STATUS_DIR);

        const nodeStatuses = await getNodeStatuses();
        const anomalies = [];

        for (const node of nodeStatuses) {
            const { nodeId, cpuUsage, memoryUsage, lastSeen } = node;

            logInfo(`Checking health of node: ${nodeId}`);

            if (!isNodeHealthy(cpuUsage, memoryUsage, lastSeen)) {
                const anomaly = { nodeId, cpuUsage, memoryUsage, lastSeen, timestamp: new Date().toISOString() };
                anomalies.push(anomaly);
                await handleNodeAnomaly(anomaly);
            }
        }

        logHealthStatus(nodeStatuses, anomalies);
        logInfo("Node health monitoring completed.");
    } catch (error) {
        logError("Error during node health monitoring.", { error: error.message });
        throw error;
    }
}

/**
 * Retrieves the statuses of all monitored nodes.
 * @returns {Promise<Array<Object>>} - List of node status objects.
 */
async function getNodeStatuses() {
    const statusFiles = await fs.readdir(NODE_STATUS_DIR);
    const statuses = [];

    for (const file of statusFiles) {
        const filePath = path.join(NODE_STATUS_DIR, file);
        const status = await fs.readJson(filePath, { throws: false });

        if (status) {
            statuses.push(status);
        } else {
            logError(`Failed to read status file: ${file}`);
        }
    }

    return statuses;
}

/**
 * Determines if a node is healthy based on usage and activity.
 * @param {number} cpuUsage - CPU usage percentage.
 * @param {number} memoryUsage - Memory usage percentage.
 * @param {string} lastSeen - ISO timestamp of the last activity.
 * @returns {boolean} - Whether the node is healthy.
 */
function isNodeHealthy(cpuUsage, memoryUsage, lastSeen) {
    const now = Date.now();
    const lastSeenTime = new Date(lastSeen).getTime();
    const inactiveDurationMs = now - lastSeenTime;

    return (
        cpuUsage < CRITICAL_THRESHOLD &&
        memoryUsage < CRITICAL_THRESHOLD &&
        inactiveDurationMs < HEALTH_CHECK_INTERVAL_MS * 3 // Allow up to 3 missed intervals
    );
}

/**
 * Handles anomalies detected in node health.
 * @param {Object} anomaly - The anomaly object containing node details.
 */
async function handleNodeAnomaly(anomaly) {
    const { nodeId, cpuUsage, memoryUsage, lastSeen, timestamp } = anomaly;

    // Log the anomaly
    const anomalyLog = {
        nodeId,
        cpuUsage,
        memoryUsage,
        lastSeen,
        status: "Critical",
        timestamp,
    };
    await appendToAnomalyLog(anomalyLog);

    // Dispatch an alert
    const alertMessage = `Node ${nodeId} is experiencing critical issues. CPU: ${cpuUsage}%, Memory: ${memoryUsage}%.`;
    await dispatchAlert("InfrastructureTeam", alertMessage, timestamp);

    logError(`Critical anomaly detected for node: ${nodeId}`);
}

/**
 * Appends anomaly details to the anomaly log file.
 * @param {Object} anomalyLog - The anomaly log entry.
 */
async function appendToAnomalyLog(anomalyLog) {
    await fs.ensureFile(ALERTS_LOG_FILE);
    const logs = (await fs.readJson(ALERTS_LOG_FILE, { throws: false })) || [];
    logs.push(anomalyLog);

    await fs.writeJson(ALERTS_LOG_FILE, logs, { spaces: 2 });
    logInfo(`Anomaly logged for node: ${anomalyLog.nodeId}`);
}

/**
 * Dispatches an alert for node anomalies.
 * @param {string} recipient - Recipient of the alert (e.g., "InfrastructureTeam").
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

/**
 * Logs the current health status and anomalies.
 * @param {Array<Object>} statuses - List of all node statuses.
 * @param {Array<Object>} anomalies - List of detected anomalies.
 */
async function logHealthStatus(statuses, anomalies) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        statuses,
        anomalies,
    };

    const healthLogs = (await fs.readJson(NODE_HEALTH_LOG, { throws: false })) || [];
    healthLogs.push(logEntry);

    await fs.writeJson(NODE_HEALTH_LOG, healthLogs, { spaces: 2 });
    logInfo("Node health status logged.");
}

module.exports = {
    monitorNodeHealth,
};

// ------------------------------------------------------------------------------
// End of Module: Node Health Monitor
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for monitoring node health.
// ------------------------------------------------------------------------------
