"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2024 ATOMIC, Ltd.
 *
 * Module: Corporate Activity Monitor
 *
 * Description:
 * This module monitors corporate node activities, including user interactions,
 * data access events, and system performance metrics. It provides real-time
 * activity tracking, anomaly detection, and event summaries for operational oversight.
 *
 * Features:
 * - Monitors system metrics and node health.
 * - Tracks user actions and data access logs.
 * - Supports alert integration for abnormal activity.
 * - Provides summarized reports for corporate decision-making.
 *
 * Author: Shawn Blackmore
 * ------------------------------------------------------------------------------
 */

const os = require("os");
const { logAuditEvent, logError } = require("./auditLogger");

// ** Default Settings **
const MONITOR_INTERVAL_MS = 60000; // Monitor interval in milliseconds
const ACTIVITY_LOG_FILE = "C:/ATOMIC 2.0/CorporateHQNode/Logs/activity.log";

// Performance Metrics Storage
let activityMetrics = [];

/**
 * Monitor system performance metrics.
 */
function monitorSystemPerformance() {
    const memoryUsage = process.memoryUsage();
    const cpuLoad = os.loadavg();

    const metrics = {
        timestamp: new Date().toISOString(),
        memory: {
            total: os.totalmem(),
            free: os.freemem(),
            usage: memoryUsage.rss
        },
        cpu: {
            load1: cpuLoad[0],
            load5: cpuLoad[1],
            load15: cpuLoad[2]
        }
    };

    activityMetrics.push(metrics);
    logAuditEvent("SYSTEM_PERFORMANCE", metrics);
    console.log("System performance metrics captured:", metrics);
}

/**
 * Monitor user interactions and actions.
 * @param {string} userId - The user performing the action.
 * @param {string} action - The action performed by the user.
 * @param {Object} details - Additional details about the action.
 */
function monitorUserActivity(userId, action, details = {}) {
    const activity = {
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
    };

    logAuditEvent("USER_ACTIVITY", activity);
    console.log("User activity logged:", activity);
}

/**
 * Detect and handle anomalies in corporate activity.
 */
function detectAnomalies() {
    try {
        const recentMetrics = activityMetrics.slice(-10); // Analyze the last 10 records
        const anomalyDetected = recentMetrics.some((metric) => metric.memory.usage > metric.memory.total * 0.9);

        if (anomalyDetected) {
            logError("ANOMALY_DETECTED", {
                message: "High memory usage detected in recent metrics.",
                recentMetrics
            });
            console.warn("Anomaly detected: High memory usage.");
        }
    } catch (error) {
        logError("ANOMALY_DETECTION_ERROR", { error: error.message });
    }
}

/**
 * Generate a summary report of corporate activities.
 * @returns {Object} - A summary report of activities.
 */
function generateActivityReport() {
    const report = {
        timestamp: new Date().toISOString(),
        totalActivities: activityMetrics.length,
        recentActivities: activityMetrics.slice(-10)
    };

    console.log("Activity Report Generated:", report);
    return report;
}

/**
 * Start the corporate activity monitor.
 */
function startMonitor() {
    console.log("Starting Corporate Activity Monitor...");
    setInterval(() => {
        monitorSystemPerformance();
        detectAnomalies();
    }, MONITOR_INTERVAL_MS);
}

// Exported Functions
module.exports = {
    monitorSystemPerformance,
    monitorUserActivity,
    detectAnomalies,
    generateActivityReport,
    startMonitor
};

// Example usage (Uncomment for testing)
// startMonitor();
// monitorUserActivity("user123", "LOGIN", { ip: "192.168.1.100" });
// monitorUserActivity("user123", "ACCESS_SHARD", { shardId: "shard-001" });
