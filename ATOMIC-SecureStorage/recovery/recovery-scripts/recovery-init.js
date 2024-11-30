"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Recovery Initialization
 *
 * Description:
 * This script initiates the recovery process for ATOMIC's secure storage system,
 * enforcing Proof-of-Access (PoA) and logging all recovery operations for auditing.
 *
 * Enhancements:
 * - Enforce token validation during recovery.
 * - Include cryptographic checks for recovery metadata.
 * - Generate detailed logs for recovery operations.
 *
 * Dependencies:
 * - fs-extra: For file management.
 * - quantumCryptoUtils.js: For cryptographic operations.
 * - ledgerManager.js: Logs recovery operations to the blockchain ledger.
 * - validationUtils.js: Validates recovery requests and metadata.
 *
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { decryptAtomic, validateToken } = require("../../ATOMIC-2.0/atomic-blockchain/utils/quantumCryptoUtils");
const { logRecoveryOperation } = require("../../ATOMIC-2.0/atomic-blockchain/scripts/ledgerManager");
const { validateSchema } = require("../../ATOMIC-2.0/atomic-blockchain/utils/validationUtils");

// **Paths and Configuration**
const RECOVERY_LOG_PATH = path.resolve(__dirname, "../../Logs/recoveryOperations.log");
const RECOVERY_TEMP_PATH = path.resolve(__dirname, "../../Temp/Recovery");
const RECOVERY_CONFIG_PATH = path.resolve(__dirname, "../../Config/recoveryConfig.json");

/**
 * Initialize the recovery process.
 * @param {string} recoveryToken - Token for Proof-of-Access.
 * @param {string} encryptedRecoveryKey - Encrypted recovery key.
 * @param {Object} metadata - Recovery metadata.
 * @returns {Promise<Object>} - Details of the recovery process.
 */
async function initializeRecovery(recoveryToken, encryptedRecoveryKey, metadata) {
    try {
        console.log("Initializing recovery process...");

        // Step 1: Validate recovery metadata
        console.log("Validating recovery metadata...");
        const schema = {
            recoveryId: "string",
            requestorId: "string",
            timestamp: "string",
            recoveryType: "string",
        };
        if (!validateSchema(metadata, schema)) {
            throw new Error("Invalid recovery metadata schema.");
        }

        // Step 2: Validate recovery token (Proof-of-Access)
        console.log("Validating recovery token...");
        const tokenValidation = await validateToken(recoveryToken, encryptedRecoveryKey);
        if (!tokenValidation.valid) {
            throw new Error("Invalid recovery token: Access denied.");
        }

        // Step 3: Prepare recovery environment
        console.log("Preparing recovery environment...");
        await fs.ensureDir(RECOVERY_TEMP_PATH);

        const recoveryDetails = {
            recoveryId: metadata.recoveryId,
            requestorId: metadata.requestorId,
            timestamp: new Date().toISOString(),
            status: "Initialized",
        };

        console.log("Logging recovery operation...");
        await logRecoveryOperation("INIT", recoveryDetails);

        // Step 4: Save recovery configuration for later steps
        console.log("Saving recovery configuration...");
        await fs.writeJson(RECOVERY_CONFIG_PATH, recoveryDetails, { spaces: 2 });

        console.log("Recovery process initialized successfully.");
        return recoveryDetails;
    } catch (error) {
        console.error("Error during recovery initialization:", error.message);
        throw error;
    }
}

/**
 * Retrieve recovery logs for auditing purposes.
 * @returns {Promise<Array>} - List of recovery log entries.
 */
async function getRecoveryLogs() {
    try {
        console.log("Retrieving recovery logs...");
        const logs = await fs.readJson(RECOVERY_LOG_PATH);
        return logs;
    } catch (error) {
        console.error("Error retrieving recovery logs:", error.message);
        return [];
    }
}

// **Main Execution**
if (require.main === module) {
    const [recoveryToken, encryptedRecoveryKey, recoveryMetadata] = process.argv.slice(2);

    if (!recoveryToken || !encryptedRecoveryKey || !recoveryMetadata) {
        console.error("Usage: node recovery-init.js <recoveryToken> <encryptedRecoveryKey> <recoveryMetadata>");
        process.exit(1);
    }

    initializeRecovery(recoveryToken, encryptedRecoveryKey, JSON.parse(recoveryMetadata))
        .then((details) => console.log("Recovery Initialized:", details))
        .catch((error) => console.error("Critical error during recovery initialization:", error.message));
}

module.exports = {
    initializeRecovery,
    getRecoveryLogs,
};
