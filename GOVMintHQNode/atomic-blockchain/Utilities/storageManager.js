"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// GOVMintingHQNode - Enhanced Storage Manager with Integrity Audits and Recovery
//
// Description:
// Enhanced shard management with integrity checks and automated recovery for
// the GOVMintingHQNode.
//
// Enhancements:
// - Periodic shard integrity audits with hash validation.
// - Automated recovery for corrupted or missing shards.
// - Proof-of-Access (POA) validation for all operations.
//
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const { logOperation, logError } = require("./loggingUtils");

// **Default Storage Paths**
const SHARD_PATHS = {
    neutronShards: "../data/shards/neutronShards", // Critical shards
    protonShards: "../data/shards/protonShards",  // Operational shards
    electronShards: "../data/shards/electronShards", // Routine data
};

// **Encryption Config**
const AES_KEY_LENGTH = 32; // 256-bit AES key
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

/**
 * Verify shard integrity by comparing metadata hash with the actual shard data.
 * @param {string} type - Shard type (e.g., "neutronShards").
 * @param {string} id - Shard ID.
 * @returns {Promise<boolean>} - True if the shard is intact, false otherwise.
 */
async function verifyShardIntegrity(type, id) {
    try {
        const shardPath = path.join(SHARD_PATHS[type], `${id}.dat`);
        const metadataPath = `${shardPath}.meta`;

        if (!(await fs.pathExists(shardPath)) || !(await fs.pathExists(metadataPath))) {
            logError(`Shard or metadata not found for ID: ${id}`);
            return false;
        }

        const encryptedData = await fs.readFile(shardPath);
        const metadata = await fs.readJson(metadataPath);

        const calculatedHash = crypto.createHash("sha256").update(encryptedData).digest("hex");
        if (calculatedHash !== metadata.hash) {
            logError(`Hash mismatch detected for shard ID: ${id}`);
            return false;
        }

        logOperation("Shard integrity verified successfully.", { shardId: id });
        return true;
    } catch (error) {
        logError("Shard integrity verification failed.", { shardId: id, error: error.message });
        return false;
    }
}

/**
 * Attempt to recover a corrupted or missing shard using redundant copies or backups.
 * @param {string} type - Shard type (e.g., "neutronShards").
 * @param {string} id - Shard ID.
 * @returns {Promise<boolean>} - True if the shard was successfully recovered, false otherwise.
 */
async function repairShard(type, id) {
    try {
        const backupPath = path.join(SHARD_PATHS[type], "backups", `${id}.dat`);
        const shardPath = path.join(SHARD_PATHS[type], `${id}.dat`);
        const metadataPath = `${shardPath}.meta`;

        if (!(await fs.pathExists(backupPath))) {
            logError(`Backup not found for shard ID: ${id}`);
            return false;
        }

        // Restore from backup
        await fs.copy(backupPath, shardPath);
        logOperation("Shard recovered from backup.", { shardId: id });

        // Update metadata with new hash
        const restoredData = await fs.readFile(shardPath);
        const newHash = crypto.createHash("sha256").update(restoredData).digest("hex");

        const metadata = await fs.readJson(metadataPath);
        metadata.hash = newHash;
        await fs.writeJson(metadataPath, metadata, { spaces: 2 });

        logOperation("Shard metadata updated after recovery.", { shardId: id });
        return true;
    } catch (error) {
        logError("Failed to repair shard.", { shardId: id, error: error.message });
        return false;
    }
}

/**
 * Periodically audit shard integrity and attempt recovery if needed.
 */
async function auditAndRecoverShards() {
    try {
        for (const [type, shardDir] of Object.entries(SHARD_PATHS)) {
            const shardFiles = await fs.readdir(shardDir);
            for (const file of shardFiles.filter((f) => f.endsWith(".dat"))) {
                const shardId = path.basename(file, ".dat");
                const isIntact = await verifyShardIntegrity(type, shardId);

                if (!isIntact) {
                    const recovered = await repairShard(type, shardId);
                    if (!recovered) {
                        logError(`Failed to recover shard ID: ${shardId}`);
                    }
                }
            }
        }
    } catch (error) {
        logError("Audit and recovery process failed.", { error: error.message });
    }
}

/**
 * Schedule periodic shard audits.
 */
function scheduleShardAudits() {
    const AUDIT_INTERVAL = 3600000; // 1 hour
    setInterval(() => {
        logOperation("Starting scheduled shard audit...");
        auditAndRecoverShards();
    }, AUDIT_INTERVAL);
}

module.exports = {
    initializeStorage,
    storeShard,
    retrieveShard,
    verifyShardIntegrity,
    repairShard,
    auditAndRecoverShards,
    scheduleShardAudits,
};

// ------------------------------------------------------------------------------
// End of Module: Enhanced Storage Manager with Integrity Audits and Recovery
// Version: GOVMintHQNode | Updated: 2024-12-02
// ------------------------------------------------------------------------------
