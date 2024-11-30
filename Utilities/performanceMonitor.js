"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Performance Monitor
//
// Description:
// This module monitors system performance metrics (CPU, memory, disk, GPU) and logs 
// them for analysis. It ensures the ATOMIC HQ Node operates within optimal resource 
// usage thresholds.
//
// Features:
// - Tracks CPU usage, memory usage, disk I/O, and GPU availability.
// - Logs performance metrics at regular intervals.
// - Triggers alerts if resource usage exceeds thresholds.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// Governed by Canadian law and the Province of British Columbia.
//
// Dependencies:
// - os: For CPU and memory metrics.
// - fs: For disk and logging operations.
// - child_process: For GPU checks using `nvidia-smi`.
//
// Contact:
// Email: licensing@atomic.ca | Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const logger = require("C:\\ATOMIC 2.0\\Utilities\\logger.js");

// Configuration
const MONITOR_INTERVAL = 10 * 1000; // Monitor every 10 seconds
const LOG_FILE = path.join("C:\\ATOMIC 2.0\\Logs", "performanceMonitor.log");
const PERFORMANCE_METRICS_FILE = path.join("C:\\ATOMIC 2.0\\Logs", "performanceMetrics.json");

// Resource thresholds (adjust as necessary)
const THRESHOLDS = {
    cpuUsage: 85, // Percentage
    memoryUsage: 90, // Percentage
    diskUsage: 90, // Percentage
};

// Get average CPU load
function getCPULoad() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;

    cpus.forEach((cpu) => {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;

    return ((1 - idle / total) * 100).toFixed(2);
}

// Get memory usage
function getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return ((usedMemory / totalMemory) * 100).toFixed(2);
}

// Get disk usage
function getDiskUsage(drive = "C:") {
    try {
        const { stdout } = execSync(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace`, { encoding: "utf8" });
        const lines = stdout.trim().split("\n");
        const [freeSpace, totalSpace] = lines[1].split(/\s+/).map(Number);

        const usedSpace = totalSpace - freeSpace;
        return ((usedSpace / totalSpace) * 100).toFixed(2);
    } catch (error) {
        logger.warn(`Failed to fetch disk usage for ${drive}: ${error.message}`);
        return "N/A";
    }
}

// Check GPU availability
function checkGPU() {
    try {
        const gpuOutput = execSync("nvidia-smi -L", { encoding: "utf8" });
        return gpuOutput.trim().split("\n").length; // Number of GPUs detected
    } catch {
        return 0; // No GPU detected
    }
}

// Monitor and log system performance
function monitorPerformance() {
    const metrics = {
        timestamp: new Date().toISOString(),
        cpuUsage: getCPULoad(),
        memoryUsage: getMemoryUsage(),
        diskUsage: getDiskUsage(),
        gpuCount: checkGPU(),
    };

    // Log metrics
    logger.info(`Performance Metrics: ${JSON.stringify(metrics)}`, LOG_FILE);

    // Save metrics to JSON file
    try {
        fs.writeFileSync(PERFORMANCE_METRICS_FILE, JSON.stringify(metrics, null, 4), "utf8");
    } catch (error) {
        logger.error(`Failed to write performance metrics to file: ${error.message}`);
    }

    // Trigger alerts if thresholds are exceeded
    if (metrics.cpuUsage > THRESHOLDS.cpuUsage) {
        logger.warn(`High CPU usage detected: ${metrics.cpuUsage}%`);
    }
    if (metrics.memoryUsage > THRESHOLDS.memoryUsage) {
        logger.warn(`High memory usage detected: ${metrics.memoryUsage}%`);
    }
    if (metrics.diskUsage > THRESHOLDS.diskUsage) {
        logger.warn(`High disk usage detected: ${metrics.diskUsage}%`);
    }
    if (metrics.gpuCount === 0) {
        logger.warn("No GPU detected. Ensure GPU resources are available.");
    }
}

// Schedule performance monitoring
function startPerformanceMonitoring() {
    logger.info("Starting performance monitoring...");
    setInterval(monitorPerformance, MONITOR_INTERVAL);
}

// Run monitor if executed directly
if (require.main === module) {
    startPerformanceMonitoring();
}

module.exports = { monitorPerformance, startPerformanceMonitoring };

// ------------------------------------------------------------------------------
// End of Performance Monitor Module
// Version: 1.0.0 | Updated: 2024-11-26
// ------------------------------------------------------------------------------
