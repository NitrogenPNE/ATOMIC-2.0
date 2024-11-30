"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Log Shard Metadata
//
// Description:
// This module logs shard metadata to the blockchain, ensuring integration with 
// bounce rate calculations, tamper-proof redundancy information, and atomic hierarchy.
// Handles secure logging of shard details, atomic particle data, and frequency metadata.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const BlockchainAPI = require("../api/blockchainAPI"); // Blockchain API for logging
const logger = require("../../Logger/logger"); // Logger utility

class LogShardMetadata {
    constructor() {
        this.blockchain = new BlockchainAPI(); // Instantiate the blockchain API
    }

    /**
     * Logs metadata for a shard to the blockchain, including atomic hierarchy details.
     * @param {string} shardId - Unique identifier for the shard.
     * @param {Object} metadata - Metadata details of the shard.
     * @param {Object} bounceRates - Calculated bounce rates for the shard.
     * @param {Object} redundancyInfo - Tamper-proof redundancy information.
     * @param {Object} atomicHierarchy - Details of neutrons, protons, and electrons in the shard.
     * @returns {Promise<Object>} - Confirmation of the blockchain log entry.
     */
    async logMetadata(shardId, metadata, bounceRates, redundancyInfo, atomicHierarchy) {
        try {
            if (!shardId || !metadata || !bounceRates || !redundancyInfo || !atomicHierarchy) {
                throw new Error(
                    "All parameters (shardId, metadata, bounceRates, redundancyInfo, atomicHierarchy) are required."
                );
            }

            const logEntry = {
                shardId,
                metadata,
                bounceRates,
                redundancyInfo,
                atomicHierarchy: this._formatAtomicHierarchy(atomicHierarchy),
                timestamp: new Date().toISOString(),
            };

            logger.info("Logging shard metadata to blockchain:", logEntry);

            const result = await this.blockchain.logShardData(logEntry);
            logger.info(`Shard metadata logged successfully for Shard ID: ${shardId}`, result);

            return result;
        } catch (error) {
            logger.error(`Error logging shard metadata for Shard ID: ${shardId}:`, error.message);
            throw error;
        }
    }

    /**
     * Retrieves logged shard metadata from the blockchain for audit purposes.
     * @param {string} shardId - The ID of the shard to retrieve.
     * @returns {Promise<Object|null>} - Retrieved metadata or null if not found.
     */
    async retrieveMetadata(shardId) {
        try {
            if (!shardId) {
                throw new Error("Shard ID is required for metadata retrieval.");
            }

            logger.info(`Retrieving metadata for Shard ID: ${shardId} from blockchain...`);
            const metadata = await this.blockchain.getShardData(shardId);

            if (metadata) {
                logger.info(`Shard metadata retrieved successfully for Shard ID: ${shardId}`, metadata);
            } else {
                logger.warn(`No metadata found for Shard ID: ${shardId}`);
            }

            return metadata;
        } catch (error) {
            logger.error(`Error retrieving metadata for Shard ID: ${shardId}:`, error.message);
            throw error;
        }
    }

    /**
     * Formats the atomic hierarchy details for shard metadata.
     * @param {Object} atomicHierarchy - Atomic structure details with neutrons, protons, and electrons.
     * @returns {Object} - Formatted atomic hierarchy details.
     */
    _formatAtomicHierarchy(atomicHierarchy) {
        const { neutrons, protons, electrons } = atomicHierarchy;

        return {
            neutrons: neutrons.map((n) => ({ frequency: n.frequency, energyLevel: n.energyLevel })),
            protons: protons.map((p) => ({ frequency: p.frequency, charge: p.charge })),
            electrons: electrons.map((e) => ({ frequency: e.frequency, spin: e.spin })),
        };
    }
}

module.exports = LogShardMetadata;