"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * ------------------------------------------------------------------------------
 * Module: Shard Integrity Checker
 *
 * Description:
 * Ensures the integrity and authenticity of shards within the replication system.
 * Validates shard structure, checks for tampering, and ensures compliance with 
 * corporate policies.
 *
 * Features:
 * - Tamper detection using cryptographic hashes.
 * - Shard metadata validation.
 * - Frequency-based shard access verification.
 * ------------------------------------------------------------------------------
 */

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const logger = require("../utils/logger"); // Custom logging utility
const { validateShardMetadata, validateShardStructure } = require("../utils/validationUtils");

// Paths
const SHARD_STORAGE_PATH = path.resolve("./data/shards");
const INTEGRITY_REPORT_PATH = path.resolve("./logs/integrityReports");

// Configuration
const HASH_ALGORITHM = "SHA3-256"; // Tamper-detection hashing algorithm

/**
 * Compute the cryptographic hash of a shard.
 * @param {Buffer} shardData - The binary data of the shard.
 * @returns {string} - The computed hash.
 */
function computeShardHash(shardData) {
    return crypto.createHash(HASH_ALGORITHM).update(shardData).digest("hex");
}

/**
 * Validate the integrity of a single shard.
 * @param {string} shardId - The ID of the shard to validate.
 * @returns {boolean} - True if the shard is valid, false otherwise.
 */
async function validateShardIntegrity(shardId) {
    try {
        const shardPath = path.join(SHARD_STORAGE_PATH, `${shardId}.shard`);
        const metadataPath = path.join(SHARD_STORAGE_PATH, `${shardId}.json`);

        // Ensure shard and metadata files exist
        if (!(await fs.pathExists(shardPath)) || !(await fs.pathExists(metadataPath))) {
            logger.error(`Shard or metadata missing for ID: ${shardId}`);
            return false;
        }

        // Read shard and metadata
        const shardData = await fs.readFile(shardPath);
        const metadata = await fs.readJson(metadataPath);

        // Validate shard structure
        if (!validateShardStructure(metadata)) {
            logger.warn(`Invalid structure for shard: ${shardId}`);
            return false;
        }

        // Compute and compare hash
        const computedHash = computeShardHash(shardData);
        if (computedHash !== metadata.hash) {
            logger.warn(`Tamper detected for shard: ${shardId}`);
            return false;
        }

        logger.info(`Shard integrity validated: ${shardId}`);
        return true;
    } catch (error) {
        logger.error(`Error validating shard integrity: ${error.message}`);
        return false;
    }
}

/**
 * Perform integrity checks on all shards.
 */
async function performShardIntegrityCheck() {
    try {
        logger.info("Starting shard integrity check...");

        const shardFiles = await fs.readdir(SHARD_STORAGE_PATH);
        const shardIds = shardFiles
            .filter((file) => file.endsWith(".json"))
            .map((file) => file.replace(".json", ""));

        const integrityResults = {};

        for (const shardId of shardIds) {
            const isValid = await validateShardIntegrity(shardId);
            integrityResults[shardId] = isValid ? "Valid" : "Tampered";
        }

        // Save integrity report
        const reportPath = path.join(INTEGRITY_REPORT_PATH, `integrityReport_${Date.now()}.json`);
        await fs.ensureDir(INTEGRITY_REPORT_PATH);
        await fs.writeJson(reportPath, integrityResults, { spaces: 2 });

        logger.info(`Shard integrity check complete. Report saved to: ${reportPath}`);
    } catch (error) {
        logger.error(`Error during shard integrity check: ${error.message}`);
    }
}

module.exports = {
    validateShardIntegrity,
    performShardIntegrityCheck,
};
