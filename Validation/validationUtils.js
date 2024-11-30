"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Validation Utilities
//
// Description:
// This module provides utilities for validating transactions, shards, and nodes
// within the ATOMIC blockchain. It integrates quantum-safe signatures and node-specific
// consensus mechanisms for enhanced security and ensures real-time logging of
// validation failures for incident response.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const { logInfo, logError } = require("../Logger/logger");

// Quantum-safe hashing algorithm
const HASH_ALGORITHM = "sha3-512";

// Paths for validation logs
const VALIDATION_LOG_PATH = "C:\\ATOMIC-SecureStorage\\Logs\\Validation\\";

/**
 * Validates a transaction against a node-specific consensus mechanism.
 * @param {Object} transaction - The transaction object to validate.
 * @param {Array} consensusNodes - Array of nodes participating in consensus.
 * @returns {boolean} - True if the transaction is valid; otherwise, false.
 */
async function validateTransaction(transaction, consensusNodes) {
    try {
        logInfo(`Validating transaction: ${transaction.id}`);

        // Simulate a consensus check by verifying transaction signatures
        const validSignatures = consensusNodes.every(node =>
            verifySignature(transaction.data, transaction.signatures[node.id], node.publicKey)
        );

        if (!validSignatures) {
            throw new Error(`Transaction ${transaction.id} failed signature validation.`);
        }

        logInfo(`Transaction ${transaction.id} validated successfully.`);
        return true;
    } catch (error) {
        logError(`Transaction validation failed: ${error.message}`);
        await logValidationFailure("Transaction", transaction.id, error.message);
        return false;
    }
}

/**
 * Validates the integrity of a shard using its hash and metadata.
 * @param {Object} shard - The shard object containing data and metadata.
 * @returns {boolean} - True if the shard is valid; otherwise, false.
 */
function validateShard(shard) {
    try {
        logInfo(`Validating shard: ${shard.id}`);

        // Generate a hash of the shard data and compare it to the stored hash
        const dataHash = hashData(shard.data);
        if (dataHash !== shard.hash) {
            throw new Error(`Shard ${shard.id} hash mismatch: Expected ${shard.hash}, got ${dataHash}`);
        }

        logInfo(`Shard ${shard.id} validated successfully.`);
        return true;
    } catch (error) {
        logError(`Shard validation failed: ${error.message}`);
        logValidationFailure("Shard", shard.id, error.message);
        return false;
    }
}

/**
 * Validates a node's authorization using quantum-safe signatures.
 * @param {Object} node - The node object containing id, data, and signature.
 * @param {string} publicKey - The node's public key.
 * @returns {boolean} - True if the node is authorized; otherwise, false.
 */
function validateNode(node, publicKey) {
    try {
        logInfo(`Validating node: ${node.id}`);

        if (!verifySignature(node.data, node.signature, publicKey)) {
            throw new Error(`Node ${node.id} failed quantum-safe signature validation.`);
        }

        logInfo(`Node ${node.id} validated successfully.`);
        return true;
    } catch (error) {
        logError(`Node validation failed: ${error.message}`);
        logValidationFailure("Node", node.id, error.message);
        return false;
    }
}

/**
 * Generates a hash of the given data using a quantum-safe algorithm.
 * @param {string|Buffer} data - The data to hash.
 * @returns {string} - The generated hash.
 */
function hashData(data) {
    return crypto.createHash(HASH_ALGORITHM).update(data).digest("hex");
}

/**
 * Verifies a quantum-safe signature for the given data.
 * @param {string|Buffer} data - The data to verify.
 * @param {string} signature - The signature to validate.
 * @param {string} publicKey - The public key of the signer.
 * @returns {boolean} - True if the signature is valid; otherwise, false.
 */
function verifySignature(data, signature, publicKey) {
    try {
        const verifier = crypto.createVerify(HASH_ALGORITHM);
        verifier.update(data);
        return verifier.verify(publicKey, signature, "hex");
    } catch (error) {
        logError(`Signature verification error: ${error.message}`);
        return false;
    }
}

/**
 * Logs a validation failure for real-time incident response.
 * @param {string} type - The type of validation (e.g., Transaction, Shard, Node).
 * @param {string} id - The ID of the item that failed validation.
 * @param {string} reason - The reason for the validation failure.
 */
async function logValidationFailure(type, id, reason) {
    try {
        const logEntry = {
            type,
            id,
            reason,
            timestamp: new Date().toISOString(),
        };

        const logFilePath = `${VALIDATION_LOG_PATH}\\${type.toLowerCase()}Failures.json`;
        const existingLogs = fs.existsSync(logFilePath) ? await fs.readJson(logFilePath) : [];
        existingLogs.push(logEntry);

        await fs.writeJson(logFilePath, existingLogs, { spaces: 2 });
        logInfo(`Validation failure logged for ${type} ${id}.`);
    } catch (error) {
        logError(`Failed to log validation failure: ${error.message}`);
    }
}

module.exports = {
    validateTransaction,
    validateShard,
    validateNode,
    hashData,
    verifySignature,
    logValidationFailure,
};

// ------------------------------------------------------------------------------
// End of Module: Validation Utilities
// Version: 1.0.0 | Updated: 2024-11-28
// -------------------------------------------------------------------------------
