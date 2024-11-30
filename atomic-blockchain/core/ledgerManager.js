"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Ledger Manager (Enhanced for ATOMIC Structure)
//
// Description:
// Logs shard metadata and related events to the ATOMIC blockchain.
// Includes hierarchical atomic structures (protons, neutrons, electrons)
// and military-specific adaptations (bounce rates, redundancy).
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: Handles file-based logging as fallback.
// - winston: Structured logging for shard metadata.
// - blockchainApi: Facilitates blockchain communication.
//
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const { sendTransaction } = require("./blockchainNode");

// **Local Log Path for Fallback**
const LOCAL_LOG_PATH = path.join(__dirname, "../../logs/ledgerBackup.log");

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: LOCAL_LOG_PATH }),
    ],
});

/**
 * Log shard metadata with atomic structure.
 * @param {string} userId - User's unique identifier.
 * @param {string} proposalId - Blockchain proposal ID.
 * @param {Object[]} atomTypes - Types of atoms distributed, including hierarchy.
 * @param {number} duration - Distribution duration.
 * @param {Object} atomicMetadata - Includes proton, neutron, electron counts.
 * @returns {Promise<void>} - Resolves when metadata is logged.
 */
async function logShardMetadata(userId, proposalId, atomTypes, duration, atomicMetadata) {
    try {
        const metadata = {
            eventType: "SHARD_METADATA",
            userId,
            proposalId,
            atomTypes,
            duration,
            atomicMetadata, // { protons, neutrons, electrons }
            timestamp: new Date().toISOString(),
        };

        logger.info("Logging shard metadata to the blockchain...", metadata);

        // Send metadata to the blockchain
        const result = await sendTransaction(metadata);
        if (result.success) {
            logger.info("Shard metadata successfully logged on the blockchain.", { transactionId: result.transactionId });
        } else {
            throw new Error("Blockchain logging failed.");
        }
    } catch (error) {
        logger.error("Failed to log shard metadata on the blockchain.", { error: error.message });

        // Fallback to local logging
        await fallbackLocalLog({
            userId,
            proposalId,
            atomTypes,
            duration,
            atomicMetadata,
            error: error.message,
        });
    }
}

/**
 * Record shard creation events with atomic hierarchy.
 * @param {string} shardId - Unique shard identifier.
 * @param {Object[]} bitAtoms - List of bit atoms within the shard.
 * @param {Object} atomicMetadata - Includes proton, neutron, electron counts.
 * @returns {Promise<void>} - Resolves when shard creation is logged.
 */
async function logShardCreation(shardId, bitAtoms, atomicMetadata) {
    try {
        const event = {
            eventType: "SHARD_CREATION",
            shardId,
            bitAtoms,
            atomicMetadata, // { protons, neutrons, electrons }
            timestamp: new Date().toISOString(),
        };

        logger.info("Logging shard creation event to the blockchain...", event);

        // Send the event to the blockchain
        const result = await sendTransaction(event);
        if (result.success) {
            logger.info("Shard creation event successfully logged.", { transactionId: result.transactionId });
        } else {
            throw new Error("Blockchain logging failed.");
        }
    } catch (error) {
        logger.error("Failed to log shard creation on the blockchain.", { error: error.message });

        // Fallback to local logging
        await fallbackLocalLog({ shardId, bitAtoms, atomicMetadata, error: error.message });
    }
}

/**
 * Log distribution completion with bounce rate and redundancy data.
 * @param {string} proposalId - Blockchain proposal ID.
 * @param {string} userId - User's unique identifier.
 * @param {string[]} distributedAtoms - List of distributed atom types.
 * @param {Object} redundancyData - Includes redundancy and bounce rates.
 * @returns {Promise<void>} - Resolves when distribution is logged.
 */
async function logDistributionCompletion(proposalId, userId, distributedAtoms, redundancyData) {
    try {
        const event = {
            eventType: "DISTRIBUTION_COMPLETION",
            proposalId,
            userId,
            distributedAtoms,
            redundancyData, // { redundancyLevel, bounceRate }
            timestamp: new Date().toISOString(),
        };

        logger.info("Logging distribution completion to the blockchain...", event);

        // Send the event to the blockchain
        const result = await sendTransaction(event);
        if (result.success) {
            logger.info("Distribution completion event successfully logged.", { transactionId: result.transactionId });
        } else {
            throw new Error("Blockchain logging failed.");
        }
    } catch (error) {
        logger.error("Failed to log distribution completion on the blockchain.", { error: error.message });

        // Fallback to local logging
        await fallbackLocalLog({ proposalId, userId, distributedAtoms, redundancyData, error: error.message });
    }
}

/**
 * Fallback: Write metadata to local logs when blockchain logging fails.
 * @param {Object} fallbackData - Data to write to the local log.
 * @returns {Promise<void>} - Resolves when the fallback log is written.
 */
async function fallbackLocalLog(fallbackData) {
    try {
        const logEntry = {
            ...fallbackData,
            fallbackTimestamp: new Date().toISOString(),
        };
        await fs.appendFile(LOCAL_LOG_PATH, JSON.stringify(logEntry) + "\n");
        logger.warn("Fallback logging completed.", logEntry);
    } catch (fallbackError) {
        logger.error("Failed to write to fallback log.", { fallbackError: fallbackError.message });
    }
}

module.exports = {
    logShardMetadata,
    logShardCreation,
    logDistributionCompletion,
};