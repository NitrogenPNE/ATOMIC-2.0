"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Monitoring Tools (Enhanced)
//
// Description:
// This module provides real-time monitoring and diagnostics for NIKI's AI models 
// and infrastructure. It tracks performance metrics, resource usage, and error 
// logs, ensuring optimal operation within the ATOMIC ecosystem.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - os: For system resource monitoring.
// - perf_hooks: For tracking performance metrics.
// - fs-extra: For logging and exporting diagnostic data.
//
// Features:
// - Monitors CPU, memory, and GPU usage.
// - Tracks AI model performance metrics (latency, throughput, accuracy).
// - Logs real-time data and generates diagnostic reports.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const os = require("os"); // System monitoring
const { performance, PerformanceObserver } = require("perf_hooks"); // Performance tracking
const fs = require("fs-extra"); // File system utilities
const path = require("path"); // Path management

// **Default Monitoring Logs Directory**
const LOG_DIR = path.join(__dirname, "../Logs/Monitoring");

/**
 * Initialize monitoring logs directory.
 */
async function initializeLogs() {
    await fs.ensureDir(LOG_DIR);
    console.log(`Monitoring logs directory initialized at: ${LOG_DIR}`);
}

/**
 * Get system resource usage (CPU, memory, and network).
 * @returns {Object} - Real-time system resource metrics.
 */
function getSystemUsage() {
    const memoryUsage = process.memoryUsage();
    const cpuLoad = os.loadavg();
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const cpuCount = os.cpus().length;

    return {
        memory: {
            rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + " MB",
            heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
            heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
        },
        cpu: {
            load: cpuLoad.map((load) => load.toFixed(2)),
            cores: cpuCount,
        },
        memoryFree: (freeMemory / 1024 / 1024).toFixed(2) + " MB",
        memoryTotal: (totalMemory / 1024 / 1024).toFixed(2) + " MB",
    };
}

/**
 * Monitor AI model performance during runtime.
 * @param {Function} monitoredFunction - The AI model function to monitor.
 * @returns {Object} - Performance metrics, including latency and execution time.
 */
async function monitorPerformance(monitoredFunction, ...args) {
    const start = performance.now();
    const result = await monitoredFunction(...args);
    const end = performance.now();

    const latency = (end - start).toFixed(2) + " ms";
    console.log(`Function executed in: ${latency}`);

    return { latency, result };
}

/**
 * Log performance metrics to a file.
 * @param {string} modelName - Name of the AI model.
 * @param {Object} metrics - Performance metrics to log.
 */
async function logPerformanceMetrics(modelName, metrics) {
    const logFile = path.join(LOG_DIR, `${modelName}_performance.json`);
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, ...metrics };

    await fs.appendFile(logFile, JSON.stringify(logEntry, null, 2) + ",\n");
    console.log(`Performance metrics logged for model: ${modelName}`);
}

/**
 * Monitor GPU usage (if available).
 * @returns {Object} - GPU usage metrics (placeholder for future GPU support).
 */
function getGPUUsage() {
    console.log("GPU monitoring not implemented yet.");
    // Placeholder: Replace with actual GPU monitoring logic (e.g., NVIDIA SMI integration)
    return { status: "Not implemented", usage: null };
}

/**
 * Generate a real-time diagnostic report.
 * @param {string} reportName - Name of the diagnostic report.
 * @returns {Promise<void>} - Generates a JSON report in the logs directory.
 */
async function generateDiagnosticReport(reportName = "diagnosticReport") {
    const systemUsage = getSystemUsage();
    const gpuUsage = getGPUUsage();

    const report = {
        timestamp: new Date().toISOString(),
        systemUsage,
        gpuUsage,
    };

    const reportFile = path.join(LOG_DIR, `${reportName}.json`);
    await fs.writeJson(reportFile, report, { spaces: 2 });
    console.log(`Diagnostic report generated: ${reportFile}`);
}

/**
 * Start monitoring real-time performance using performance hooks.
 */
function startRealTimeMonitoring() {
    const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
            console.log(`[Real-Time Monitoring] ${entry.name}: ${entry.duration.toFixed(2)} ms`);
        });
    });

    obs.observe({ entryTypes: ["function"] });
    console.log("Real-time monitoring started.");
}

module.exports = {
    initializeLogs,
    getSystemUsage,
    monitorPerformance,
    logPerformanceMetrics,
    generateDiagnosticReport,
    startRealTimeMonitoring,
};