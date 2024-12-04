"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Central Logger
 *
 * Description:
 * Aggregates logs from all scripts and forwards them to a centralized logging
 * node within the ATOMIC internal network.
 *
 * Author: ATOMIC Development Team
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const axios = require("axios");

// Internal Node Address for Logging
const LOGGING_NODE_ADDRESS = "node://central-logging-node.internal/logs";

// Paths
const LOG_STORAGE_PATH = path.resolve(__dirname, "../Logs/centralizedLogs.json");

// Create logger
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: LOG_STORAGE_PATH }),
        new winston.transports.Console(),
    ],
});

/**
 * Sends a log entry to the centralized logging node.
 * @param {Object} logEntry - Log data to send.
 * @returns {Promise<void>}
 */
async function forwardLogToCentralNode(logEntry) {
    try {
        const response = await axios.post(LOGGING_NODE_ADDRESS, logEntry, {
            headers: { "Content-Type": "application/json" },
        });

        if (response.status === 200) {
            console.log("Log successfully forwarded to the central logging node.");
        } else {
            console.warn(
                `Failed to forward log. Status: ${response.status}, Response: ${response.data}`
            );
        }
    } catch (error) {
        console.error("Error forwarding log to central logging node:", error.message);
        // Store locally if sending fails
        appendLogToLocalStorage(logEntry);
    }
}

/**
 * Appends a log entry to the local storage in case of failures.
 * @param {Object} logEntry - Log data to store locally.
 */
async function appendLogToLocalStorage(logEntry) {
    try {
        const logs = (await fs.pathExists(LOG_STORAGE_PATH))
            ? await fs.readJson(LOG_STORAGE_PATH)
            : { logs: [] };

        logs.logs.push(logEntry);
        await fs.writeJson(LOG_STORAGE_PATH, logs, { spaces: 2 });

        console.log("Log appended to local storage.");
    } catch (error) {
        console.error("Error appending log to local storage:", error.message);
    }
}

/**
 * Log a message and forward it to the centralized node.
 * @param {string} level - Log level (e.g., "info", "error").
 * @param {string} message - Log message.
 * @param {Object} [metadata] - Additional log metadata.
 */
function log(level, message, metadata = {}) {
    const logEntry = { level, message, metadata, timestamp: new Date().toISOString() };
    logger.log(level, message, metadata);

    // Forward the log entry to the centralized node
    forwardLogToCentralNode(logEntry);
}

module.exports = {
    log,
};

// ------------------------------------------------------------------------------
// End of Module: Central Logger
// Version: 1.0.0 | Updated: 2024-12-03
// ------------------------------------------------------------------------------

