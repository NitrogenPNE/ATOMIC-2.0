"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Shard Integrity Validator
//
// Description:
// Validates the integrity and consistency of shards within the National Defense 
// HQ Node. Ensures shards meet redundancy, security, and tamper-resistance standards.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For hashing and verification.
// - fs-extra: For file system operations.
// - path: For resolving shard paths.
// - activityAuditLogger: Logs validation results and anomalies.
//
// Usage:
// const { validateShardIntegrity } = require('./shardIntegrityValidator');
// validateShardIntegrity(shardId).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Paths and Constants
const SHARD_STORAGE_DIR = path.resolve(__dirname, "../../../ShardManager/Storage/");
const HASH_SUFFIX = ".hash";

/**
 * Validates the integrity of a shard.
 * @param {string} shardId - Unique identifier for the shard.
 * @returns {Promise<boolean>} - True if the shard is valid; otherwise false.
 */
async function validateShardIntegrity(shardId) {
    logInfo(`Starting integrity validation for shard: ${shardId}`);

    try {
        const shardPath = path.join(SHARD_STORAGE_DIR, `${shardId}.json`);
        const hashPath = path.join(SHARD_STORAGE_DIR, `${shardId}${HASH_SUFFIX}`);

        // Ensure shard and hash files exist
        if (!(await fs.pathExists(shardPath)) || !(await fs.pathExists(hashPath))) {
            logError(`Shard or hash file missing for shard: ${shardId}`);
            return false;
        }

        // Load shard data and hash
        const shardData = await fs.readFile(shardPath, "utf8");
        const storedHash = await fs.readFile(hashPath, "utf8");

        // Compute current hash of the shard
        const currentHash = crypto.createHash("sha256").update(shardData).digest("hex");

        if (currentHash !== storedHash) {
            logError(`Hash mismatch detected for shard: ${shardId}`);
            return false;
        }

        logInfo(`Shard integrity validated successfully for shard: ${shardId}`);
        return true;
    } catch (error) {
        logError(`Error during shard validation: ${error.message}`);
        throw error;
    }
}

/**
 * Generates a hash for a shard and stores it securely.
 * @param {string} shardId - Unique identifier for the shard.
 * @returns {Promise<void>}
 */
async function generateShardHash(shardId) {
    logInfo(`Generating hash for shard: ${shardId}`);

    try {
        const shardPath = path.join(SHARD_STORAGE_DIR, `${shardId}.json`);
        const hashPath = path.join(SHARD_STORAGE_DIR, `${shardId}${HASH_SUFFIX}`);

        if (!(await fs.pathExists(shardPath))) {
            throw new Error(`Shard file does not exist: ${shardPath}`);
        }

        // Load shard data and generate hash
        const shardData = await fs.readFile(shardPath, "utf8");
        const hash = crypto.createHash("sha256").update(shardData).digest("hex");

        // Save the hash to a file
        await fs.writeFile(hashPath, hash);
        logInfo(`Hash generated and stored for shard: ${shardId}`);
    } catch (error) {
        logError(`Failed to generate hash for shard: ${shardId}`, { error: error.message });
        throw error;
    }
}

module.exports = {
    validateShardIntegrity,
    generateShardHash,
};

// ------------------------------------------------------------------------------
// End of Module: Shard Integrity Validator
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for shard integrity validation.
// ------------------------------------------------------------------------------