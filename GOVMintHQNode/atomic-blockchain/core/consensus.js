"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Enhanced Consensus Mechanism with Quantum-Resistant Validation
//
// Description:
// Implements Proof-of-Access (PoA) consensus for ATOMIC's shard-based blockchain.
// Integrates quantum-resistant consensus for secure and scalable operations.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const {
    validateBlockStructure,
    validateTransaction,
    validateShardMetadata,
} = require("../utils/validationUtils");
const { verifyShardIntegrity } = require("../utils/storageManager");
const { executeQuantumConsensus } = require("./quantumConsensus"); // Import Quantum Consensus

/**
 * Verify consensus for a block against the blockchain.
 * @param {Object} block - The block to validate.
 * @param {Array<Object>} blockchain - The current blockchain.
 * @returns {Promise<boolean>} - True if the block passes consensus, false otherwise.
 */
async function verifyConsensus(block, blockchain) {
    console.log(`Verifying consensus for block: ${block.hash}`);

    // Step 1: Validate block structure
    if (!validateBlockStructure(block)) {
        console.warn("Block structure validation failed.");
        return false;
    }

    // Step 2: Validate shard metadata
    if (!validateShardMetadata(block.shardReferences)) {
        console.warn("Shard metadata validation failed.");
        return false;
    }

    // Step 3: Verify shard integrity (Proof-of-Access)
    if (!verifyShardIntegrity(block.shardReferences)) {
        console.warn(`Shard integrity validation failed for block: ${block.hash}`);
        return false;
    }

    // Step 4: Use quantum consensus for cryptographic and peer-level validation
    console.log("Using quantum consensus for advanced validation...");
    const quantumResult = await executeQuantumConsensus(blockchain, [block]);
    if (!quantumResult.success) {
        console.warn("Quantum consensus validation failed:", quantumResult.message);
        return false;
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

        // Step 2: Validate each proposed block using quantum consensus
        const validBlocks = [];
        for (const block of blockProposals) {
            const isValid = await verifyConsensus(block, blockchain);
            if (isValid) validBlocks.push(block);
        }

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