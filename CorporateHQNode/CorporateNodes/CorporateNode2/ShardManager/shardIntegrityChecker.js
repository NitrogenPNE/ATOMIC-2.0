"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Shard Integrity Checker
 *
 * Description:
 * Validates shard integrity across Corporate Node 2. Ensures data consistency,
 * redundancy, and adherence to the replication policy.
 * -------------------------------------------------------------------------
 */

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const { getShardMetadata, validateShardReplication } = require("./shardValidationUtils");

// Directory where shard data is stored
const SHARD_STORAGE_PATH = path.resolve(__dirname, "../Shards");

/**
 * Compute a hash for a given file to verify data integrity.
 * @param {string} filePath - Path to the shard file.
 * @returns {string} - SHA-256 hash of the file.
 */
async function computeFileHash(filePath) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        return crypto.createHash("sha256").update(fileBuffer).digest("hex");
    } catch (error) {
        console.error(`Error computing hash for file ${filePath}:`, error.message);
        throw new Error("Hash computation failed.");
    }
}

/**
 * Validate shard integrity by comparing its metadata hash with the stored file hash.
 * @param {string} shardId - Unique ID of the shard.
 * @returns {boolean} - True if shard integrity is verified, false otherwise.
 */
async function validateShardIntegrity(shardId) {
    try {
        console.log(`Validating integrity for shard: ${shardId}`);
        const metadata = await getShardMetadata(shardId);
        const shardFilePath = path.join(SHARD_STORAGE_PATH, metadata.fileName);

        const fileHash = await computeFileHash(shardFilePath);
        if (fileHash !== metadata.expectedHash) {
            console.warn(`Shard integrity check failed for shard: ${shardId}`);
            return false;
        }

        console.log(`Shard integrity verified for shard: ${shardId}`);
        return true;
    } catch (error) {
        console.error(`Error during shard integrity validation for ${shardId}:`, error.message);
        return false;
    }
}

/**
 * Audit all shards in the system for integrity and replication compliance.
 */
async function auditShards() {
    try {
        console.log("Starting shard audit...");
        const shards = await fs.readdir(SHARD_STORAGE_PATH);

        for (const shardFile of shards) {
            const shardId = path.basename(shardFile, path.extname(shardFile));

            // Validate integrity
            const integrityVerified = await validateShardIntegrity(shardId);
            if (!integrityVerified) {
                console.warn(`Shard ${shardId} failed integrity validation.`);
                continue;
            }

            // Validate replication compliance
            const replicationValid = await validateShardReplication(shardId);
            if (!replicationValid) {
                console.warn(`Shard ${shardId} failed replication validation.`);
            } else {
                console.log(`Shard ${shardId} passed all checks.`);
            }
        }

        console.log("Shard audit completed.");
    } catch (error) {
        console.error("Error during shard audit:", error.message);
    }
}

/**
 * Entry point for the shard integrity checker module.
 */
(async () => {
    try {
        await auditShards();
    } catch (error) {
        console.error("Shard Integrity Checker failed:", error.message);
    }
})();

module.exports = {
    computeFileHash,
    validateShardIntegrity,
    auditShards,
};
