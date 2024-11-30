"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Blockchain Node (Proof-of-Access Enabled)
//
// Description:
// Implements ATOMIC's blockchain functionality with token ledger integration
// and Proof-of-Access (PoA) enforcement for token validation.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const ShardBlock = require("./Block");
const { validateShardIntegrity, validateAtomicStructure, validateBounce } = require("../Monitoring/shardValidator");
const { broadcastShardBlock, discoverPeers } = require("./networkManager");
const { executeQuantumConsensus } = require("./quantumConsensus");
const { logTransaction: logTokenTransaction } = require("../../Pricing/Blockchain/tokenTransactionLedger");
const { logTokenActivity } = require("../../Pricing/Blockchain/carbonTokenLedger");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");

class BlockchainNode {
    constructor(nodeId, nodeType) {
        this.nodeId = nodeId;
        this.nodeType = nodeType; // HQ, Corporate HQ, Branch
        this.peers = [];
        this.blockchain = [];
        this.pendingShards = [];
        this.tokens = {}; // Tracks tokens associated with nodes
    }

    /**
     * Initializes the blockchain node.
     */
    async initialize() {
        console.log(`Initializing ${this.nodeType} node: ${this.nodeId}...`);
        this.blockchain = []; // Load from persistent storage if required
        this.peers = await discoverPeers(this.nodeId, this.nodeType);

        // Validate token on node initialization
        if (!this.validateNodeToken()) {
            throw new Error("Node token validation failed. Initialization aborted.");
        }

        console.log(`Connected to ${this.peers.length} peers.`);
    }

    /**
     * Validates the node's token for Proof-of-Access.
     * @returns {boolean} - True if token is valid, false otherwise.
     */
    validateNodeToken() {
        const tokenId = this.nodeId; // Assume node ID corresponds to token ID
        const tokenMetadata = this.tokens[tokenId];

        if (!tokenMetadata) {
            console.warn(`Token for node ${this.nodeId} is missing.`);
            return false;
        }

        const { valid, error } = validateToken(tokenId, tokenMetadata.encryptedToken);
        if (!valid) {
            console.error(`Token validation failed for node ${this.nodeId}: ${error}`);
            return false;
        }

        console.log(`Token validated successfully for node ${this.nodeId}.`);
        return true;
    }

    /**
     * Validates a token during consensus participation.
     * @param {string} tokenId - The token to validate.
     * @returns {boolean} - True if token is valid, false otherwise.
     */
    validateConsensusToken(tokenId) {
        const tokenMetadata = this.tokens[tokenId];
        if (!tokenMetadata) {
            console.warn(`Token ${tokenId} is not registered with this node.`);
            return false;
        }

        const { valid, error } = validateToken(tokenId, tokenMetadata.encryptedToken);
        if (!valid) {
            console.error(`Consensus token validation failed: ${error}`);
            return false;
        }

        console.log(`Consensus token validated successfully: ${tokenId}`);
        return true;
    }

    /**
     * Adds a token for node authentication and transaction purposes.
     * @param {string} tokenId - The token to be added.
     * @param {Object} metadata - Metadata associated with the token.
     */
    addToken(tokenId, metadata) {
        if (this.tokens[tokenId]) {
            console.warn(`Token ${tokenId} already exists.`);
            return;
        }

        this.tokens[tokenId] = metadata;
        logTokenActivity({
            tokenId,
            action: "Add",
            nodeId: this.nodeId,
            metadata,
        });

        console.log(`Token added to node: ${tokenId}`);
    }

    /**
     * Processes pending shards into a new block and logs activities.
     */
    async processShardMovements() {
        if (this.pendingShards.length === 0) {
            console.log("No shards to process.");
            return;
        }

        const lastBlock = this.getLastBlock();
        const atomicMetadata = this.calculateAtomicMetadata(this.pendingShards);

        const newBlock = new ShardBlock(
            this.blockchain.length,
            lastBlock ? lastBlock.hash : "0",
            this.pendingShards,
            Date.now(),
            atomicMetadata // Includes atomic-level metadata
        );

        console.log("Processing shard movements...");
        newBlock.finalizeBlock();

        if (validateBounce(newBlock, this.blockchain)) {
            this.blockchain.push(newBlock);

            // Log shard block to shard ledger
            logTokenTransaction({
                blockHash: newBlock.hash,
                action: "Process",
                nodeId: this.nodeId,
                metadata: { shardCount: this.pendingShards.length },
            });

            this.pendingShards = [];
            broadcastShardBlock(newBlock, this.peers);

            console.log(`Shard block processed and broadcasted: ${newBlock.hash}`);
        } else {
            console.warn("Shard block validation failed.");
        }
    }

    /**
     * Logs token activity for blockchain transactions.
     * @param {string} tokenId - The ID of the token involved.
     * @param {Object} activityDetails - Additional details for the activity.
     */
    logTokenActivityForBlockchain(tokenId, activityDetails) {
        if (!this.tokens[tokenId]) {
            console.warn(`Token ${tokenId} does not exist for this node.`);
            return;
        }

        logTokenActivity({
            tokenId,
            action: "Blockchain Transaction",
            nodeId: this.nodeId,
            details: activityDetails,
        });

        console.log(`Token activity logged for: ${tokenId}`);
    }

    /**
     * Retrieves the last block in the blockchain.
     * @returns {Object|null} - The last block or null if the blockchain is empty.
     */
    getLastBlock() {
        return this.blockchain.length > 0 ? this.blockchain[this.blockchain.length - 1] : null;
    }

    /**
     * Starts the quantum-resistant consensus process.
     * Enforces token validation for all participating nodes.
     */
    async startConsensus() {
        console.log("Starting quantum-resistant consensus process...");

        for (const peer of this.peers) {
            if (!this.validateConsensusToken(peer.tokenId)) {
                console.warn(`Peer ${peer.nodeId} failed token validation. Excluded from consensus.`);
                continue;
            }
        }

        const result = await executeQuantumConsensus(this.blockchain, this.peers);
        if (result.success) {
            console.log("Consensus achieved.");
        } else {
            console.warn("Consensus failed. Initiating recovery...");
        }
    }

    /**
     * Calculates atomic metadata for a set of shards.
     * @param {Array} shards - The shards to analyze.
     * @returns {Object} - The calculated atomic metadata.
     */
    calculateAtomicMetadata(shards) {
        let protonCount = 0;
        let neutronCount = 0;
        let electronCount = 0;

        shards.forEach((shard) => {
            protonCount += shard.protonCount || 0;
            neutronCount += shard.neutronCount || 0;
            electronCount += shard.electronCount || 0;
        });

        return {
            protonCount,
            neutronCount,
            electronCount,
            redundancyLevel: this.calculateRedundancyLevel(shards),
        };
    }

    /**
     * Calculates the redundancy level for a set of shards.
     * @param {Array} shards - The shards to analyze.
     * @returns {number} - The calculated redundancy level.
     */
    calculateRedundancyLevel(shards) {
        const uniqueShardIds = new Set(shards.map((shard) => shard.id));
        return uniqueShardIds.size / shards.length;
    }
}

module.exports = BlockchainNode;
