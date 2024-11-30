"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Enhanced Consensus Mechanism
//
// Description:
// Implements Proof-of-Access (PoA) consensus for ATOMIC's shard-based blockchain.
// Features quantum-resistant signatures, atomic-level metadata validation, and
// military-specific shard handling.
//
// Dependencies:
// - crypto: For hashing and encryption.
// - validationUtils.js: Utilities for shard and block validation.
// - quantumSignature.js: Post-quantum signature utilities.
// - storageManager.js: Shard access and integrity management.
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const {
    validateBlockStructure,
    validateTransaction,
    validateShardMetadata,
    validateAtomicMetadata,
} = require("../utils/validationUtils");
const { verifyShardIntegrity } = require("../utils/storageManager");
const { signBlock, verifySignature } = require("../utils/quantumSignature");

/**
 * Verify consensus for a block against the blockchain.
 * @param {Object} block - The block to validate.
 * @param {Array<Object>} blockchain - The current blockchain.
 * @returns {boolean} - True if the block passes consensus, false otherwise.
 */
function verifyConsensus(block, blockchain) {
    console.log(`Verifying consensus for block: ${block.hash}`);

    // Step 1: Validate block structure
    if (!validateBlockStructure(block)) {
        console.warn("Block structure validation failed.");
        return false;
    }

    // Step 2: Validate atomic metadata (protons, neutrons, electrons)
    if (!validateAtomicMetadata(block.atomicMetadata)) {
        console.warn("Atomic metadata validation failed.");
        return false;
    }

    // Step 3: Verify the block's digital signature
    if (!verifySignature(block.signature, block.hash, block.publicKey)) {
        console.warn("Block signature validation failed.");
        return false;
    }

    // Step 4: Validate the block's parent
    const lastBlock = blockchain.length > 0 ? blockchain[blockchain.length - 1] : null;
    if (lastBlock && block.previousHash !== lastBlock.hash) {
        console.warn("Block's previous hash does not match the last block.");
        return false;
    }

    // Step 5: Verify shard integrity (Proof-of-Access)
    if (!verifyShardIntegrity(block.shardReferences)) {
        console.warn(`Shard integrity validation failed for block: ${block.hash}`);
        return false;
    }

    // Step 6: Validate shard metadata
    if (!validateShardMetadata(block.shardReferences)) {
        console.warn("Shard metadata validation failed.");
        return false;
    }

    // Step 7: Validate transactions within the block
    for (const transaction of block.transactions) {
        if (!validateTransaction(transaction)) {
            console.warn(`Invalid transaction detected in block: ${block.hash}`);
            return false;
        }
    }

    console.log(`Consensus verified successfully for block: ${block.hash}`);
    return true;
}

/**
 * Execute the consensus mechanism across the network.
 * @param {Array<Object>} blockchain - The current blockchain.
 * @param {Array<Object>} peers - List of peer nodes.
 * @returns {Promise<{success: boolean, message: string, statusReport: Object}>} - Consensus result.
 */
async function executeConsensus(blockchain, peers) {
    console.log("Executing consensus across the network...");

    try {
        // Step 1: Gather block proposals from peers
        const blockProposals = await gatherBlockProposals(peers);

        // Step 2: Validate each proposed block
        const validBlocks = blockProposals.filter((block) => verifyConsensus(block, blockchain));

        // Step 3: Select the block with the highest score
        const selectedBlock = selectBlock(validBlocks);

        if (selectedBlock) {
            blockchain.push(selectedBlock);
            console.log(`Consensus achieved. Selected block: ${selectedBlock.hash}`);
            return {
                success: true,
                message: "Consensus achieved.",
                statusReport: generateStatusReport(blockchain, validBlocks, selectedBlock),
            };
        } else {
            console.warn("No valid blocks found during consensus.");
            return {
                success: false,
                message: "No valid blocks found.",
                statusReport: generateStatusReport(blockchain, validBlocks, null),
            };
        }
    } catch (error) {
        console.error("Error during consensus execution:", error.message);
        return { success: false, message: error.message, statusReport: null };
    }
}

/**
 * Select the best block from valid proposals.
 * @param {Array<Object>} validBlocks - Array of valid blocks.
 * @returns {Object|null} - The selected block or null if none are valid.
 */
function selectBlock(validBlocks) {
    if (validBlocks.length === 0) return null;

    // Refined scoring: Consider shard distribution, bounce rates, atomic metadata
    return validBlocks.reduce((bestBlock, currentBlock) => {
        const bestScore = calculateBlockScore(bestBlock);
        const currentScore = calculateBlockScore(currentBlock);
        return currentScore > bestScore ? currentBlock : bestBlock;
    });
}

/**
 * Calculate a score for a block based on its metadata and atomic structure.
 * @param {Object} block - The block to score.
 * @returns {number} - Calculated score.
 */
function calculateBlockScore(block) {
    const shardScore = block.shardReferences.reduce((total, shard) => total + shard.frequency, 0);
    const atomicScore = block.atomicMetadata.protonCount + block.atomicMetadata.neutronCount;
    return (shardScore + atomicScore) / block.shardReferences.length; // Weighted average
}

/**
 * Generate a detailed status report for the consensus process.
 * @param {Array<Object>} blockchain - The current blockchain.
 * @param {Array<Object>} validBlocks - Valid blocks during consensus.
 * @param {Object|null} selectedBlock - The block selected for inclusion.
 * @returns {Object} - Detailed status report.
 */
function generateStatusReport(blockchain, validBlocks, selectedBlock) {
    return {
        blockchainLength: blockchain.length,
        validBlocksCount: validBlocks.length,
        selectedBlock: selectedBlock
            ? {
                hash: selectedBlock.hash,
                shardAccessScore: calculateBlockScore(selectedBlock),
                transactions: selectedBlock.transactions.length,
                atomicMetadata: selectedBlock.atomicMetadata,
            }
            : null,
        timestamp: new Date().toISOString(),
    };
}

module.exports = {
    verifyConsensus,
    executeConsensus,
};