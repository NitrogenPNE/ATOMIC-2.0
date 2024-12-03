"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Alpha Node - Validation Utilities
// ------------------------------------------------------------------------------

// Dependencies
const {
    validateTransactionSchema,
    validateTokenSignature,
    validateBlockSchema,
    validateShardMetadata
} = require("../../../atomic-blockchain/Utilities/validationUtils");
const winston = require("winston");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "../Logs/validationUtils.log" })
    ]
});

/**
 * Validate a transaction with schema and signature checks.
 * @param {Object} transaction - The transaction object.
 * @returns {boolean} - Whether the transaction is valid.
 */
function validateTransaction(transaction) {
    logger.info("Validating transaction...", { transactionId: transaction.id });

    if (!validateTransactionSchema(transaction)) {
        logger.error("Transaction schema validation failed.", { transaction });
        return false;
    }

    const isValidSignature = validateTokenSignature(transaction);
    if (!isValidSignature) {
        logger.error("Transaction signature validation failed.", { transactionId: transaction.id });
        return false;
    }

    logger.info("Transaction validated successfully.", { transactionId: transaction.id });
    return true;
}

/**
 * Validate a block against blockchain schema and rules.
 * @param {Object} block - The block object.
 * @param {string} expectedPreviousHash - The expected hash of the previous block.
 * @returns {boolean} - Whether the block is valid.
 */
function validateBlock(block, expectedPreviousHash) {
    logger.info("Validating block...", { blockIndex: block.index });

    if (!validateBlockSchema(block)) {
        logger.error("Block schema validation failed.", { block });
        return false;
    }

    if (block.previousHash !== expectedPreviousHash) {
        logger.error("Block's previous hash mismatch.", { blockIndex: block.index });
        return false;
    }

    logger.info("Block validated successfully.", { blockIndex: block.index });
    return true;
}

/**
 * Validate shard metadata.
 * @param {Object} shardMetadata - Metadata of the shard to validate.
 * @returns {boolean} - Whether the shard metadata is valid.
 */
function validateShard(shardMetadata) {
    logger.info("Validating shard metadata...", { shardId: shardMetadata.id });

    if (!validateShardMetadata(shardMetadata)) {
        logger.error("Shard metadata validation failed.", { shardId: shardMetadata.id });
        return false;
    }

    logger.info("Shard metadata validated successfully.", { shardId: shardMetadata.id });
    return true;
}

/**
 * Validate a token's integrity and Proof-of-Work (PoW).
 * @param {Object} token - The token object.
 * @returns {boolean} - Whether the token is valid.
 */
function validateToken(token) {
    logger.info("Validating token for PoW...", { tokenId: token.tokenId });

    const isValid = validateTokenSignature(token);
    if (!isValid) {
        logger.error("Token validation failed.", { tokenId: token.tokenId });
        return false;
    }

    logger.info("Token validated successfully.", { tokenId: token.tokenId });
    return true;
}

module.exports = {
    validateTransaction,
    validateBlock,
    validateShard,
    validateToken
};
