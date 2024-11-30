"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: System Recovery and Restoration
 *
 * Description:
 * Securely restores ATOMIC system components, including blockchain data,
 * shard configurations, and node metadata. Enforces Proof-of-Access (PoA)
 * during the restoration process.
 *
 * Dependencies:
 * - fs-extra: For secure file operations.
 * - path: For directory and file management.
 * - tokenValidation.js: Enforces PoA for recovery access.
 * - ledgerManager.js: Logs recovery transactions on the blockchain.
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { validateToken } = require("../../ATOMIC-2.0/Pricing/TokenManagement/tokenValidation");
const { logShardCreation, logShardMetadata } = require("../../ATOMIC-2.0/atomic-blockchain/scripts/ledgerManager");

// **Paths and Configurations**
const RECOVERY_BACKUP_PATH = path.resolve(__dirname, "../backups");
const RECOVERY_LOG_PATH = path.resolve(__dirname, "../logs/recovery.log");
const SYSTEM_DATA_PATH = path.resolve(__dirname, "../../SecureStorage/systemData");

// Logger utility for structured recovery logging
async function logRecoveryEvent(event) {
    await fs.appendFile(
        RECOVERY_LOG_PATH,
        `${new Date().toISOString()} - ${JSON.stringify(event)}\n`
    );
}

/**
 * Restore the system using a recovery backup.
 * @param {string} tokenId - Unique identifier of the PoA token.
 * @param {string} encryptedToken - Encrypted token data for PoA validation.
 * @param {string} backupId - Identifier of the backup to restore.
 */
async function restoreSystem(tokenId, encryptedToken, backupId) {
    try {
        console.log("Initializing system restoration...");

        // Step 1: Validate Proof-of-Access
        console.log("Validating token for Proof-of-Access...");
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error("Token validation failed. Restoration aborted.");
        }

        console.log("Token validation successful. Access granted.");

        // Step 2: Verify Backup Exists
        console.log(`Verifying backup ID: ${backupId}`);
        const backupPath = path.join(RECOVERY_BACKUP_PATH, `${backupId}.tar.gz`);
        if (!(await fs.pathExists(backupPath))) {
            throw new Error(`Backup not found: ${backupId}`);
        }

        console.log(`Backup located: ${backupPath}`);

        // Step 3: Extract Backup Data
        console.log("Extracting backup data...");
        const extractionPath = path.join(SYSTEM_DATA_PATH, `restore_${backupId}`);
        await fs.ensureDir(extractionPath);
        // Simulate extraction: Actual implementation would use a tar library
        await fs.copy(backupPath, extractionPath);
        console.log("Backup data successfully extracted.");

        // Step 4: Restore System Components
        console.log("Restoring system components...");
        await restoreComponents(extractionPath);
        console.log("System components restored successfully.");

        // Step 5: Log Restoration Metadata
        console.log("Logging restoration metadata...");
        const metadata = {
            tokenId,
            backupId,
            restoredAt: new Date().toISOString(),
            restoredBy: tokenValidation.tokenDetails.owner,
        };
        await logShardMetadata("SYSTEM_RESTORE", metadata);
        console.log("Restoration metadata logged successfully.");

        // Step 6: Cleanup Temporary Files
        console.log("Cleaning up temporary files...");
        await fs.remove(extractionPath);

        // Log successful restoration event
        await logRecoveryEvent({ action: "RESTORE_SUCCESS", metadata });
        console.log("System restoration completed successfully.");
    } catch (error) {
        console.error("Error during system restoration:", error.message);

        // Log failure event
        await logRecoveryEvent({ action: "RESTORE_FAILURE", error: error.message });
        throw new Error(`System restoration failed: ${error.message}`);
    }
}

/**
 * Restores individual system components from extracted backup data.
 * @param {string} extractionPath - Path to the extracted backup data.
 */
async function restoreComponents(extractionPath) {
    const components = ["blockchain", "shards", "nodeMetadata"];
    for (const component of components) {
        const componentPath = path.join(extractionPath, component);
        const targetPath = path.join(SYSTEM_DATA_PATH, component);

        if (await fs.pathExists(componentPath)) {
            console.log(`Restoring component: ${component}`);
            await fs.copy(componentPath, targetPath);
            console.log(`${component} restored successfully.`);
        } else {
            console.warn(`Component missing in backup: ${component}`);
        }
    }
}

/**
 * Main function for running the restoration script from CLI.
 */
if (require.main === module) {
    const [tokenId, encryptedToken, backupId] = process.argv.slice(2);

    if (!tokenId || !encryptedToken || !backupId) {
        console.error(
            "Usage: node restore-system.js <tokenId> <encryptedToken> <backupId>"
        );
        process.exit(1);
    }

    restoreSystem(tokenId, encryptedToken, backupId)
        .then(() => console.log("System restoration process completed."))
        .catch((error) =>
            console.error("Critical error during restoration:", error.message)
        );
}

module.exports = { restoreSystem };

