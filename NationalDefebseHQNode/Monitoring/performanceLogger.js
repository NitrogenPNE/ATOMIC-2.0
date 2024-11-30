"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Performance Logger
//
// Description:
// Monitors and logs system performance metrics, including CPU load, memory usage,
// and network activity. Designed to maintain operational efficiency and preemptively
// detect performance bottlenecks for the National Defense HQ Node.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const os = require("os");
const fs = require("fs-extra");
const path = require("path");

// Paths
const logsPath = path.resolve(__dirname, "monitoringLogs.json");

// **Logger Function**
async function logPerformanceMetrics() {
    const timestamp = new Date().toISOString();

    // Collect system metrics
    const cpuLoad = os.loadavg()[0]; // 1-minute CPU load average
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsage = ((1 - freeMemory / totalMemory) * 100).toFixed(2);
    const uptime = os.uptime();

    const performanceMetrics = {
        timestamp,
        cpuLoad,
        memoryUsagePercentage: `${memoryUsage}%`,
        systemUptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        freeMemory: `${(freeMemory / 1e6).toFixed(2)} MB`,
        totalMemory: `${(totalMemory / 1e6).toFixed(2)} MB`,
    };

    // Log metrics to file
    try {
        await fs.ensureFile(logsPath);

        const existingLogs = (await fs.readJson(logsPath, { throws: false })) || { logs: [] };
        existingLogs.logs.push({ level: "INFO", message: "Performance Metrics Logged", metrics: performanceMetrics });

        await fs.writeJson(logsPath, existingLogs, { spaces: 2 });
        console.log(`[PerformanceLogger] Metrics logged successfully at ${timestamp}`);
    } catch (error) {
        console.error(`[PerformanceLogger] Failed to log metrics: ${error.message}`);
    }
}

// **Monitor Metrics at Intervals**
function startPerformanceMonitoring(intervalMs = 60000) {
    console.log(`[PerformanceLogger] Starting performance monitoring at ${intervalMs / 1000}s intervals...`);
    setInterval(logPerformanceMetrics, intervalMs);
}

// Start monitoring immediately
startPerformanceMonitoring();

module.exports = {
    logPerformanceMetrics,
    startPerformanceMonitoring,
};
