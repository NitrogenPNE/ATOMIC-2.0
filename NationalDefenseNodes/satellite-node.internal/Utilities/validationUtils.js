"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Node Validation Utilities
// ------------------------------------------------------------------------------

// Dependencies
const { validateTransaction, validateBlock, validateShard, validateToken } = require("../../../atomic-blockchain/Utilities/validationUtils");
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
 * Wrapper for transaction validation with logging.
 * @param {Object} transaction - The transaction object to validate.
 * @returns {boolean} - Whether the transaction is valid.
 */
function validateTransactionWithLogging(transaction) {
    logger.info("Starting transaction validation...", { transactionId: transaction.id });
    const isValid = validateTransaction(transaction);

    if (isValid) {
        logger.info("Transaction validated successfully.", { transactionId: transaction.id });
    } else {
        logger.error("Transaction validation failed.", { transactionId: transaction.id });
    }

    return isValid;
}

/**
 * Wrapper for block validation with logging.
 * @param {Object} block - The block object to validate.
 * @param {string} expectedPreviousHash - The expected hash of the previous block.
 * @returns {boolean} - Whether the block is valid.
 */
function validateBlockWithLogging(block, expectedPreviousHash) {
    logger.info("Starting block validation...", { blockIndex: block.index });
    const isValid = validateBlock(block, expectedPreviousHash);

    if (isValid) {
        logger.info("Block validated successfully.", { blockIndex: block.index });
    } else {
        logger.error("Block validation failed.", { blockIndex: block.index });
    }

    return isValid;
}

/**
 * Wrapper for shard validation with logging.
 * @param {Object} shard - The shard object to validate.
 * @returns {boolean} - Whether the shard is valid.
 */
function validateShardWithLogging(shard) {
    logger.info("Starting shard validation...", { shardId: shard.id });
    const isValid = validateShard(shard);

    if (isValid) {
        logger.info("Shard validated successfully.", { shardId: shard.id });
    } else {
        logger.error("Shard validation failed.", { shardId: shard.id });
    }

    return isValid;
}

/**
 * Wrapper for token validation with logging.
 * @param {Object} token - The token object to validate.
 * @returns {boolean} - Whether the token is valid.
 */
function validateTokenWithLogging(token) {
    logger.info("Starting token validation...", { tokenId: token.tokenId });
    const isValid = validateToken(token);

    if (isValid) {
        logger.info("Token validated successfully.", { tokenId: token.tokenId });
    } else {
        logger.error("Token validation failed.", { tokenId: token.tokenId });
    }

    return isValid;
}

module.exports = {
    validateTransactionWithLogging,
    validateBlockWithLogging,
    validateShardWithLogging,
    validateTokenWithLogging
};