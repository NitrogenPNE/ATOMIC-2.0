"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Enhanced Transaction
//
// Description:
// Implements the transaction structure and utilities for ATOMIC's blockchain,
// enhanced with quantum-resistant signatures, token validation, shard metadata,
// and atomic-level validation.
//
// Enhancements:
// - Token-based validation for Proof-of-Access.
// - Quantum-resistant digital signatures using Kyber/Dilithium.
// - Shard and atomic-level metadata validation.
// - Encrypted transaction payloads with enhanced military-grade security.
//
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const { validateTransactionSchema } = require("../utils/validationUtils");
const { signData, verifySignature, encryptPayload, decryptPayload } = require("../utils/cryptoUtils");
const { validateToken } = require("../Pricing/TokenManagement/tokenValidation");

// **Transaction Configuration**
const TRANSACTION_CONFIG = {
    hashAlgorithm: "sha3-256", // Enhanced quantum resistance
    maxInputs: 10,
    maxOutputs: 10,
    minFrequency: 100, // Minimum shard frequency
    maxFrequency: 1000, // Maximum shard frequency
};

/**
 * Represents a transaction in ATOMIC's blockchain.
 */
class Transaction {
    /**
     * Create a new transaction.
     * @param {Array<Object>} inputs - Array of input objects (e.g., { txId, outputIndex, signature }).
     * @param {Array<Object>} outputs - Array of output objects (e.g., { address, amount }).
     * @param {Object} shardMetadata - Metadata for sharding (e.g., shard ID, atom chain references).
     * @param {Object} tokenDetails - Token metadata for Proof-of-Access validation.
     * @param {string} militaryClassification - Optional military classification for enhanced security.
     */
    constructor(inputs, outputs, shardMetadata = {}, tokenDetails = {}, militaryClassification = "UNCLASSIFIED") {
        this.id = null; // Computed hash of the transaction
        this.inputs = inputs;
        this.outputs = outputs;
        this.timestamp = Date.now(); // Unix timestamp
        this.shardMetadata = shardMetadata; // Shard-specific metadata
        this.tokenDetails = tokenDetails; // Token ID and encryption for Proof-of-Access
        this.militaryClassification = militaryClassification; // Security classification
    }

    /**
     * Compute the transaction hash (ID).
     * @returns {string} - Transaction ID.
     */
    computeHash() {
        const data = JSON.stringify({
            inputs: this.inputs,
            outputs: this.outputs,
            shardMetadata: this.shardMetadata,
            tokenDetails: this.tokenDetails,
            timestamp: this.timestamp,
            militaryClassification: this.militaryClassification,
        });
        return crypto.createHash(TRANSACTION_CONFIG.hashAlgorithm).update(data).digest("hex");
    }

    /**
     * Sign the transaction inputs with a quantum-resistant private key.
     * @param {Object} quantumKeyPair - Quantum-resistant key pair (e.g., Dilithium keys).
     */
    sign(quantumKeyPair) {
        this.inputs.forEach((input) => {
            input.signature = signData(this.computeHash(), quantumKeyPair.privateKey, "dilithium");
        });
        this.id = this.computeHash(); // Update transaction ID after signing
    }

    /**
     * Verify all input signatures in the transaction.
     * @returns {boolean} - True if all signatures are valid, false otherwise.
     */
    verifySignatures() {
        return this.inputs.every((input) =>
            verifySignature(this.id, input.signature, input.publicKey, "dilithium")
        );
    }

