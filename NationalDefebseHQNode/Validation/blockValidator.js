"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Block Validator
//
// Description:
// Validates blocks within the National Defense HQ Node for the ATOMIC blockchain. 
// Ensures block integrity, compliance with consensus rules, and accurate transaction 
// records. Designed for high-security environments.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For hash validation.
// - lodash: For deep comparison of data structures.
// - validationRules.json: Contains block validation and consensus rules.
// - activityAuditLogger.js: Logs block validation activities.
//
// Usage:
// const { validateBlock } = require('./blockValidator');
// validateBlock(block, previousBlock).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const _ = require("lodash");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const validationRules = require("../Config/validationRules.json");

/**
 * Validates a block's structure and integrity.
 * @param {Object} block - The block to validate.
 * @param {Object} previousBlock - The preceding block in the blockchain.
 * @returns {Promise<boolean>} - Whether the block is valid.
 */
async function validateBlock(block, previousBlock) {
    logInfo(`Validating block: ${block.index}`);

    try {
        // Step 1: Validate block structure
        if (!validateBlockStructure(block)) {
            logError(`Block structure validation failed for block: ${block.index}`);
            return false;
        }

        // Step 2: Verify previous hash
        if (block.previousHash !== previousBlock.hash) {
            logError(`Block ${block.index} has an invalid previous hash.`);
            return false;
        }

        // Step 3: Validate block hash
        const calculatedHash = calculateBlockHash(block);
        if (block.hash !== calculatedHash) {
            logError(`Invalid hash for block ${block.index}: Expected ${calculatedHash}, got ${block.hash}`);
            return false;
        }

        // Step 4: Validate transactions
        if (!validateTransactions(block.transactions)) {
            logError(`Transaction validation failed for block ${block.index}`);
            return false;
        }

        // Step 5: Consensus rules
        if (!validateConsensusRules(block)) {
            logError(`Block ${block.index} violates consensus rules.`);
            return false;
        }

        logInfo(`Block ${block.index} validated successfully.`);
        return true;
    } catch (error) {
        logError(`Error validating block ${block.index}: ${error.message}`);
        throw error;
    }
}

/**
 * Validates the structure of a block.
 * @param {Object} block - The block to validate.
 * @returns {boolean} - Whether the block structure is valid.
 */
function validateBlockStructure(block) {
    const requiredFields = ["index", "previousHash", "timestamp", "transactions", "hash", "nonce"];
    const hasAllFields = requiredFields.every((field) => Object.prototype.hasOwnProperty.call(block, field));

    if (!hasAllFields) {
        logError("Block structure is missing required fields.", { block });
        return false;
    }

    if (!Array.isArray(block.transactions)) {
        logError("Block transactions must be an array.", { block });
        return false;
    }

    return true;
}

/**
 * Calculates the hash of a block.
 * @param {Object} block - The block to hash.
 * @returns {string} - The calculated hash.
 */
function calculateBlockHash(block) {
    const blockData = `${block.index}${block.previousHash}${block.timestamp}${JSON.stringify(block.transactions)}${block.nonce}`;
    return crypto.createHash("sha256").update(blockData).digest("hex");
}

/**
 * Validates the transactions within a block.
 * @param {Array<Object>} transactions - Array of transactions to validate.
 * @returns {boolean} - Whether all transactions are valid.
 */
function validateTransactions(transactions) {
    return transactions.every((transaction) => validateTransaction(transaction));
}

/**
 * Validates an individual transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - Whether the transaction is valid.
 */
function validateTransaction(transaction) {
    const requiredFields = ["id", "from", "to", "amount", "timestamp", "signature"];
    const hasAllFields = requiredFields.every((field) => Object.prototype.hasOwnProperty.call(transaction, field));

    if (!hasAllFields) {
        logError("Transaction is missing required fields.", { transaction });
        return false;
    }

    // Validate digital signature
    const transactionHash = crypto
        .createHash("sha256")
        .update(`${transaction.from}${transaction.to}${transaction.amount}${transaction.timestamp}`)
        .digest("hex");

    const isValidSignature = crypto.verify(
        "sha256",
        Buffer.from(transactionHash, "hex"),
        { key: transaction.from, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
        Buffer.from(transaction.signature, "hex")
    );

    if (!isValidSignature) {
        logError("Invalid transaction signature.", { transaction });
        return false;
    }

    return true;
}

/**
 * Validates a block against consensus rules.
 * @param {Object} block - The block to validate.
 * @returns {boolean} - Whether the block complies with consensus rules.
 */
function validateConsensusRules(block) {
    const { maxTransactions, maxBlockSizeBytes } = validationRules.consensus;

    if (block.transactions.length > maxTransactions) {
        logError(`Block ${block.index} exceeds maximum transaction limit: ${maxTransactions}`);
        return false;
    }

    const blockSize = Buffer.byteLength(JSON.stringify(block), "utf8");
    if (blockSize > maxBlockSizeBytes) {
        logError(`Block ${block.index} exceeds maximum block size: ${maxBlockSizeBytes} bytes`);
        return false;
    }

    return true;
}

module.exports = {
    validateBlock,
};