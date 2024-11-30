"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Block Validator
 *
 * Description:
 * This module validates blockchain blocks for CorporateNode3 by checking
 * structural integrity, digital signatures, and shard metadata consistency.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const crypto = require("crypto");
const { validateTransaction } = require("./transactionValidator");
const { verifyDigitalSignature } = require("../../Utils/signatureUtils");
const fs = require("fs-extra");
const path = require("path");

// Configuration
const VALIDATION_LOG_FILE = path.resolve(__dirname, "../../logs/blockValidation.log");

/**
 * Validates the structure of a block.
 * @param {Object} block - The blockchain block to validate.
 * @returns {boolean} - True if the block structure is valid, otherwise false.
 */
function validateBlockStructure(block) {
    if (!block || typeof block !== "object") {
        log("Block validation failed: Invalid block structure.");
        return false;
    }

    const requiredFields = ["index", "previousHash", "transactions", "timestamp", "nonce", "hash"];
    const missingFields = requiredFields.filter((field) => !(field in block));

    if (missingFields.length > 0) {
        log(`Block validation failed: Missing fields - ${missingFields.join(", ")}`);
        return false;
    }

    log("Block structure validated successfully.");
    return true;
}

/**
 * Verifies the hash integrity of a block.
 * @param {Object} block - The blockchain block to validate.
 * @returns {boolean} - True if the block hash matches its contents, otherwise false.
 */
function validateBlockHash(block) {
    const dataToHash = JSON.stringify({
        index: block.index,
        previousHash: block.previousHash,
        transactions: block.transactions,
        timestamp: block.timestamp,
        nonce: block.nonce,
    });

    const calculatedHash = crypto.createHash("sha256").update(dataToHash).digest("hex");
    if (calculatedHash !== block.hash) {
        log(`Block hash mismatch: expected ${block.hash}, calculated ${calculatedHash}`);
        return false;
    }

    log("Block hash validated successfully.");
    return true;
}

/**
 * Validates all transactions in a block.
 * @param {Array<Object>} transactions - List of transactions in the block.
 * @returns {boolean} - True if all transactions are valid, otherwise false.
 */
function validateBlockTransactions(transactions) {
    if (!Array.isArray(transactions)) {
        log("Transaction validation failed: Transactions are not an array.");
        return false;
    }

    for (const transaction of transactions) {
        if (!validateTransaction(transaction)) {
            log("Transaction validation failed within block.");
            return false;
        }
    }

    log("All transactions in the block validated successfully.");
    return true;
}

/**
 * Validates the digital signature of a block.
 * @param {Object} block - The blockchain block to validate.
 * @returns {boolean} - True if the signature is valid, otherwise false.
 */
function validateBlockSignature(block) {
    if (!block.signature || !block.publicKey) {
        log("Block signature validation failed: Missing signature or publicKey.");
        return false;
    }

    if (!verifyDigitalSignature(block.hash, block.signature, block.publicKey)) {
        log("Block signature validation failed: Invalid signature.");
        return false;
    }

    log("Block signature validated successfully.");
    return true;
}

/**
 * Validates a block for inclusion in the blockchain.
 * @param {Object} block - The blockchain block to validate.
 * @param {Object} previousBlock - The previous block in the blockchain.
 * @returns {boolean} - True if the block is valid, otherwise false.
 */
function validateBlock(block, previousBlock) {
    log(`Starting validation for block ${block.index}...`);

    if (!validateBlockStructure(block)) {
        return false;
    }

    if (!validateBlockHash(block)) {
        return false;
    }

    if (!validateBlockTransactions(block.transactions)) {
        return false;
    }

    if (!validateBlockSignature(block)) {
        return false;
    }

    if (previousBlock && block.previousHash !== previousBlock.hash) {
        log(`Block validation failed: Previous hash mismatch. Expected ${previousBlock.hash}, got ${block.previousHash}`);
        return false;
    }

    log(`Block ${block.index} validated successfully.`);
    return true;
}

/**
 * Logs messages to the block validation log file.
 * @param {string} message - Message to log.
 */
function log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFile(VALIDATION_LOG_FILE, logEntry).catch((error) => {
        console.error(`Failed to write to validation log: ${error.message}`);
    });
}

module.exports = {
    validateBlock,
};
