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
 * Handles the secure and consistent logging of token transactions.
 * Transactions are stored in a structured log file for auditability.
 *
 * Dependencies:
 * - fs: File system operations.
 * - path: Path management.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");

// Directory and log file paths
const logDirPath = path.resolve(__dirname, "../Logs");
const logFilePath = path.resolve(logDirPath, "tokenTransactions.log");

/**
 * Ensure the log directory exists, and create it if necessary.
 */
function ensureLogDirectoryExists() {
    if (!fs.existsSync(logDirPath)) {
        fs.mkdirSync(logDirPath, { recursive: true });
        console.log(`Created log directory: ${logDirPath}`);
    }
}

/**
 * Log a token transaction to the log file, including the serial number.
 * @param {Object} transactionDetails - The details of the transaction to log.
 */
async function logTokenTransaction(transactionDetails) {
    try {
        // Ensure the log directory exists
        ensureLogDirectoryExists();

        // Prepare the log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            transactionType: transactionDetails.type || "UNKNOWN",
            tokenId: transactionDetails.tokenId || "N/A",
            issuingNode: transactionDetails.issuingNode || {},
            metadata: transactionDetails.metadata || {},
        };

        // Convert to string and write to the log file
        const logEntryString = JSON.stringify(logEntry, null, 2) + ",\n";
        fs.appendFileSync(logFilePath, logEntryString, "utf8");
        console.log("Transaction logged successfully:", logEntry);
    } catch (error) {
        console.error("Error logging transaction:", error.message);
        throw error; // Rethrow to handle upstream
    }
}

module.exports = { logTokenTransaction };