"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Consensus Arbitrator
 *
 * Description:
 * Manages arbitration for disputes across the ATOMIC network. Implements
 * quantum-resistant consensus mechanisms to ensure secure and fair resolutions.
 *
 * Dependencies:
 * - arbitrationPolicy.json: Configures arbitration rules and thresholds.
 * - validationUtils.js: Validates blocks, shards, and transactions.
 * - consensus.js: Executes quantum-resistant consensus protocols.
 * - loggingUtils.js: Structured logging for arbitration events.
 * - quantumCrypto.js: Quantum-resistant encryption utilities.
 * ---------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { verifyConsensus, executeConsensus } = require("../core/consensus");
const { validateBlockStructure, validateShardIntegrity } = require("../utils/validationUtils");
const { encryptMessage, decryptMessage } = require("../utils/quantumCrypto");
const { logEvent } = require("../utils/loggingUtils");

const ARBITRATION_POLICY_PATH = path.resolve(__dirname, "./arbitrationPolicy.json");
const DISPUTE_LOG_PATH = path.resolve(__dirname, "../../logs/disputeLog.json");
const ENCRYPTION_KEYS_PATH = path.resolve(__dirname, "../../keys");

/**
 * Load arbitration policy.
 */
async function loadArbitrationPolicy() {
    try {
        const policy = await fs.readJson(ARBITRATION_POLICY_PATH);
        console.log("Arbitration policy loaded successfully.");
        return policy;
    } catch (error) {
        console.error("Failed to load arbitration policy:", error.message);
        throw new Error("Arbitration policy load failure.");
    }
}

/**
 * Handle shard integrity disputes.
 * @param {Object} shardMetadata - Metadata about the disputed shard.
 * @param {Array} peers - List of peers involved in the dispute.
 * @returns {Promise<Object>} - Arbitration resolution result.
 */
async function resolveShardIntegrityDispute(shardMetadata, peers) {
    console.log("Resolving shard integrity dispute...");
    try {
        // Validate shard metadata
        if (!validateShardIntegrity(shardMetadata)) {
            throw new Error("Invalid shard metadata.");
        }

        // Execute consensus
        const consensusResult = await executeConsensus(peers, shardMetadata);
        if (!consensusResult.success) {
            throw new Error("Failed to achieve consensus during shard dispute resolution.");
        }

        console.log("Shard integrity dispute resolved successfully.");
        await logEvent("ShardDisputeResolved", { shardMetadata, resolution: consensusResult });
        return consensusResult;
    } catch (error) {
        console.error("Failed to resolve shard integrity dispute:", error.message);
        await logEvent("ShardDisputeError", { shardMetadata, error: error.message });
        throw error;
    }
}

/**
 * Handle transaction conflicts.
 * @param {Object} transactionData - Details of the conflicting transaction.
 * @param {Array} peers - List of peers involved in the dispute.
 * @returns {Promise<Object>} - Arbitration resolution result.
 */
async function resolveTransactionConflict(transactionData, peers) {
    console.log("Resolving transaction conflict...");
    try {
        // Validate transaction structure
        if (!validateBlockStructure(transactionData)) {
            throw new Error("Invalid transaction structure.");
        }

        // Execute consensus
        const consensusResult = await executeConsensus(peers, transactionData);
        if (!consensusResult.success) {
            throw new Error("Failed to achieve consensus during transaction conflict resolution.");
        }

        console.log("Transaction conflict resolved successfully.");
        await logEvent("TransactionConflictResolved", { transactionData, resolution: consensusResult });
        return consensusResult;
    } catch (error) {
        console.error("Failed to resolve transaction conflict:", error.message);
        await logEvent("TransactionConflictError", { transactionData, error: error.message });
        throw error;
    }
}

/**
 * Handle detected anomalies flagged by the Intrusion Detection System (IDS).
 * @param {Object} anomalyDetails - Details of the detected anomaly.
 * @param {Array} peers - List of peers involved in the dispute.
 * @returns {Promise<Object>} - Arbitration resolution result.
 */
async function handleAnomalyDetection(anomalyDetails, peers) {
    console.log("Handling anomaly detection...");
    try {
        // Encrypt anomaly details before consensus
        const encryptedDetails = encryptMessage(JSON.stringify(anomalyDetails), ENCRYPTION_KEYS_PATH);

        // Execute consensus with encrypted data
        const consensusResult = await executeConsensus(peers, encryptedDetails);
        if (!consensusResult.success) {
            throw new Error("Failed to achieve consensus during anomaly detection.");
        }

        console.log("Anomaly resolved successfully.");
        await logEvent("AnomalyResolved", { anomalyDetails, resolution: consensusResult });
        return consensusResult;
    } catch (error) {
        console.error("Failed to handle anomaly detection:", error.message);
        await logEvent("AnomalyResolutionError", { anomalyDetails, error: error.message });
        throw error;
    }
}

/**
 * Log disputes for audit and compliance.
 * @param {string} disputeType - Type of dispute (e.g., ShardIntegrity, TransactionConflict).
 * @param {Object} details - Details of the dispute.
 */
async function logDispute(disputeType, details) {
    try {
        const logEntry = {
            type: disputeType,
            details,
            timestamp: new Date().toISOString(),
        };

        await fs.appendFile(DISPUTE_LOG_PATH, JSON.stringify(logEntry) + "\n");
        console.log(`Dispute logged: ${disputeType}`);
    } catch (error) {
        console.error("Failed to log dispute:", error.message);
    }
}

/**
 * Main arbitration handler.
 * Routes disputes to appropriate resolution functions.
 * @param {string} disputeType - Type of dispute (e.g., ShardIntegrity, TransactionConflict, IDSAnomaly).
 * @param {Object} disputeDetails - Details of the dispute.
 * @param {Array} peers - List of peers involved in the dispute.
 */
async function handleDispute(disputeType, disputeDetails, peers) {
    try {
        switch (disputeType) {
            case "ShardIntegrity":
                return await resolveShardIntegrityDispute(disputeDetails, peers);
            case "TransactionConflict":
                return await resolveTransactionConflict(disputeDetails, peers);
            case "IDSAnomaly":
                return await handleAnomalyDetection(disputeDetails, peers);
            default:
                throw new Error(`Unknown dispute type: ${disputeType}`);
        }
    } catch (error) {
        console.error(`Failed to handle dispute of type ${disputeType}:`, error.message);
        await logDispute(disputeType, { disputeDetails, error: error.message });
        throw error;
    }
}

module.exports = {
    handleDispute,
    resolveShardIntegrityDispute,
    resolveTransactionConflict,
    handleAnomalyDetection,
};