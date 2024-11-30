"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Blockchain Logger
//
// Description:
// Handles logging for subscription activities, node connections, and blockchain
// interactions within the HQNode. Ensures secure and consistent logging for auditing 
// and compliance purposes.
//
// Dependencies:
// - winston: For structured logging with log rotation.
// - path: For managing log file paths.
// - fs-extra: For ensuring the logging directory exists.
//
// Usage:
// const { logSubscriptionEvent, logConnectionEvent, logBlockchainInteraction } = require('./blockchainLogger');
// logSubscriptionEvent('CorporateNode', 'subscribed', { nodeId: 'CORP-NODE-123', status: 'active' });
// logBlockchainInteraction('BlockAdded', { blockId: '00001ABCD', miner: 'Supernode-01' });
// ------------------------------------------------------------------------------

const winston = require("winston");
const path = require("path");
const fs = require("fs-extra");

// **Log Directory and Configuration**
const LOG_DIR = path.resolve(__dirname, "../../Logs/Subscriptions");
const LOG_FILE = path.join(LOG_DIR, "blockchainLogger.log");

// Ensure the log directory exists
(async () => {
    try {
        await fs.ensureDir(LOG_DIR);
    } catch (error) {
        console.error("Failed to initialize log directory:", error.message);
    }
})();

// Create Winston Logger
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: LOG_FILE }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""
                        }`;
                })
            ),
        }),
    ],
});

// **Log Subscription Event**
/**
 * Logs subscription-related events for Corporate and National Defense nodes.
 * @param {string} nodeType - Type of the node (e.g., Corporate, National Defense).
 * @param {string} event - Event type (e.g., subscribed, unsubscribed).
 * @param {Object} details - Additional event details (e.g., nodeId, status).
 */
function logSubscriptionEvent(nodeType, event, details) {
    logger.info(`Subscription Event: ${event} for ${nodeType}`, details);
}

/**
 * Logs connection-related events for nodes interacting with the HQNode.
 * @param {string} eventType - Type of the connection event (e.g., connected, disconnected).
 * @param {Object} details - Connection details (e.g., nodeId, IP address).
 */
function logConnectionEvent(eventType, details) {
    logger.info(`Connection Event: ${eventType}`, details);
}

/**
 * Logs blockchain interactions, such as block creation, validation, or syncing.
 * @param {string} action - The blockchain action (e.g., BlockAdded, Synced).
 * @param {Object} details - Details about the blockchain interaction (e.g., blockId, miner).
 */
function logBlockchainInteraction(action, details) {
    logger.info(`Blockchain Interaction: ${action}`, details);
}

module.exports = {
    logSubscriptionEvent,
    logConnectionEvent,
    logBlockchainInteraction,
};