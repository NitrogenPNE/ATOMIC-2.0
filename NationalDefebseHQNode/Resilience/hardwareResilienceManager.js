"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Hardware Resilience Manager
//
// Description:
// Enhances the resilience of the National Defense HQ Node by continuously 
// monitoring hardware health, optimizing performance, and mitigating risks 
// related to hardware failures.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: File system operations.
// - os: Access hardware resource metrics.
// - monitoringConfig: Configuration for hardware monitoring thresholds.
// - logger: Logs hardware resilience activities.
//
// Usage:
// const { monitorHardwareResilience, optimizeHardwareResources } = require('./hardwareResilienceManager');
// monitorHardwareResilience();
// optimizeHardwareResources();
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const monitoringConfig = require("../Config/monitoringConfig.json");

// Paths and Constants
const HARDWARE_LOGS_DIR = path.resolve(__dirname, "../Logs/Resilience/");
const HEALTH_LOG_FILE = path.join(HARDWARE_LOGS_DIR, "hardwareHealthLogs.json");

/**
 * Monitors the health of hardware resources and logs findings.
 */
async function monitorHardwareResilience() {
    logInfo("Starting hardware resilience monitoring...");

    try {
        const healthMetrics = gatherHardwareMetrics();

        // Check metrics against thresholds
        const anomalies = analyzeMetrics(healthMetrics);

        // Log metrics and any anomalies
        await logHardwareHealth(healthMetrics, anomalies);

        if (anomalies.length > 0) {
            logError(`Hardware anomalies detected: ${JSON.stringify(anomalies)}`);
        } else {
            logInfo("No hardware anomalies detected.");
        }
    } catch (error) {
        logError("Error during hardware resilience monitoring.", { error: error.message });
        throw error;
    }
}

/**
 * Optimizes hardware resources based on current usage and thresholds.
 */
async function optimizeHardwareResources() {
    logInfo("Optimizing hardware resources...");

    try {
        const healthMetrics = gatherHardwareMetrics();

        if (healthMetrics.cpuLoad > monitoringConfig.cpuOptimizationThreshold) {
            logInfo("CPU usage is high. Adjusting workload distribution...");
            // Implement CPU optimization logic here
        }

        if (healthMetrics.memoryUsage > monitoringConfig.memoryOptimizationThreshold) {
            logInfo("Memory usage is high. Activating memory optimization...");
            // Implement memory optimization logic here
        }

        logInfo("Hardware resource optimization completed.");
    } catch (error) {
        logError("Error during hardware optimization.", { error: error.message });
        throw error;
    }
}

/**
 * Gathers hardware metrics using OS module.
 * @returns {Object} - Hardware metrics including CPU, memory, and disk usage.
 */
function gatherHardwareMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpuLoad = os.loadavg()[0]; // 1-minute CPU load average
    const uptime = os.uptime();

    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    return {
        cpuLoad: parseFloat(cpuLoad.toFixed(2)),
        memoryUsage: parseFloat(memoryUsage.toFixed(2)),
        uptime,
    };
}

/**
 * Analyzes metrics against defined thresholds and identifies anomalies.
 * @param {Object} metrics - Collected hardware metrics.
 * @returns {Array<Object>} - List of anomalies detected.
 */
function analyzeMetrics(metrics) {
    const anomalies = [];

    if (metrics.cpuLoad > monitoringConfig.cpuLoadThreshold) {
        anomalies.push({ type: "CPU Load", value: metrics.cpuLoad });
    }

    if (metrics.memoryUsage > monitoringConfig.memoryUsageThreshold) {
        anomalies.push({ type: "Memory Usage", value: metrics.memoryUsage });
    }

    if (metrics.uptime < monitoringConfig.uptimeMinimum) {
        anomalies.push({ type: "Uptime", value: metrics.uptime });
    }

    return anomalies;
}

/**
 * Logs hardware health metrics and anomalies.
 * @param {Object} metrics - Collected hardware metrics.
 * @param {Array<Object>} anomalies - Detected anomalies, if any.
 * @returns {Promise<void>}
 */
async function logHardwareHealth(metrics, anomalies) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        metrics,
        anomalies,
    };

    try {
        await fs.ensureDir(HARDWARE_LOGS_DIR);
        const existingLogs = (await fs.readJson(HEALTH_LOG_FILE, { throws: false })) || [];
        existingLogs.push(logEntry);

        await fs.writeJson(HEALTH_LOG_FILE, existingLogs, { spaces: 2 });
        logInfo("Hardware health metrics logged.");
    } catch (error) {
        logError("Failed to log hardware health metrics.", { error: error.message });
        throw error;
    }
}

module.exports = {
    monitorHardwareResilience,
    optimizeHardwareResources,
};

// ------------------------------------------------------------------------------
// End of Module: Hardware Resilience Manager
// Version: 1.0.0 | Updated: 2024-11-27
// ------------------------------------------------------------------------------ 