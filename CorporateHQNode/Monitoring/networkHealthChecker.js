"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Network Health Checker
//
// Description:
// This script monitors the health of the corporate network by performing periodic
// checks on the connectivity, peer responsiveness, and data transfer efficiency.
// It generates alerts for anomalies and logs health metrics for audit purposes.
//
// Author: Corporate HQ Node Development Team
// ------------------------------------------------------------------------------

const os = require("os");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Configuration
const LOG_FILE = path.join(__dirname, "../Logs/networkHealth.log");
const CHECK_INTERVAL_MS = 60000; // Check every 60 seconds
const PEER_NODES = [
    "http://corporatenode1.internal:4001",
    "http://corporatenode2.internal:4002",
    "http://corporatenode3.internal:4003"
];

// Logger utility
function logMessage(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
    console.log(logEntry.trim());
}

// Network Health Checker
async function checkNetworkHealth() {
    logMessage("info", "Starting network health check...");

    try {
        for (const peer of PEER_NODES) {
            try {
                const response = await axios.get(`${peer}/health`);
                if (response.status === 200 && response.data.status === "OK") {
                    logMessage("info", `Peer ${peer} is healthy. Uptime: ${response.data.uptime} seconds.`);
                } else {
                    logMessage("warning", `Peer ${peer} responded with a non-OK status.`);
                }
            } catch (error) {
                logMessage("error", `Failed to connect to peer ${peer}: ${error.message}`);
            }
        }

        const systemLoad = os.loadavg();
        logMessage("info", `System Load Averages - 1min: ${systemLoad[0].toFixed(2)}, 5min: ${systemLoad[1].toFixed(2)}, 15min: ${systemLoad[2].toFixed(2)}`);
    } catch (error) {
        logMessage("error", `An error occurred during network health check: ${error.message}`);
    }

    logMessage("info", "Network health check completed.");
}

// Periodic Checker
setInterval(checkNetworkHealth, CHECK_INTERVAL_MS);

// Initial run
checkNetworkHealth();
