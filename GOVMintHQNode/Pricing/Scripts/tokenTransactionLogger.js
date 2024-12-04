"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Token Transaction Logger
 *
 * Description:
 * Handles the logging of all token-related activities, including minting,
 * redemption, Proof-of-Access validations, shard usage, node validations,
 * and block-related operations.
 *
 * Dependencies:
 * - fs-extra: For managing transaction logs.
 * - path: For directory management.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");

// Paths
const LOGS_DIRECTORY = path.resolve(__dirname, "../Logs");
const TOKEN_TRANSACTION_LOG = path.join(LOGS_DIRECTORY, "tokenTransactions.log");

/**
 * Ensure the logs directory and file exist.
 */
async function ensureLogFile() {
    await fs.ensureDir(LOGS_DIRECTORY);
    if (!(await fs.pathExists(TOKEN_TRANSACTION_LOG))) {
        await fs.writeJson(TOKEN_TRANSACTION_LOG, [], { spaces: 2 });
    }
}

/**
 * Validate the transaction details before logging.
 * @param {Object} transactionDetails - Details of the token transaction.
 */
function validateTransactionDetails(transactionDetails) {
    if (!transactionDetails || typeof transactionDetails !== "object") {
        throw new Error("Invalid transaction details: must be an object.");
    }
    if (!transactionDetails.type) {
        throw new Error("Transaction type is required.");
    }
    if (!transactionDetails.tokenId) {
        throw new Error("Transaction tokenId is required.");
    }
    if (!transactionDetails.metadata) {
        transactionDetails.metadata = {}; // Default to an empty object
    }

    // Ensure serial number is included for tracking
    if (!transactionDetails.metadata.serialNumber) {
        throw new Error("Transaction metadata must include a valid serial number.");
    }
}

/**
 * Log a token transaction with Proof-of-Access metadata.
 * @param {Object} transactionDetails - Details of the token transaction.
 * @param {string} transactionDetails.type - Type of transaction (e.g., "MINT", "REDEEM", "VALIDATION").
 * @param {string} transactionDetails.tokenId - The ID of the token involved.
 * @param {Object} [transactionDetails.metadata] - Additional metadata (e.g., node, shard, or operation details).
 */
async function logTokenTransaction(transactionDetails) {
    try {
        validateTransactionDetails(transactionDetails);

        await ensureLogFile();

        const timestamp = new Date().toISOString();
        const logEntry = {
            ...transactionDetails,
            timestamp,
        };

        console.log(`Logging transaction:`, logEntry); // Debugging

        // Read existing logs, append new entry, and write back
        const logs = await fs.readJson(TOKEN_TRANSACTION_LOG);
        logs.push(logEntry);
        await fs.writeJson(TOKEN_TRANSACTION_LOG, logs, { spaces: 2 });

        console.log(`Token transaction logged: ${transactionDetails.type} for Token ID: ${transactionDetails.tokenId}`);
    } catch (error) {
        console.error("Error logging token transaction:", error.message);
        throw error;
    }
}

/**
 * Retrieve token transaction logs with optional filters.
 * @param {Object} [filter] - Optional filter criteria (e.g., type, tokenId, or serialNumber).
 * @returns {Array} - Filtered array of token transaction logs.
 */
async function getTransactionLogs(filter = {}) {
    try {
        await ensureLogFile();
        const logs = await fs.readJson(TOKEN_TRANSACTION_LOG);

        if (Object.keys(filter).length === 0) {
            return logs; // Return all logs if no filter is applied
        }

        // Apply filters
        return logs.filter((log) =>
            Object.entries(filter).every(([key, value]) => log[key] === value || log.metadata[key] === value)
        );
    } catch (error) {
        console.error("Error retrieving token transaction logs:", error.message);
        throw error;
    }
}

// Example Usage if called directly
if (require.main === module) {
    const sampleTransaction = {
        type: "MINT",
        tokenId: "sample-token-id",
        metadata: {
            mintedBy: "HQNode-001",
            operation: "initial-mint",
            serialNumber: "PLNGP00WBGQ0R2", // Example serial number
        },
    };

    logTokenTransaction(sampleTransaction)
        .then(() => console.log("Sample transaction logged successfully."))
        .catch((error) => console.error("Failed to log sample transaction:", error.message));

    getTransactionLogs({ type: "MINT", serialNumber: "PLNGP00WBGQ0R2" })
        .then((logs) => console.log("Filtered Logs:", logs))
        .catch((error) => console.error("Failed to retrieve logs:", error.message));
}

module.exports = { logTokenTransaction, getTransactionLogs };
