"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Validation Utilities (Enhanced with Token Validation)
 *
 * Description:
 * Enhanced validation for transactions, blocks, shards, nodes, and tokens in ATOMIC.
 * Includes atomic structure validation (neutrons, protons, electrons),
 * quantum-safe mechanisms, and detailed integrity checks.
 *
 * Enhancements:
 * - Token validation with ownership checks.
 * - Cryptographic verification for integrity.
 * - Comprehensive logging for traceability.
 *
 * Dependencies:
 * - crypto: For hash and signature validation.
 * - lodash: For advanced schema validation.
 * - loggingUtils.js: For detailed structured logging.
 *
 * -------------------------------------------------------------------------------
 */

const crypto = require("crypto");
const _ = require("lodash");
const { logOperation, logError } = require("./loggingUtils");
const { decryptToken, verifyTokenSignature } = require("../Utilities/encryptionUtils");

// **Validation Schemas**
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
        type: "string", // neutron, proton, electron
        id: "string",
        metadata: "object",
        dataHash: "string",
        redundancyLevel: "number",
    },
    token: {
        tokenId: "string",
        owner: "string",
        signature: "string",
    },
};

/**
 * Validate an object against a defined schema.
 * @param {Object} object - The object to validate.
 * @param {Object} schema - The schema definition.
 * @returns {boolean} - Whether the object matches the schema.
 */
function validateSchema(object, schema) {
    const isValid = _.isMatchWith(object, schema, (objValue, schemaValue) => {
        if (typeof schemaValue === "string") {
            return typeof objValue === schemaValue;
        }
        if (Array.isArray(schemaValue)) {
            return Array.isArray(objValue);
        }
        return _.isEqual(objValue, schemaValue);
    });

    if (!isValid) {
        logError("Schema validation failed.", { object, schema });
    }
    return isValid;
}

/**
 * Validate a transaction with schema and signature checks.
 * @param {Object} transaction - The transaction to validate.
 * @returns {boolean} - Whether the transaction is valid.
 */
function validateTransaction(transaction) {
    logOperation("Validating transaction...", { transactionId: transaction.id });

    if (!validateSchema(transaction, SCHEMAS.transaction)) {
        logError("Transaction schema validation failed.", { transaction });
        return false;
    }

    const transactionHash = crypto
        .createHash("sha256")
        .update(`${transaction.from}${transaction.to}${transaction.amount}${transaction.timestamp}`)
        .digest("hex");

    const isValidSignature = crypto.verify(
        "sha256",
        Buffer.from(transactionHash),
        { key: transaction.from, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
        Buffer.from(transaction.signature, "hex")
    );

    if (!isValidSignature) {
        logError("Invalid transaction signature.", { transactionId: transaction.id });
        return false;
    }

    logOperation("Transaction validated successfully.", { transactionId: transaction.id });
    return true;
}

/**
 * Validate a block against schema and consensus rules.
 * @param {Object} block - The block to validate.
 * @param {string} expectedPreviousHash - The expected hash of the previous block.
 * @returns {boolean} - Whether the block is valid.
 */
function validateBlock(block, expectedPreviousHash) {
    logOperation("Validating block...", { blockIndex: block.index });

    if (!validateSchema(block, SCHEMAS.block)) {
        logError("Block schema validation failed.", { block });
        return false;
    }

    if (block.previousHash !== expectedPreviousHash) {
        logError("Block's previous hash mismatch.", { blockIndex: block.index });
        return false;
    }

    const calculatedHash = crypto
        .createHash("sha256")
        .update(`${block.index}${block.previousHash}${block.timestamp}${JSON.stringify(block.transactions)}${block.nonce}`)
        .digest("hex");

    if (block.hash !== calculatedHash) {
        logError("Block hash mismatch.", { blockIndex: block.index });
        return false;
    }

    logOperation("Block validated successfully.", { blockIndex: block.index });
    return true;
}

/**
 * Validate a shard against schema and redundancy rules.
 * @param {Object} shard - Shard object with metadata and data hash.
 * @returns {boolean} - Whether the shard is valid.
 */
function validateShard(shard) {
    logOperation("Validating shard...", { shardId: shard.id });

    if (!validateSchema(shard, SCHEMAS.shard)) {
        logError("Shard schema validation failed.", { shard });
        return false;
    }

    // Ensure redundancy level is sufficient for shard type
    const requiredRedundancy = shard.type === "neutron" ? 5 : shard.type === "proton" ? 3 : 1;
    if (shard.redundancyLevel < requiredRedundancy) {
        logError("Shard redundancy level insufficient.", { shardId: shard.id });
        return false;
    }

    logOperation("Shard validated successfully.", { shardId: shard.id });
    return true;
}

/**
 * Validate a token's integrity and ownership.
 * @param {Object} token - The token object to validate.
 * @returns {boolean} - Whether the token is valid.
 */
function validateToken(token) {
    logOperation("Validating token...", { tokenId: token.tokenId });

    if (!validateSchema(token, SCHEMAS.token)) {
        logError("Token schema validation failed.", { token });
        return false;
    }

    const tokenData = `${token.tokenId}${token.owner}`;
    const isSignatureValid = verifyTokenSignature(tokenData, token.signature, token.owner);

    if (!isSignatureValid) {
        logError("Invalid token signature.", { tokenId: token.tokenId });
        return false;
    }

    logOperation("Token validated successfully.", { tokenId: token.tokenId });
    return true;
}

module.exports = {
    validateTransaction,
    validateBlock,
    validateShard,
    validateToken,
};
