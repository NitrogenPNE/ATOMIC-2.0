"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Defense Transaction Validator
//
// Description:
// Validates transactions in the National Defense HQ Node. Ensures compliance
// with enhanced security protocols and defense-grade validation standards.
// This includes verification of digital signatures, transaction schemas, 
// and integrity checks.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For signature verification.
// - lodash: For deep schema validation.
// - activityAuditLogger: Logs validation results and anomalies.
// - validationRules: Defines transaction validation rules.
//
// Usage:
// const { validateDefenseTransaction } = require('./defenseTransactionValidator');
// validateDefenseTransaction(transaction).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const _ = require("lodash");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const validationRules = require("../Config/validationSettings.json");

/**
 * Validates a defense transaction.
 * @param {Object} transaction - The transaction object to validate.
 * @returns {Promise<boolean>} - True if the transaction is valid; otherwise false.
 */
async function validateDefenseTransaction(transaction) {
    logInfo(`Starting validation for transaction ID: ${transaction.id}`);

    try {
        // Step 1: Schema Validation
        if (!validateSchema(transaction)) {
            logError(`Transaction schema validation failed: ${transaction.id}`);
            return false;
        }

        // Step 2: Signature Verification
        if (!verifyTransactionSignature(transaction)) {
            logError(`Transaction signature verification failed: ${transaction.id}`);
            return false;
        }

        // Step 3: Additional Integrity Checks
        if (!performIntegrityChecks(transaction)) {
            logError(`Transaction integrity checks failed: ${transaction.id}`);
            return false;
        }

        logInfo(`Transaction validated successfully: ${transaction.id}`);
        return true;
    } catch (error) {
        logError(`Error during transaction validation: ${error.message}`);
        throw error;
    }
}

/**
 * Validates the transaction against a predefined schema.
 * @param {Object} transaction - The transaction object.
 * @returns {boolean} - True if the schema is valid; otherwise false.
 */
function validateSchema(transaction) {
    const schema = validationRules.transactionSchema;

    return _.isMatchWith(transaction, schema, (objValue, schemaValue) => {
        if (typeof schemaValue === "string") {
            return typeof objValue === schemaValue;
        }
        if (Array.isArray(schemaValue)) {
            return Array.isArray(objValue);
        }
        return _.isEqual(objValue, schemaValue);
    });
}

/**
 * Verifies the digital signature of the transaction.
 * @param {Object} transaction - The transaction object.
 * @returns {boolean} - True if the signature is valid; otherwise false.
 */
function verifyTransactionSignature(transaction) {
    const { signature, senderPublicKey, ...transactionData } = transaction;

    const dataToVerify = JSON.stringify(transactionData);
    const verifier = crypto.createVerify("SHA256");
    verifier.update(dataToVerify);
    verifier.end();

    return verifier.verify(senderPublicKey, signature, "base64");
}

/**
 * Performs additional integrity checks on the transaction.
 * @param {Object} transaction - The transaction object.
 * @returns {boolean} - True if all checks pass; otherwise false.
 */
function performIntegrityChecks(transaction) {
    // Example: Ensure transaction amount is positive
    if (transaction.amount <= 0) {
        logError(`Transaction has invalid amount: ${transaction.amount}`);
        return false;
    }

    // Additional custom checks for defense-specific transactions
    if (transaction.securityClearanceLevel < validationRules.minSecurityClearance) {
        logError(
            `Transaction security clearance level too low: ${transaction.securityClearanceLevel}`
        );
        return false;
    }

    return true;
}

module.exports = {
    validateDefenseTransaction,
};
