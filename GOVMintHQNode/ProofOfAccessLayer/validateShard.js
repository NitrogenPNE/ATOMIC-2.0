"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode Proof-of-Access - Validate Shard
 *
 * Description:
 * Validates shard integrity and metadata for Proof-of-Access compliance.
 * Integrates shardValidator and shardMetadataManager for comprehensive validation.
 *
 * Dependencies:
 * - shardValidator.js: For validating shard integrity.
 * - shardMetadataManager.js: For validating shard metadata and synchronization.
 * - loggingUtils.js: For structured logging.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const { validateShard, synchronizeShardValidation } = require("../../Core/Sharding/shardValidator");
const {
    readShardMetadata,
    validateShardMetadata,
    synchronizeShardMetadata,
} = require("../../atomic-blockchain/scripts/shardMetadataManager");
const { logOperation, logError } = require("../Utilities/loggingUtils");

/**
 * Validates a shard for Proof-of-Access compliance.
 * @param {string} shardType - Type of the shard (e.g., "proton", "neutron", "electron").
 * @param {string} shardAddress - Address of the shard being validated.
 * @returns {Promise<boolean>} - True if validation succeeds, false otherwise.
 */
async function validateProofOfAccessShard(shardType, shardAddress) {
    try {
        logOperation(`Starting Proof-of-Access validation for shard: ${shardAddress} (${shardType})`);

        // Step 1: Validate shard integrity
        const isShardValid = await validateShard(shardType, shardAddress);
        if (!isShardValid) {
            logError(`Shard integrity validation failed for: ${shardAddress}`);
            return false;
        }

        // Step 2: Synchronize shard validation across nodes
        const isSynchronized = await synchronizeShardValidation(shardAddress);
        if (!isSynchronized) {
            logError(`Shard synchronization failed for: ${shardAddress}`);
            return false;
        }

        // Step 3: Validate shard metadata
        const isMetadataValid = await validateShardMetadata(shardAddress);
        if (!isMetadataValid) {
            logError(`Shard metadata validation failed for: ${shardAddress}`);
            return false;
        }

        logOperation(`Proof-of-Access validation successful for shard: ${shardAddress}`);
        return true;
    } catch (error) {
        logError(`Error during Proof-of-Access validation for shard: ${shardAddress}`, {
            error: error.message,
        });
        return false;
    }
}

/**
 * Validates and synchronizes shard metadata for a given address.
 * @param {string} shardAddress - Address of the shard for synchronization.
 * @returns {Promise<boolean>} - True if synchronization succeeds, false otherwise.
 */
async function validateAndSynchronizeMetadata(shardAddress) {
    try {
        logOperation(`Validating and synchronizing metadata for shard: ${shardAddress}`);

        // Step 1: Read shard metadata
        const metadata = await readShardMetadata(shardAddress);
        if (!metadata || metadata.length === 0) {
            logError(`No metadata found for shard: ${shardAddress}`);
            return false;
        }

        // Step 2: Validate metadata
        const isMetadataValid = await validateShardMetadata(shardAddress);
        if (!isMetadataValid) {
            logError(`Metadata validation failed for shard: ${shardAddress}`);
            return false;
        }

        // Step 3: Synchronize metadata across nodes
        await synchronizeShardMetadata(shardAddress);

        logOperation(`Metadata validation and synchronization successful for shard: ${shardAddress}`);
        return true;
    } catch (error) {
        logError(`Error during metadata validation/synchronization for shard: ${shardAddress}`, {
            error: error.message,
        });
        return false;
    }
}

module.exports = {
    validateProofOfAccessShard,
    validateAndSynchronizeMetadata,
};
