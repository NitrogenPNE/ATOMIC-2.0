"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Validation Utils
//
// Description:
// Provides reusable validation utilities for schemas, logic, and compliance 
// checks of smart contracts, transactions, blocks, and shards.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - ajv: JSON schema validation library.
// - crypto: For hash validation.
//
// Usage:
// const { validateSchema, validateLogic } = require('./validationUtils');
// const isValid = validateSchema(data, schema);
// ------------------------------------------------------------------------------

const Ajv = require("ajv");
const crypto = require("crypto");

// JSON Schema Validator
const ajv = new Ajv({ allErrors: true, removeAdditional: true });

/**
 * Validates an object against a given JSON schema.
 * @param {Object} object - The object to validate.
 * @param {Object} schema - The JSON schema to validate against.
 * @returns {boolean} - True if valid; otherwise, throws an error.
 */
function validateSchema(object, schema) {
    const validate = ajv.compile(schema);

    if (!validate(object)) {
        const errorMessages = validate.errors.map((err) => `${err.instancePath} ${err.message}`).join(", ");
        throw new Error(`Schema validation failed: ${errorMessages}`);
    }

    return true;
}

/**
 * Validates the logical rules of a smart contract.
 * @param {Object} contractContent - Parsed JSON content of the smart contract.
 * @returns {boolean} - True if logic is valid; otherwise, throws an error.
 */
function validateLogic(contractContent) {
    // Example logic validation: Ensure no infinite loops or unsafe operations
    if (!contractContent.functions || contractContent.functions.length === 0) {
        throw new Error("Contract logic validation failed: No functions defined.");
    }

    contractContent.functions.forEach((fn) => {
        if (fn.name === "infiniteLoop") {
            throw new Error(`Contract contains an unsafe function: ${fn.name}`);
        }
    });

    return true;
}

/**
 * Validates the hash of a smart contract.
 * @param {Buffer} fileBuffer - The contract file's content.
 * @param {string} expectedHash - The expected hash value.
 * @param {string} algorithm - The hash algorithm to use (default: "sha256").
 * @returns {boolean} - True if the hash matches; otherwise, throws an error.
 */
function validateHash(fileBuffer, expectedHash, algorithm = "sha256") {
    const calculatedHash = crypto.createHash(algorithm).update(fileBuffer).digest("hex");

    if (calculatedHash !== expectedHash) {
        throw new Error(`Hash validation failed. Expected: ${expectedHash}, Got: ${calculatedHash}`);
    }

    return true;
}

module.exports = {
    validateSchema,
    validateLogic,
    validateHash,
};

// ------------------------------------------------------------------------------
// End of Module: Validation Utils
// Version: 1.0.0 | Updated: 2024-11-24
// ------------------------------------------------------------------------------
