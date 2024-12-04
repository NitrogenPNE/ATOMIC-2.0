"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Shard Validator
 *
 * Description:
 * Validates the integrity of sharded data during storage and retrieval.
 * Incorporates military-grade tamper detection and redundancy checks.
 * Synchronizes shard validation across HQNodes, CorporateHQNodes, and NationalDefenseHQNodes.
 *
 * Dependencies:
 * - crypto: For hash validation.
 * - fs-extra: For shard metadata retrieval.
 * - predictionEngine: NIKI-powered validation optimization.
 * - loggingUtils.js: Logs validation operations.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const { logOperation, logError } = require("../../Utilities/loggingUtils");
const predictionEngine = require("../../NIKI/predictionEngine");

// **Paths and Constants**
const SHARD_BASE_DIR = path.resolve(__dirname, "../../Ledgers/Frequencies/BITS");

/**
 * Validates the integrity of a shard.
 * @param {string} shardType - Type of the shard (e.g., "proton", "neutron", "electron").
 * @param {string} shardAddress - Address of the shard being validated.
 * @returns {Promise<boolean>} - True if the shard is valid, false otherwise.
 */
async function validateShard(shardType, shardAddress) {
    try {
        logOperation(`Validating shard: ${shardAddress} (${shardType})`);

        // Step 1: Retrieve shard data and metadata
        const shardPath = path.join(SHARD_BASE_DIR, shardAddress, `${shardType}Frequency.json`);
        if (!(await fs.pathExists(shardPath))) {
            throw new Error(`Shard not found: ${shardPath}`);
        }

        const shardData = await fs.readJson(shardPath);
        if (!Array.isArray(shardData)) {
            throw new Error(`Invalid shard data structure at: ${shardPath}`);
        }

        // Step 2: Validate shard hash for tamper detection
        for (const shard of shardData) {
            const calculatedHash = crypto
                .createHash("sha256")
                .update(JSON.stringify(shard))
                .digest("hex");

            if (calculatedHash !== shard.hash) {
                logError(`Shard tamper detected for: ${shardAddress}`, { shard });
                return false;
            }
        }

        // Step 3: Cross-check shard placement predictions
        const predictedNodes = await predictionEngine.validateShardPlacement(shardAddress, shardData);
        if (!predictedNodes.valid) {
            logError(`Shard placement validation failed for: ${shardAddress}`, { predictedNodes });
            return false;
        }

        logOperation(`Shard validation successful: ${shardAddress} (${shardType})`);
        return true;
    } catch (error) {
        logError(`Error validating shard: ${error.message}`, { shardType, shardAddress });
        return false;
    }
}

/**
 * Synchronizes shard validation across HQNodes, CorporateHQNodes, and NationalDefenseHQNodes.
 * @param {string} shardAddress - Address of the shard being synchronized.
 * @returns {Promise<boolean>} - True if synchronization is successful, false otherwise.
 */
async function synchronizeShardValidation(shardAddress) {
    try {
        logOperation(`Synchronizing shard validation for: ${shardAddress}`);

        const shardPath = path.join(SHARD_BASE_DIR, shardAddress);
        if (!(await fs.pathExists(shardPath))) {
            throw new Error(`Shard address does not exist: ${shardAddress}`);
        }

        const shardTypes = ["proton", "neutron", "electron"];
        for (const shardType of shardTypes) {
            const isValid = await validateShard(shardType, shardAddress);
            if (!isValid) {
                logError(`Shard validation failed during synchronization: ${shardAddress} (${shardType})`);
                return false;
            }
        }

        logOperation(`Shard synchronization successful for: ${shardAddress}`);
        return true;
    } catch (error) {
        logError(`Error synchronizing shard validation: ${error.message}`, { shardAddress });
        return false;
    }
}

module.exports = {
    validateShard,
    synchronizeShardValidation,
};