"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Validation Utilities
//
// Description:
// Contains reusable validation functions for transactions, blocks, shards, and nodes
// to ensure data integrity and compliance with blockchain rules.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - lodash: For object schema validation.
// - crypto: For digital signature verification.
// - loggingUtils.js: For structured logging of validation results.
// ------------------------------------------------------------------------------

const _ = require("lodash");
const crypto = require("crypto");
const { logOperation, logError } = require("../../Logger/script/logger");

// **Schema Definitions**
const SCHEMAS = {
    transaction: {
        id: "string",
        from: "string",
        to: "string",
        amount: "number",
        timestamp: "number",
        signature: "string",
    },
    block: {
        index: "number",
        previousHash: "string",
        timestamp: "number",
        transactions: "array",
        hash: "string",
        nonce: "number",
    },
    shard: {
        id: "string",
        hash: "string",
        timestamp: "number",
        data: "array",
    },
};

/**
 * Validate an object against a schema.
 * @param {Object} object - The object to validate.
 * @param {Object} schema - The schema to validate against.
 * @returns {boolean} - True if the object matches the schema, otherwise false.
 */
function validateSchema(object, schema) {
    const isValid = _.isMatchWith(object, schema, (value, schemaValue) => {
        if (typeof schemaValue === "string") {
            return typeof value === schemaValue;
        }
        if (Array.isArray(schemaValue)) {
            return Array.isArray(value);
        }
        return _.isEqual(value, schemaValue);
    });

    if (!isValid) {
        logError("Schema validation failed.", { object, schema });
    }
    return isValid;
}

/**
 * Validate a transaction against the predefined schema.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction is valid, otherwise false.
 */
function validateTransaction(transaction) {
    return validateSchema(transaction, SCHEMAS.transaction);
}

/**
 * Validate a block against the predefined schema.
 * @param {Object} block - The block to validate.
 * @returns {boolean} - True if the block is valid, otherwise false.
 */
function validateBlock(block) {
    return validateSchema(block, SCHEMAS.block);
}

/**
 * Validate a shard against the predefined schema.
 * @param {Object} shard - The shard to validate.
 * @returns {boolean} - True if the shard is valid, otherwise false.
 */
function validateShard(shard) {
    return validateSchema(shard, SCHEMAS.shard);
}

/**
 * Verify a digital signature.
 * @param {string} data - The data to verify.
 * @param {string} signature - The digital signature.
 * @param {string} publicKey - The public key to verify against.
 * @returns {boolean} - True if the signature is valid, otherwise false.
 */
function verifySignature(data, signature, publicKey) {
    try {
        const verifier = crypto.createVerify("SHA256");
        verifier.update(data);
        verifier.end();

        const isValid = verifier.verify(publicKey, Buffer.from(signature, "hex"));
        if (!isValid) {
            logError("Digital signature verification failed.", { data, signature });
        }
        return isValid;
    } catch (error) {
        logError("Error during signature verification.", { error: error.message });
        return false;
    }
}

module.exports = {
    validateTransaction,
    validateBlock,
    validateShard,
    validateSchema,
    verifySignature,
};

// ------------------------------------------------------------------------------
// End of Module: Validation Utilities
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Added shard validation and signature verification utility functions.
// ------------------------------------------------------------------------------
