"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -----------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * 
 * Module: Transaction Validator
 * 
 * Description:
 * This module validates transactions in the ATOMIC blockchain network, ensuring
 * they comply with protocol rules, shard constraints, and quantum-resistant
 * standards. It checks structure, signature validity, input/output balance, and
 * shard metadata accuracy.
 * 
 * Dependencies:
 * - cryptoUtils.js: For signature validation and hashing.
 * - shardManager.js: For shard-specific validation.
 * - validationRules.json: Configuration for transaction rules.
 * -----------------------------------------------------------------------------
 */

const { validateSignature, hashTransaction } = require("../../../../Utilities/cryptoUtils");
const { validateShardMetadata } = require("../../ShardManager/shardIntegrityChecker");
const { transactionRules } = require("../../../Config/validationSettings.json");

/**
 * Validates a transaction structure and content.
 * @param {Object} transaction - The transaction object.
 * @returns {boolean} - True if the transaction is valid, otherwise false.
 */
function validateTransaction(transaction) {
    try {
        // Check required fields
        if (!transaction || typeof transaction !== "object") {
            throw new Error("Invalid transaction format.");
        }

        const { id, inputs, outputs, timestamp, shardMetadata } = transaction;

        // Ensure transaction ID matches its hash
        const calculatedHash = hashTransaction(transaction);
        if (id !== calculatedHash) {
            console.warn("Transaction hash mismatch.");
            return false;
        }

        // Validate inputs
        if (!Array.isArray(inputs) || inputs.length === 0 || inputs.length > transactionRules.maxInputs) {
            console.warn("Invalid or excessive transaction inputs.");
            return false;
        }

        // Validate outputs
        if (!Array.isArray(outputs) || outputs.length === 0 || outputs.length > transactionRules.maxOutputs) {
            console.warn("Invalid or excessive transaction outputs.");
            return false;
        }

        // Ensure inputs and outputs balance
        const inputSum = inputs.reduce((sum, input) => sum + input.amount, 0);
        const outputSum = outputs.reduce((sum, output) => sum + output.amount, 0);
        if (inputSum !== outputSum) {
            console.warn("Input and output amounts do not balance.");
            return false;
        }

        // Validate shard metadata
        if (!validateShardMetadata(shardMetadata)) {
            console.warn("Invalid shard metadata.");
            return false;
        }

        // Validate signatures on inputs
        for (const input of inputs) {
            if (
                !validateSignature(
                    calculatedHash,
                    input.signature,
                    input.publicKey,
                    transactionRules.signatureAlgorithm
                )
            ) {
                console.warn(`Invalid signature on input: ${input.id}`);
                return false;
            }
        }

        // Ensure transaction timestamp is within acceptable bounds
        const currentTime = Date.now();
        if (Math.abs(currentTime - timestamp) > transactionRules.maxTimestampDriftMs) {
            console.warn("Transaction timestamp is out of bounds.");
            return false;
        }

        console.info("Transaction validation successful.");
        return true;
    } catch (error) {
        console.error("Transaction validation failed:", error.message);
        return false;
    }
}

module.exports = { validateTransaction };