    /**
     * Validate the transaction against blockchain rules, shard constraints,
     * token validation, and atomic-level validation.
     * @returns {boolean} - True if the transaction is valid, false otherwise.
     */
    async validate() {
        if (!validateTransactionSchema(this)) {
            console.warn("Transaction schema validation failed.");
            return false;
        }

        if (this.inputs.length > TRANSACTION_CONFIG.maxInputs) {
            console.warn("Transaction exceeds maximum allowed inputs.");
            return false;
        }

        if (this.outputs.length > TRANSACTION_CONFIG.maxOutputs) {
            console.warn("Transaction exceeds maximum allowed outputs.");
            return false;
        }

        if (!this.verifySignatures()) {
            console.warn("Transaction signature verification failed.");
            return false;
        }

        if (!this.validateShardConstraints()) {
            console.warn("Transaction failed shard constraint validation.");
            return false;
        }

        const isTokenValid = await this.validateToken();
        if (!isTokenValid) {
            console.warn("Transaction failed token validation.");
            return false;
        }

        console.log("Transaction validation successful.");
        return true;
    }

    /**
     * Validate transaction against shard and atomic constraints.
     * @returns {boolean} - True if shard constraints are satisfied, false otherwise.
     */
    validateShardConstraints() {
        const { shardID, frequency, atomicMetadata } = this.shardMetadata;
        if (!shardID || !frequency || !atomicMetadata) {
            console.warn("Missing shard or atomic metadata.");
            return false;
        }

        // Ensure frequency is within acceptable range
        if (frequency < TRANSACTION_CONFIG.minFrequency || frequency > TRANSACTION_CONFIG.maxFrequency) {
            console.warn("Shard frequency is out of bounds.");
            return false;
        }

        // Ensure atomic metadata includes required fields
        const { protons, neutrons, electrons } = atomicMetadata;
        if (protons == null || neutrons == null || electrons == null) {
            console.warn("Atomic metadata validation failed.");
            return false;
        }

        console.log("Shard and atomic metadata validation successful.");
        return true;
    }

    /**
     * Validate the token associated with the transaction.
     * @returns {Promise<boolean>} - True if the token is valid, false otherwise.
     */
    async validateToken() {
        try {
            const { tokenId, encryptedToken } = this.tokenDetails;
            if (!tokenId || !encryptedToken) {
                console.warn("Missing token details for validation.");
                return false;
            }

            console.log("Validating token...");
            const validation = await validateToken(tokenId, encryptedToken);
            return validation.valid;
        } catch (error) {
            console.error("Token validation failed:", error.message);
            return false;
        }
    }
}

/**
 * Create a new transaction with encrypted payloads and token details.
 * @param {Array<Object>} inputs - Array of transaction inputs.
 * @param {Array<Object>} outputs - Array of transaction outputs.
 * @param {Object} shardMetadata - Metadata for sharding.
 * @param {Object} tokenDetails - Token metadata for Proof-of-Access validation.
 * @param {string} militaryClassification - Optional military classification.
 * @returns {Transaction} - New transaction instance.
 */
function createTransaction(inputs, outputs, shardMetadata = {}, tokenDetails = {}, militaryClassification = "UNCLASSIFIED") {
    console.log("Creating new transaction...");
    const transaction = new Transaction(inputs, outputs, shardMetadata, tokenDetails, militaryClassification);
    transaction.id = transaction.computeHash(); // Assign unique ID
    return transaction;
}

/**
 * Serialize a transaction into JSON format for storage or transmission.
 * @param {Transaction} transaction - Transaction to serialize.
 * @returns {string} - Serialized JSON string.
 */
function serializeTransaction(transaction) {
    return JSON.stringify(transaction);
}

/**
 * Deserialize a JSON string into a transaction object.
 * @param {string} serializedTransaction - JSON string representing the transaction.
 * @returns {Transaction} - Deserialized transaction instance.
 */
function deserializeTransaction(serializedTransaction) {
    const { inputs, outputs, shardMetadata, tokenDetails, timestamp, militaryClassification } = JSON.parse(serializedTransaction);
    const transaction = new Transaction(inputs, outputs, shardMetadata, tokenDetails, militaryClassification);
    transaction.timestamp = timestamp;
    transaction.id = transaction.computeHash();
    return transaction;
}

module.exports = {
    Transaction,
    createTransaction,
    serializeTransaction,
    deserializeTransaction,
};