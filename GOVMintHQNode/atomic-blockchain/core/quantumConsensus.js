"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Quantum-Resistant Consensus
//
// Description:
// Implements a quantum-resistant consensus mechanism to validate shard blocks
// and ensure the integrity of the ATOMIC blockchain.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { generateLatticeKeyPair, signData, verifySignature } = require("../Utilities/quantumCryptoUtils");
const { verifyRedundancy, calculateRedundancyScore } = require("../Utilities/redundancyVerifier");
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

        // Request peer agreement
        console.log("Requesting peer agreement...");
        const peerAgreements = await requestPeerAgreement(proposedBlock, peers);
        const minAgreement = Math.max(3, Math.ceil(peers.length * 0.67)); // Ensure a minimum quorum
        if (peerAgreements < minAgreement) {
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
 * Request agreement from peers for a proposed block.
 * @param {Object} proposedBlock - The block proposed for consensus.
 * @param {Array} peers - The list of peers in the network.
 * @returns {Promise<number>} - The number of peers that agreed to the block.
 */
async function requestPeerAgreement(proposedBlock, peers) {
    const agreements = await Promise.all(
        peers.map(async (peer) => {
            try {
                const response = await broadcastToPeers("validateBlock", { block: proposedBlock }, peer);
                return response.agree ? 1 : 0;
            } catch (error) {
                console.warn(`Failed to get agreement from peer ${peer.id}:`, error.message);
                return 0;
            }
        })
    );

    return agreements.reduce((sum, agreement) => sum + agreement, 0);
}

module.exports = { executeQuantumConsensus };