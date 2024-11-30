"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Transaction Validator
//
// Description:
// Validates transactions for structural integrity, digital signature verification,
// and compliance with blockchain rules.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For signature validation.
// - lodash: For object structure validation.
// - loggingUtils.js: For structured logging of validation results.
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const _ = require("lodash");
const { logOperation, logError } = require("../../Logger/script/logger");

// **Transaction Schema Definition**
const TRANSACTION_SCHEMA = {
    id: "string",
    from: "string",
    to: "string",
    amount: "number",
    timestamp: "number",
    signature: "string",
};

/**
 * Validates the structure of a transaction.
 * @param {Object} transaction - The transaction object to validate.
 * @returns {boolean} - True if the transaction matches the schema; otherwise false.
 */
function validateTransactionSchema(transaction) {
    const isValid = _.isMatchWith(transaction, TRANSACTION_SCHEMA, (value, schemaValue) => {
        if (typeof schemaValue === "string") {
            return typeof value === schemaValue;
        }
        return false;
    });

    if (!isValid) {
        logError("Transaction schema validation failed.", { transaction });
    }
    return isValid;
}

/**
 * Verifies the digital signature of a transaction.
 * @param {Object} transaction - The transaction object.
 * @returns {boolean} - True if the signature is valid; otherwise false.
 */
function verifyTransactionSignature(transaction) {
    try {
        const { id, from, signature } = transaction;

        // Verify signature using the sender's public key
        const verifier = crypto.createVerify("SHA256");
        verifier.update(id);
        verifier.end();

        const isValid = verifier.verify(from, Buffer.from(signature, "hex"));
        if (!isValid) {
            logError("Invalid transaction signature.", { transactionId: transaction.id });
        }
        return isValid;
    } catch (error) {
        logError("Error during signature verification.", { transactionId: transaction.id, error: error.message });
        return false;
    }
}

/**
 * Validates a transaction against schema and blockchain rules.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction is valid; otherwise false.
 */
function validateTransaction(transaction) {
    logOperation("Validating transaction...", { transactionId: transaction.id });

    // Validate transaction schema
    if (!validateTransactionSchema(transaction)) {
        return false;
    }

    // Verify digital signature
    if (!verifyTransactionSignature(transaction)) {
        return false;
    }

    logOperation("Transaction validation successful.", { transactionId: transaction.id });
    return true;
}

/**
 * Batch validates multiple transactions.
 * @param {Array<Object>} transactions - List of transactions to validate.
 * @returns {Array<Object>} - Validation results for each transaction.
 */
function validateTransactionsBatch(transactions) {
    const results = transactions.map((transaction) => {
        const isValid = validateTransaction(transaction);
        return { transactionId: transaction.id, isValid };
    });

    results.forEach(({ transactionId, isValid }) => {
        if (isValid) {
            logOperation("Transaction validation passed.", { transactionId });
        } else {
            logError("Transaction validation failed.", { transactionId });
        }
    });

    return results;
}

module.exports = {
    validateTransaction,
    validateTransactionsBatch,
    validateTransactionSchema,
    verifyTransactionSignature,
};

// ------------------------------------------------------------------------------
// End of Module: Transaction Validator
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial version with schema validation, signature verification, and batch processing.
// ------------------------------------------------------------------------------
