"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Shard Validator
//
// Description:
// Validates data shards for integrity, existence, and compliance with sharding
// policies. Ensures tamper detection and proper shard distribution across nodes.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For hash verification.
// - fs-extra: File system utilities for shard access.
// - loggingUtils.js: For logging validation results.
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const { logOperation, logError } = require("../../Logger/script/logger");

/**
 * Validates the integrity and compliance of a shard.
 * @param {string} shardPath - The file path of the shard to validate.
 * @param {string} expectedHash - The expected hash of the shard for integrity checks.
 * @returns {Promise<boolean>} - True if the shard is valid; false otherwise.
 */
async function validateShard(shardPath, expectedHash) {
    try {
        logOperation("Shard Validation", { shardPath });

        // Step 1: Check if the shard exists
        if (!(await fs.pathExists(shardPath))) {
            logError("Shard file does not exist.", { shardPath });
            return false;
        }

        // Step 2: Read shard data
        const shardData = await fs.readFile(shardPath);

        // Step 3: Calculate hash for integrity verification
        const calculatedHash = crypto.createHash("sha256").update(shardData).digest("hex");
        if (calculatedHash !== expectedHash) {
            logError("Shard hash mismatch.", {
                shardPath,
                expectedHash,
                calculatedHash,
            });
            return false;
        }

        logOperation("Shard validation successful.", { shardPath });
        return true;
    } catch (error) {
        logError("Shard validation error.", { shardPath, error: error.message });
        return false;
    }
}

/**
 * Batch validates multiple shards.
 * @param {Array<Object>} shards - List of shards to validate, each containing path and expected hash.
 * @returns {Promise<Array<Object>>} - Results for each shard with validation status.
 */
async function validateShardsBatch(shards) {
    const results = [];
    for (const shard of shards) {
        const { path: shardPath, expectedHash } = shard;
        const isValid = await validateShard(shardPath, expectedHash);
        results.push({ shardPath, isValid });
    }
    return results;
}

/**
 * Logs shard validation results for a batch process.
 * @param {Array<Object>} results - Results of the validation process.
 */
function logValidationResults(results) {
    results.forEach(({ shardPath, isValid }) => {
        if (isValid) {
            logOperation("Shard validation passed.", { shardPath });
        } else {
            logError("Shard validation failed.", { shardPath });
        }
    });
}

module.exports = { validateShard, validateShardsBatch, logValidationResults };

// ------------------------------------------------------------------------------
// End of Module: Shard Validator
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Added batch validation and enhanced logging capabilities.
// ------------------------------------------------------------------------------
