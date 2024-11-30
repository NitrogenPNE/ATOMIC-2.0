"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Block Validator
//
// Description:
// Validates blocks in the ATOMIC blockchain to ensure compliance with consensus
// rules, integrity standards, and proper transaction structure.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For hash verification.
// - validationUtils.js: Common utilities for validating block structure.
// - loggingUtils.js: For structured logging of validation results.
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const { validateBlockSchema, validateTransactions } = require("./validationUtils");
const { logOperation, logError } = require("../../Logger/script/logger");

/**
 * Validates a blockchain block for integrity and consensus compliance.
 * @param {Object} block - The block object to validate.
 * @param {string} previousHash - The hash of the previous block in the chain.
 * @returns {boolean} - Returns true if the block is valid; false otherwise.
 */
async function validateBlock(block, previousHash) {
    try {
        logOperation("Block Validation", { blockIndex: block.index, blockHash: block.hash });

        // Step 1: Validate block schema
        if (!validateBlockSchema(block)) {
            logError("Block schema validation failed.", { blockIndex: block.index });
            return false;
        }

        // Step 2: Validate previous hash linkage
        if (block.previousHash !== previousHash) {
            logError("Previous hash mismatch.", {
                blockIndex: block.index,
                expectedPreviousHash: previousHash,
                actualPreviousHash: block.previousHash,
            });
            return false;
        }

        // Step 3: Verify block hash
        const blockHash = calculateBlockHash(block);
        if (block.hash !== blockHash) {
            logError("Block hash mismatch.", {
                blockIndex: block.index,
                expectedHash: blockHash,
                actualHash: block.hash,
            });
            return false;
        }

        // Step 4: Validate transactions
        if (!validateTransactions(block.transactions)) {
            logError("Transaction validation failed.", { blockIndex: block.index });
            return false;
        }

        logOperation("Block validation successful.", { blockIndex: block.index });
        return true;
    } catch (error) {
        logError("Block validation error.", { error: error.message, blockIndex: block.index });
        return false;
    }
}

/**
 * Calculates the hash of a block based on its content.
 * @param {Object} block - The block object.
 * @returns {string} - The calculated hash of the block.
 */
function calculateBlockHash(block) {
    const blockData = `${block.index}${block.previousHash}${block.timestamp}${JSON.stringify(
        block.transactions
    )}${block.nonce}`;
    return crypto.createHash("sha256").update(blockData).digest("hex");
}

module.exports = { validateBlock };

// ------------------------------------------------------------------------------
// End of Module: Block Validator
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------
