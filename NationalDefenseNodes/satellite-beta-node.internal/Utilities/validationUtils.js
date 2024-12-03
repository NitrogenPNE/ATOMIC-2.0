"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Beta Node - Validation Utilities
// ------------------------------------------------------------------------------

// Dependencies
const path = require("path");
const {
    validateTransaction,
    validateBlock,
    validateShard,
    validateToken
} = require("../../../atomic-blockchain/Utilities/validationUtils");
const { logInfo, logError } = require("../Services/loggingService");

// Validation Schemas (if additional ones are needed for node-specific checks)
const NODE_VALIDATION_SCHEMAS = {
    satelliteMessage: {
        id: "string",
        satelliteId: "string",
        message: "string",
        timestamp: "number",
        signature: "string"
    }
};

/**
 * Validate a satellite message schema.
 * @param {Object} message - The satellite message to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
function validateSatelliteMessage(message) {
    logInfo("Validating satellite message...", { messageId: message.id });

    // Validate schema
    const isValidSchema = validateSchema(message, NODE_VALIDATION_SCHEMAS.satelliteMessage);
    if (!isValidSchema) {
        logError("Satellite message schema validation failed.", { message });
        return false;
    }

    // Validate token authenticity
    const isTokenValid = validateToken(message.token);
    if (!isTokenValid) {
        logError("Invalid token detected in satellite message.", { messageId: message.id });
        return false;
    }

    logInfo("Satellite message validated successfully.", { messageId: message.id });
    return true;
}

/**
 * Validate an object against a defined schema.
 * @param {Object} object - The object to validate.
 * @param {Object} schema - The schema definition.
 * @returns {boolean} - True if the object matches the schema, false otherwise.
 */
function validateSchema(object, schema) {
    const schemaKeys = Object.keys(schema);
    for (const key of schemaKeys) {
        if (typeof object[key] !== schema[key]) {
            logError("Schema validation error", {
                key,
                expected: schema[key],
                received: typeof object[key]
            });
            return false;
        }
    }
    return true;
}

/**
 * Validate a satellite-specific transaction.
 * Leverages core transaction validation with additional satellite-specific rules.
 * @param {Object} transaction - The transaction object.
 * @returns {boolean} - True if valid, false otherwise.
 */
function validateSatelliteTransaction(transaction) {
    logInfo("Validating satellite-specific transaction...", { transactionId: transaction.id });

    // Perform core transaction validation
    if (!validateTransaction(transaction)) {
        logError("Core transaction validation failed.", { transaction });
        return false;
    }

    // Perform satellite-specific checks (e.g., satellite ID consistency)
    if (!transaction.satelliteId || !transaction.satelliteId.startsWith("SAT-")) {
        logError("Satellite transaction validation failed. Invalid satellite ID.", { transaction });
        return false;
    }

    logInfo("Satellite-specific transaction validated successfully.", { transactionId: transaction.id });
    return true;
}

module.exports = {
    validateSatelliteMessage,
    validateSatelliteTransaction,
    validateBlock,
    validateShard,
    validateToken
};