"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Transaction Validator
 *
 * Description:
 * This module validates blockchain transactions for CorporateNode3 by checking
 * structural integrity, digital signatures, and shard-specific constraints.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const crypto = require("crypto");
const { verifyDigitalSignature } = require("../../Utils/signatureUtils");
const fs = require("fs-extra");
const path = require("path");

// Configuration
const VALIDATION_LOG_FILE = path.resolve(__dirname, "../../logs/transactionValidation.log");

/**
 * Validates the structure of a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction structure is valid, otherwise false.
 */
function validateTransactionStructure(transaction) {
    if (!transaction || typeof transaction !== "object") {
        log("Transaction validation failed: Invalid transaction structure.");
        return false;
    }

    const requiredFields = ["id", "inputs", "outputs", "timestamp"];
    const missingFields = requiredFields.filter((field) => !(field in transaction));

    if (missingFields.length > 0) {
        log(`Transaction validation failed: Missing fields - ${missingFields.join(", ")}`);
        return false;
    }

    log("Transaction structure validated successfully.");
    return true;
}

/**
 * Verifies the digital signature of a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction signature is valid, otherwise false.
 */
function validateTransactionSignature(transaction) {
    for (const input of transaction.inputs) {
        if (!input.signature || !input.publicKey) {
            log("Transaction signature validation failed: Missing signature or publicKey.");
            return false;
        }

        const messageHash = crypto.createHash("sha256").update(transaction.id).digest("hex");
        if (!verifyDigitalSignature(messageHash, input.signature, input.publicKey)) {
            log(`Transaction signature validation failed for input: ${input.txId}`);
            return false;
        }
    }

    log("Transaction signature validated successfully.");
    return true;
}

/**
 * Validates the inputs and outputs of a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if inputs and outputs are valid, otherwise false.
 */
function validateTransactionInputsOutputs(transaction) {
    const totalInputValue = transaction.inputs.reduce((sum, input) => sum + input.amount, 0);
    const totalOutputValue = transaction.outputs.reduce((sum, output) => sum + output.amount, 0);

    if (totalInputValue !== totalOutputValue) {
        log("Transaction validation failed: Input and output values do not match.");
        return false;
    }

    log("Transaction inputs and outputs validated successfully.");
    return true;
}

/**
 * Validates shard-specific constraints in a transaction.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if shard-specific constraints are satisfied, otherwise false.
 */
function validateShardConstraints(transaction) {
    if (!transaction.shardMetadata) {
        log("Transaction validation failed: Missing shard metadata.");
        return false;
    }

    const { shardID, frequency } = transaction.shardMetadata;
    if (!shardID || frequency < 100 || frequency > 1000) {
        log("Transaction validation failed: Invalid shard metadata constraints.");
        return false;
    }

    log("Shard constraints validated successfully.");
    return true;
}

/**
 * Validates a transaction for inclusion in a block.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - True if the transaction is valid, otherwise false.
 */
function validateTransaction(transaction) {
    log(`Starting validation for transaction ${transaction.id}...`);

    if (!validateTransactionStructure(transaction)) {
        return false;
    }

    if (!validateTransactionSignature(transaction)) {
        return false;
    }

    if (!validateTransactionInputsOutputs(transaction)) {
        return false;
    }

    if (!validateShardConstraints(transaction)) {
        return false;
    }

    log(`Transaction ${transaction.id} validated successfully.`);
    return true;
}

/**
 * Logs messages to the transaction validation log file.
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
    validateTransaction,
};
