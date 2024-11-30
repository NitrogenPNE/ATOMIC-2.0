"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Block Validator
 *
 * Description:
 * Validates blocks in the blockchain for Corporate Node 2. Ensures that
 * blocks adhere to structural, cryptographic, and consensus rules.
 * -------------------------------------------------------------------------
 */

const crypto = require("crypto");
const { validateBlockStructure, validateTransactions } = require("../utils/validationUtils");
const { verifyConsensus } = require("../Consensus/consensusMechanism");
const { getShardMetadata } = require("../ShardManager/shardValidationUtils");

/**
 * Validate the structure of a block.
 * @param {Object} block - The block to validate.
 * @returns {boolean} - True if the block structure is valid, false otherwise.
 */
function validateBlockStructure(block) {
    console.log(`Validating block structure for block: ${block.hash}`);
    const isValid = validateBlockStructure(block);
    if (!isValid) {
        console.warn(`Block structure validation failed for block: ${block.hash}`);
    }
    return isValid;
}

/**
 * Validate the cryptographic integrity of a block.
 * @param {Object} block - The block to validate.
 * @returns {boolean} - True if the block's cryptographic properties are valid, false otherwise.
 */
function validateBlockIntegrity(block) {
    try {
        const blockData = JSON.stringify({
            index: block.index,
            previousHash: block.previousHash,
            timestamp: block.timestamp,
            transactions: block.transactions,
            metadata: block.metadata,
        });

        const computedHash = crypto.createHash("sha256").update(blockData).digest("hex");
        const isValid = computedHash === block.hash;

        if (!isValid) {
            console.warn(`Block integrity check failed for block: ${block.hash}`);
        }

        return isValid;
    } catch (error) {
        console.error(`Error validating block integrity for block: ${block.hash}`, error.message);
        return false;
    }
}

/**
 * Validate the transactions within a block.
 * @param {Object} block - The block to validate.
 * @returns {boolean} - True if all transactions are valid, false otherwise.
 */
function validateBlockTransactions(block) {
    console.log(`Validating transactions in block: ${block.hash}`);
    const isValid = validateTransactions(block.transactions);
    if (!isValid) {
        console.warn(`Transaction validation failed for block: ${block.hash}`);
    }
    return isValid;
}

/**
 * Validate the shard metadata included in a block.
 * @param {Object} block - The block to validate.
 * @returns {boolean} - True if the shard metadata is valid, false otherwise.
 */
async function validateShardMetadata(block) {
    try {
        console.log(`Validating shard metadata for block: ${block.hash}`);
        for (const shard of block.metadata.shards) {
            const shardMetadata = await getShardMetadata(shard.id);
            if (!shardMetadata || shardMetadata.hash !== shard.expectedHash) {
                console.warn(`Invalid shard metadata for shard: ${shard.id} in block: ${block.hash}`);
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error(`Error validating shard metadata for block: ${block.hash}`, error.message);
        return false;
    }
}

/**
 * Validate the consensus rules for a block.
 * @param {Object} block - The block to validate.
 * @param {Array} blockchain - The current state of the blockchain.
 * @returns {boolean} - True if the block satisfies consensus rules, false otherwise.
 */
function validateBlockConsensus(block, blockchain) {
    console.log(`Validating consensus for block: ${block.hash}`);
    const isValid = verifyConsensus(block, blockchain);
    if (!isValid) {
        console.warn(`Consensus validation failed for block: ${block.hash}`);
    }
    return isValid;
}

/**
 * Validate a block against all rules (structure, integrity, transactions, shards, and consensus).
 * @param {Object} block - The block to validate.
 * @param {Array} blockchain - The current state of the blockchain.
 * @returns {boolean} - True if the block passes all validation checks, false otherwise.
 */
async function validateBlock(block, blockchain) {
    console.log(`Starting validation for block: ${block.hash}`);

    const isStructureValid = validateBlockStructure(block);
    const isIntegrityValid = validateBlockIntegrity(block);
    const areTransactionsValid = validateBlockTransactions(block);
    const isShardMetadataValid = await validateShardMetadata(block);
    const isConsensusValid = validateBlockConsensus(block, blockchain);

    const isValid = isStructureValid && isIntegrityValid && areTransactionsValid && isShardMetadataValid && isConsensusValid;

    if (isValid) {
        console.log(`Block validation passed for block: ${block.hash}`);
    } else {
        console.warn(`Block validation failed for block: ${block.hash}`);
    }

    return isValid;
}

module.exports = {
    validateBlockStructure,
    validateBlockIntegrity,
    validateBlockTransactions,
    validateShardMetadata,
    validateBlockConsensus,
    validateBlock,
};
