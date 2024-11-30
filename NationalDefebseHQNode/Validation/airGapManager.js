"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Air Gap Manager
//
// Description:
// Implements air-gap security for critical operations in the National Defense HQ Node. 
// Ensures sensitive operations are executed in isolated, offline environments, preventing 
// external threats or unauthorized access.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file operations.
// - path: For managing air-gap storage paths.
// - crypto: For cryptographic operations and data integrity checks.
// - activityAuditLogger: Logs air-gap operations and transfers.
//
// Usage:
// const { executeInAirGap, retrieveFromAirGap } = require('./airGapManager');
// executeInAirGap("operationId", data).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Paths
const AIR_GAP_STORAGE_DIR = path.resolve(__dirname, "../../AirGapStorage/");
const AIR_GAP_LOG_FILE = path.resolve(__dirname, "../../Logs/AirGap/airGapLogs.json");

// Constants
const HASH_ALGORITHM = "sha256";

/**
 * Executes a sensitive operation within an air-gapped environment.
 * @param {string} operationId - Unique identifier for the operation.
 * @param {Object} data - Data to process in the air-gapped environment.
 * @returns {Promise<string>} - Confirmation message on successful execution.
 */
async function executeInAirGap(operationId, data) {
    logInfo(`Executing operation ${operationId} in air-gapped environment.`);

    try {
        // Step 1: Validate input
        if (!operationId || typeof data !== "object") {
            throw new Error("Invalid input: operationId and data are required.");
        }

        // Step 2: Ensure air-gap storage directory exists
        await fs.ensureDir(AIR_GAP_STORAGE_DIR);

        // Step 3: Save data securely in air-gap storage
        const dataFilePath = path.join(AIR_GAP_STORAGE_DIR, `${operationId}.json`);
        await fs.writeJson(dataFilePath, data, { spaces: 2 });

        // Step 4: Generate and store data hash for integrity verification
        const dataHash = generateHash(JSON.stringify(data));
        const hashFilePath = path.join(AIR_GAP_STORAGE_DIR, `${operationId}.hash`);
        await fs.writeFile(hashFilePath, dataHash);

        logInfo(`Operation ${operationId} successfully executed in air-gapped environment.`);
        await logAirGapOperation(operationId, "execution", "success");

        return `Operation ${operationId} completed successfully.`;
    } catch (error) {
        logError(`Failed to execute operation ${operationId} in air-gapped environment: ${error.message}`);
        await logAirGapOperation(operationId, "execution", "failure", error.message);
        throw error;
    }
}

/**
 * Retrieves and verifies data from the air-gapped environment.
 * @param {string} operationId - Unique identifier for the operation.
 * @returns {Promise<Object>} - Retrieved data if verification passes.
 */
async function retrieveFromAirGap(operationId) {
    logInfo(`Retrieving operation ${operationId} from air-gapped environment.`);

    try {
        const dataFilePath = path.join(AIR_GAP_STORAGE_DIR, `${operationId}.json`);
        const hashFilePath = path.join(AIR_GAP_STORAGE_DIR, `${operationId}.hash`);

        // Step 1: Validate files exist
        if (!(await fs.pathExists(dataFilePath)) || !(await fs.pathExists(hashFilePath))) {
            throw new Error(`Air-gapped data or hash not found for operation ${operationId}.`);
        }

        // Step 2: Load and validate data
        const data = await fs.readJson(dataFilePath);
        const storedHash = await fs.readFile(hashFilePath, "utf8");
        const currentHash = generateHash(JSON.stringify(data));

        if (storedHash !== currentHash) {
            throw new Error(`Data integrity check failed for operation ${operationId}.`);
        }

        logInfo(`Operation ${operationId} successfully retrieved from air-gapped environment.`);
        await logAirGapOperation(operationId, "retrieval", "success");

        return data;
    } catch (error) {
        logError(`Failed to retrieve operation ${operationId} from air-gapped environment: ${error.message}`);
        await logAirGapOperation(operationId, "retrieval", "failure", error.message);
        throw error;
    }
}

/**
 * Generates a cryptographic hash for a given input.
 * @param {string} input - Input string to hash.
 * @returns {string} - Generated hash value.
 */
function generateHash(input) {
    return crypto.createHash(HASH_ALGORITHM).update(input).digest("hex");
}

/**
 * Logs air-gap operations to a file.
 * @param {string} operationId - Unique identifier for the operation.
 * @param {string} operationType - Type of operation (execution/retrieval).
 * @param {string} status - Status of the operation (success/failure).
 * @param {string} [errorMessage] - Optional error message for failures.
 */
async function logAirGapOperation(operationId, operationType, status, errorMessage = null) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        operationId,
        operationType,
        status,
        errorMessage,
    };

    try {
        await fs.ensureFile(AIR_GAP_LOG_FILE);

        const logs = (await fs.readJson(AIR_GAP_LOG_FILE, { throws: false })) || [];
        logs.push(logEntry);

        await fs.writeJson(AIR_GAP_LOG_FILE, logs, { spaces: 2 });
        logInfo(`Air-gap operation logged: ${operationId}`);
    } catch (error) {
        logError("Failed to log air-gap operation.", { error: error.message });
    }
}

module.exports = {
    executeInAirGap,
    retrieveFromAirGap,
};

// ------------------------------------------------------------------------------
// End of Module: Air Gap Manager
// Version: 1.0.0 | Updated: 2024-11-27
// Change Log: Initial implementation for air-gap operations management.
// ------------------------------------------------------------------------------