"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Transaction Validator
 *
 * Description:
 * Validates transactions within the ATOMIC blockchain for Corporate Node 2.
 * Ensures adherence to cryptographic, structural, and shard-related rules.
 * -------------------------------------------------------------------------
 */

const crypto = require("crypto");
const { validateTransactionSchema } = require("../utils/validationUtils");
const { verifySignature } = require("../utils/cryptoUtils");

/**
 * Validate the structure of a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction structure is valid, false otherwise.
 */
function validateTransactionStructure(transaction) {
    console.log(`Validating structure for transaction ID: ${transaction.id}`);
    const isValid = validateTransactionSchema(transaction);
    if (!isValid) {
        console.warn(`Transaction structure validation failed for transaction ID: ${transaction.id}`);
    }
    return isValid;
}

/**
 * Validate the cryptographic integrity of a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction's cryptographic properties are valid, false otherwise.
 */
function validateTransactionIntegrity(transaction) {
    try {
        const transactionData = JSON.stringify({
            inputs: transaction.inputs,
            outputs: transaction.outputs,
            shardMetadata: transaction.shardMetadata,
            timestamp: transaction.timestamp,
        });

        const computedHash = crypto.createHash("sha256").update(transactionData).digest("hex");
        const isValid = computedHash === transaction.id;

        if (!isValid) {
            console.warn(`Transaction integrity check failed for transaction ID: ${transaction.id}`);
        }

        return isValid;
    } catch (error) {
        console.error(`Error validating integrity for transaction ID: ${transaction.id}`, error.message);
        return false;
    }
}

/**
 * Verify the signatures of all inputs in a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if all input signatures are valid, false otherwise.
 */
function validateTransactionSignatures(transaction) {
    console.log(`Validating signatures for transaction ID: ${transaction.id}`);
    const allSignaturesValid = transaction.inputs.every((input) =>
        verifySignature(transaction.id, input.signature, input.publicKey)
    );

    if (!allSignaturesValid) {
        console.warn(`Signature validation failed for transaction ID: ${transaction.id}`);
    }

    return allSignaturesValid;
}

/**
 * Validate shard constraints for a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction meets all shard constraints, false otherwise.
 */
function validateShardConstraints(transaction) {
    try {
        const { shardID, frequency } = transaction.shardMetadata;

        if (!shardID || !frequency) {
            console.warn(`Missing shard metadata for transaction ID: ${transaction.id}`);
            return false;
        }

        // Example: Validate shard frequency range
        if (frequency < 100 || frequency > 1000) {
            console.warn(`Shard frequency is out of bounds for transaction ID: ${transaction.id}`);
            return false;
        }

        console.log(`Shard constraints validated for transaction ID: ${transaction.id}`);
        return true;
    } catch (error) {
        console.error(`Error validating shard constraints for transaction ID: ${transaction.id}`, error.message);
        return false;
    }
}

/**
 * Perform a comprehensive validation of a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction passes all validation checks, false otherwise.
 */
function validateTransaction(transaction) {
    console.log(`Starting comprehensive validation for transaction ID: ${transaction.id}`);

    const isStructureValid = validateTransactionStructure(transaction);
    const isIntegrityValid = validateTransactionIntegrity(transaction);
    const areSignaturesValid = validateTransactionSignatures(transaction);
    const areShardConstraintsValid = validateShardConstraints(transaction);

    const isValid = isStructureValid && isIntegrityValid && areSignaturesValid && areShardConstraintsValid;

    if (isValid) {
        console.log(`Transaction validation passed for transaction ID: ${transaction.id}`);
    } else {
        console.warn(`Transaction validation failed for transaction ID: ${transaction.id}`);
    }

    return isValid;
}

module.exports = {
    validateTransactionStructure,
    validateTransactionIntegrity,
    validateTransactionSignatures,
    validateShardConstraints,
    validateTransaction,
};
