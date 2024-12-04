"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Military-Grade Quantum-Resistant Consensus for GOVMintHQNode
//
// Description:
// Implements an optimized, quantum-resistant consensus mechanism to validate shard blocks
// and ensure the integrity of the ATOMIC blockchain.
//
// Enhancements:
// - Weighted quorum based on node priority.
// - Peer prioritization for critical nodes.
// - Optimized peer agreement requests with batching.
//
// ------------------------------------------------------------------------------

const {
    generateLatticeKeyPair,
    signData,
    verifySignature,
} = require("../Utilities/quantumCryptoUtils");
const {
    verifyRedundancy,
    calculateRedundancyScore,
} = require("../Utilities/redundancyVerifier");
const { broadcastToPeers, receiveFromPeers } = require("./peerNetwork");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");

/**
 * Execute quantum-resistant consensus for a given shard block.
 * @param {Array} blockchain - The current state of the blockchain.
 * @param {Array} peers - The list of peers in the network.
 * @returns {Promise<Object>} - The result of the consensus operation.
 */
async function executeQuantumConsensus(blockchain, peers) {
    console.log("Starting quantum-resistant consensus...");

    const lastBlock = blockchain[blockchain.length - 1];
    const proposedBlock = await receiveFromPeers("proposeBlock");

    if (!proposedBlock) {
        console.warn("No proposed block received for consensus.");
        return { success: false, message: "No block to validate." };
    }

    console.log("Validating the proposed block...");
    const isBlockValid = await validateProposedBlock(proposedBlock, lastBlock, peers);

    if (isBlockValid) {
        console.log("Block validated successfully. Broadcasting consensus agreement...");
        await broadcastToPeers("consensusSuccess", { block: proposedBlock });
        return { success: true, message: "Consensus achieved.", block: proposedBlock };
    } else {
        console.warn("Block validation failed. Broadcasting consensus failure...");
        await broadcastToPeers("consensusFailure", { block: proposedBlock });
        return { success: false, message: "Consensus failed." };
    }
}

/**
 * Validate the proposed block using quantum-resistant cryptographic methods and token-based proof of access.
 * @param {Object} proposedBlock - The block proposed for consensus.
 * @param {Object} lastBlock - The last block in the blockchain.
 * @param {Array} peers - The list of peers in the network.
 * @returns {Promise<boolean>} - True if the block is valid, false otherwise.
 */
async function validateProposedBlock(proposedBlock, lastBlock, peers) {
    try {
        // Validate block's token
        console.log("Validating block token...");
        const tokenValidation = await validateToken(proposedBlock.tokenId, proposedBlock.encryptedToken);
        if (!tokenValidation.valid) {
            console.warn("Block token validation failed:", tokenValidation.error);
            return false;
        }

        // Verify block signature
        console.log("Verifying block signature...");
        const isSignatureValid = verifySignature(
            proposedBlock.hash,
            proposedBlock.signature,
            proposedBlock.publicKey
        );
        if (!isSignatureValid) {
            console.warn("Block signature verification failed.");
            return false;
        }

        // Validate redundancy metadata
        console.log("Validating redundancy...");
        const redundancyScore = calculateRedundancyScore(proposedBlock.shards);
        if (!verifyRedundancy(redundancyScore)) {
            console.warn("Block redundancy verification failed.");
            return false;
        }

        // Check block linkage and integrity
        console.log("Checking block linkage...");
        if (proposedBlock.previousHash !== lastBlock.hash) {
            console.warn("Block linkage verification failed: Previous hash mismatch.");
            return false;
        }

        // Request weighted peer agreement
        console.log("Requesting peer agreement...");
        const peerAgreements = await requestWeightedPeerAgreement(proposedBlock, peers);
        const requiredWeight = calculateQuorumWeight(peers);
        if (peerAgreements < requiredWeight) {
            console.warn("Consensus agreement failed: Insufficient peer support.");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error validating proposed block:", error.message);
        return false;
    }
}

/**
 * Request weighted agreement from peers for a proposed block.
 * @param {Object} proposedBlock - The block proposed for consensus.
 * @param {Array} peers - The list of peers in the network.
 * @returns {Promise<number>} - The total weighted agreement score.
 */
async function requestWeightedPeerAgreement(proposedBlock, peers) {
    const peerPriorities = prioritizePeers(peers);
    const agreements = await Promise.all(
        peerPriorities.map(async (peer) => {
            try {
                const response = await broadcastToPeers("validateBlock", { block: proposedBlock }, peer);
                return response.agree ? peer.weight : 0;
            } catch (error) {
                console.warn(`Failed to get agreement from peer ${peer.id}:`, error.message);
                return 0;
            }
        })
    );

    return agreements.reduce((sum, agreement) => sum + agreement, 0);
}

/**
 * Calculate the quorum weight required for consensus.
 * @param {Array} peers - The list of peers in the network.
 * @returns {number} - The minimum weight required to achieve quorum.
 */
function calculateQuorumWeight(peers) {
    const totalWeight = peers.reduce((sum, peer) => sum + peer.weight, 0);
    return Math.max(3, Math.ceil(totalWeight * 0.67)); // Ensure a minimum 67% weighted agreement
}

/**
 * Prioritize peers for consensus based on role and reliability.
 * @param {Array} peers - The list of peers in the network.
 * @returns {Array} - Sorted peers with priority weights.
 */
function prioritizePeers(peers) {
    return peers
        .map((peer) => ({
            ...peer,
            weight: peer.role === "HQNode" ? 3 : peer.role === "CorporateNode" ? 2 : 1,
        }))
        .sort((a, b) => b.weight - a.weight);
}

module.exports = { executeQuantumConsensus };
