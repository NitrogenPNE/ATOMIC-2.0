"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Supernode Surveillance
//
// Description:
// Monitors the activity, health, and security compliance of Supernodes within 
// the ATOMIC network. Designed to ensure the integrity and performance of 
// Supernode operations in the National Defense network.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const axios = require("axios");

// Paths
const surveillanceLogsPath = path.resolve(__dirname, "monitoringLogs.json");

// Configuration
const supernodeEndpoints = [
    { id: "Supernode-001", url: "http://192.168.1.100:4000/status" },
    { id: "Supernode-002", url: "http://192.168.1.101:4000/status" },
    { id: "Supernode-003", url: "http://192.168.1.102:4000/status" },
];
const monitoringIntervalMs = 15000; // 15 seconds

/**
 * Fetch and validate the status of a Supernode.
 * @param {Object} supernode - Supernode configuration (id and URL).
 * @returns {Promise<Object>} - Supernode health and activity status.
 */
async function monitorSupernode(supernode) {
    const timestamp = new Date().toISOString();
    try {
        const response = await axios.get(supernode.url);
        const status = response.data;

        if (!status || !status.health || !status.activity) {
            throw new Error("Incomplete or invalid status response.");
        }

        console.log(`[SupernodeSurveillance] Supernode ${supernode.id} is healthy.`);
        return { id: supernode.id, timestamp, status, error: null };
    } catch (error) {
        console.error(`[SupernodeSurveillance] Supernode ${supernode.id} failed health check: ${error.message}`);
        return { id: supernode.id, timestamp, status: null, error: error.message };
    }
}

/**
 * Log surveillance results to file.
 * @param {Array<Object>} results - Results of Supernode surveillance.
 */
async function logSurveillanceResults(results) {
    try {
        await fs.ensureFile(surveillanceLogsPath);

        const existingLogs = (await fs.readJson(surveillanceLogsPath, { throws: false })) || { logs: [] };
        existingLogs.logs.push({ timestamp: new Date().toISOString(), results });

        await fs.writeJson(surveillanceLogsPath, existingLogs, { spaces: 2 });
        console.log(`[SupernodeSurveillance] Surveillance results logged.`);
    } catch (error) {
        console.error(`[SupernodeSurveillance] Failed to log surveillance results: ${error.message}`);
    }
}

/**
 * Perform surveillance on all configured Supernodes.
 */
async function performSurveillance() {
    console.log(`[SupernodeSurveillance] Starting surveillance at ${new Date().toISOString()}...`);

    const results = await Promise.all(
        supernodeEndpoints.map(async (supernode) => monitorSupernode(supernode))
    );

    await logSurveillanceResults(results);
}

/**
 * Initialize continuous Supernode surveillance.
 */
function startSurveillance() {
    console.log(`[SupernodeSurveillance] Initializing Supernode surveillance every ${monitoringIntervalMs / 1000}s...`);
    setInterval(performSurveillance, monitoringIntervalMs);
}

// Start surveillance on script initialization
startSurveillance();

module.exports = {
    monitorSupernode,
    performSurveillance,
    startSurveillance,
};
