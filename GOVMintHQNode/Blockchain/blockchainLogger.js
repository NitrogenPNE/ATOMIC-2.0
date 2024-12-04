"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Blockchain Logger
 *
 * Description:
 * Centralized logging module for blockchain interactions across GOVMintHQNode.
 * Logs operations, errors, and events to a unified ledger, the blockchain, 
 * and external monitoring systems.
 *
 * Author: GOVMintHQNode Integration Team
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const blockchainNode = require(path.resolve(__dirname, "../../atomic-blockchain/core/blockchainNode.js"));

// Paths
const logFilePath = path.resolve(__dirname, "blockchainLogs.json");
const errorLogFilePath = path.resolve(__dirname, "blockchainErrors.log");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: errorLogFilePath, level: "error" }),
        new winston.transports.Console(),
    ],
});

/**
 * Logs a blockchain operation to the log file and blockchain.
 * @param {string} action - Action type (e.g., "TokenIssued", "ConsensusAchieved").
 * @param {Object} details - Additional details related to the action.
 * @returns {Promise<void>}
 */
async function logBlockchainInteraction(action, details) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            details,
        };

        // Append to blockchainLogs.json
        const logs = await loadLogs();
        logs.push(logEntry);
        await saveLogs(logs);

        // Log operation to the blockchain
        await blockchainNode.recordEventToBlockchain({
            event: action,
            details,
            timestamp: logEntry.timestamp,
        });

        logger.info(`Logged blockchain interaction: ${action}`, details);
    } catch (error) {
        logger.error(`Failed to log blockchain interaction: ${action}`, { error: error.message });
    }
}

/**
 * Logs an error related to blockchain operations.
 * @param {string} action - Action during which the error occurred.
 * @param {Object} details - Additional details including the error message.
 * @returns {void}
 */
function logError(action, details) {
    const errorEntry = {
        timestamp: new Date().toISOString(),
        action,
        details,
    };

    logger.error(`Blockchain error logged: ${action}`, details);

    // Optionally log errors to the blockchain
    blockchainNode.recordEventToBlockchain({
        event: "Error",
        details: { action, ...details },
        timestamp: errorEntry.timestamp,
    }).catch(err => {
        logger.error("Failed to log error to blockchain", { error: err.message });
    });
}

/**
 * Loads existing logs from disk.
 * @returns {Promise<Array>} - Array of log entries.
 */
async function loadLogs() {
    if (!(await fs.pathExists(logFilePath))) {
        return [];
    }
    return fs.readJson(logFilePath);
}

/**
 * Saves logs to disk.
 * @param {Array} logs - Array of log entries.
 * @returns {Promise<void>}
 */
async function saveLogs(logs) {
    await fs.writeJson(logFilePath, logs, { spaces: 2 });
    logger.info("Blockchain logs updated.");
}

module.exports = {
    logBlockchainInteraction,
    logError,
};
