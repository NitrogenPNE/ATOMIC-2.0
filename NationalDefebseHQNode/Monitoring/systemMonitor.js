"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: System Monitor
//
// Description:
// Provides real-time monitoring of system-level metrics for the National Defense 
// HQ Node. Tracks CPU, memory, disk usage, and network performance to ensure 
// optimal operation and detect potential issues. Integrated with honeypot monitoring 
// and behavioral anomaly detection for enhanced system resilience.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const anomalyDetector = require("./behavioralAnomalyDetector");
const honeypotManager = require("./honeypotManager");
const satelliteCommIntegration = require("../Communication/satelliteCommIntegration");

// Paths
const systemLogsPath = path.resolve(__dirname, "../Logs/Monitoring/systemLogs.json");
const anomalyLogsPath = path.resolve(__dirname, "../Logs/Monitoring/anomalyLogs.json");
const honeypotLogsPath = path.resolve(__dirname, "../Logs/Monitoring/honeypotLogs.json");

// Monitoring Config
const monitoringIntervalMs = 10000; // 10 seconds

/**
 * Collects system performance metrics.
 * @returns {Object} - An object containing system metrics.
 */
function collectSystemMetrics() {
    const uptime = os.uptime();
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsage = ((1 - freeMemory / totalMemory) * 100).toFixed(2);
    const loadAverage = os.loadavg(); // [1-min, 5-min, 15-min averages]
    const cpuUsage = getCpuUsage();

    return {
        timestamp: new Date().toISOString(),
        uptime,
        memoryUsage: `${memoryUsage}%`,
        freeMemory: `${(freeMemory / (1024 ** 3)).toFixed(2)} GB`,
        totalMemory: `${(totalMemory / (1024 ** 3)).toFixed(2)} GB`,
        loadAverage,
        cpuUsage,
    };
}

/**
 * Calculates CPU usage percentage.
 * @returns {string} - CPU usage percentage.
 */
function getCpuUsage() {
    const cpus = os.cpus();
    const cpuLoad = cpus.map((cpu) => {
        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
        const idle = cpu.times.idle;
        return ((1 - idle / total) * 100).toFixed(2);
    });

    const averageLoad = cpuLoad.reduce((acc, load) => acc + parseFloat(load), 0) / cpuLoad.length;
    return `${averageLoad.toFixed(2)}%`;
}

/**
 * Logs system metrics to the monitoring logs file.
 * @param {Object} metrics - System metrics object to log.
 */
async function logSystemMetrics(metrics) {
    try {
        await fs.ensureFile(systemLogsPath);

        const existingLogs = (await fs.readJson(systemLogsPath, { throws: false })) || { logs: [] };
        existingLogs.logs.push(metrics);

        await fs.writeJson(systemLogsPath, existingLogs, { spaces: 2 });
        console.log(`[SystemMonitor] Metrics logged at ${metrics.timestamp}.`);
    } catch (error) {
        console.error(`[SystemMonitor] Failed to log metrics: ${error.message}`);
    }
}

/**
 * Integrates with the anomaly detection system to monitor and log anomalies.
 * @param {Object} metrics - System metrics.
 */
async function monitorAnomalies(metrics) {
    try {
        const anomalies = await anomalyDetector.detectAnomalies(metrics);

        if (anomalies.length > 0) {
            console.log(`[SystemMonitor] Anomalies detected: ${JSON.stringify(anomalies)}`);
            await fs.appendFile(
                anomalyLogsPath,
                JSON.stringify({ timestamp: metrics.timestamp, anomalies }) + "\n"
            );
        }
    } catch (error) {
        console.error(`[SystemMonitor] Failed to monitor anomalies: ${error.message}`);
    }
}

/**
 * Checks honeypot activity and logs findings.
 */
async function monitorHoneypot() {
    try {
        const honeypotData = await honeypotManager.checkHoneypots();
        if (honeypotData.alerts.length > 0) {
            console.log(`[SystemMonitor] Honeypot alerts detected.`);
            await fs.appendFile(
                honeypotLogsPath,
                JSON.stringify({ timestamp: new Date().toISOString(), honeypotData }) + "\n"
            );
        }
    } catch (error) {
        console.error(`[SystemMonitor] Failed to monitor honeypots: ${error.message}`);
    }
}

/**
 * Sends critical metrics to the satellite communication subsystem for redundancy.
 * @param {Object} metrics - System metrics.
 */
async function sendMetricsToSatellite(metrics) {
    try {
        await satelliteCommIntegration.transmitMetrics(metrics);
        console.log(`[SystemMonitor] Metrics transmitted to satellite communication system.`);
    } catch (error) {
        console.error(`[SystemMonitor] Failed to transmit metrics to satellite: ${error.message}`);
    }
}

/**
 * Performs continuous system monitoring and logging.
 */
async function monitorSystem() {
    console.log(`[SystemMonitor] Starting system monitoring every ${monitoringIntervalMs / 1000}s...`);
    setInterval(async () => {
        const metrics = collectSystemMetrics();

        console.log(`[SystemMonitor] Collected metrics:`, metrics);

        await logSystemMetrics(metrics);
        await monitorAnomalies(metrics);
        await monitorHoneypot();
        await sendMetricsToSatellite(metrics);
    }, monitoringIntervalMs);
}

// Start system monitoring on initialization
monitorSystem();

module.exports = {
    collectSystemMetrics,
    logSystemMetrics,
    monitorSystem,
    monitorAnomalies,
    monitorHoneypot,
    sendMetricsToSatellite,
};