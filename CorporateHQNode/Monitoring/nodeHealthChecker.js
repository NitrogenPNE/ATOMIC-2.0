"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Node Health Checker
//
// Description:
// Monitors the health of individual nodes in the corporate infrastructure. This
// includes checks for resource utilization, responsiveness, and synchronization
// status. Logs results and alerts on anomalies for proactive system maintenance.
//
// Author: Corporate HQ Node Development Team
// ------------------------------------------------------------------------------

const os = require("os");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Configuration
const LOG_FILE = path.join(__dirname, "../Logs/nodeHealth.log");
const CHECK_INTERVAL_MS = 60000; // Check every 60 seconds
const LOCAL_NODE_ENDPOINT = "http://localhost:4001/health"; // Modify if necessary

// Logger utility
function logMessage(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
    console.log(logEntry.trim());
}

// Node Health Checker
async function checkNodeHealth() {
    logMessage("info", "Starting node health check...");

    try {
        // Query node health endpoint
        const response = await axios.get(LOCAL_NODE_ENDPOINT);
        if (response.status === 200 && response.data.status === "OK") {
            logMessage("info", `Node is healthy. Uptime: ${response.data.uptime} seconds.`);
        } else {
            logMessage("warning", `Node responded with a non-OK status: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        logMessage("error", `Failed to check node health: ${error.message}`);
    }

    // System Resource Check
    const memoryUsage = process.memoryUsage();
    const cpuLoad = os.loadavg();
    const freeMemory = os.freemem() / (1024 * 1024); // Convert to MB
    const totalMemory = os.totalmem() / (1024 * 1024); // Convert to MB
    const memoryUsagePercentage = ((1 - freeMemory / totalMemory) * 100).toFixed(2);

    logMessage("info", `System Resource Usage - Memory: ${memoryUsagePercentage}% used, CPU Load (1min): ${cpuLoad[0].toFixed(2)}`);

    if (memoryUsagePercentage > 80) {
        logMessage("warning", "High memory usage detected!");
    }
}

setInterval(checkNodeHealth, CHECK_INTERVAL_MS);

// Initial run
checkNodeHealth();
