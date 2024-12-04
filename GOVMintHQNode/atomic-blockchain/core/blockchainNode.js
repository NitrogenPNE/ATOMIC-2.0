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
const { executeConsensus } = require("./consensus");
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

        if (!this.validateNodeToken()) {
            throw new Error("Node token validation failed. Initialization aborted.");
        }

        console.log(`Connected to ${this.peers.length} peers.`);
    }

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

    async startConsensus() {
        console.log("Starting consensus process...");

        for (const peer of this.peers) {
            if (!this.validateConsensusToken(peer.tokenId)) {
                console.warn(`Peer ${peer.nodeId} failed token validation. Excluded from consensus.`);
                continue;
            }
        }

        console.log("Executing quantum-resistant consensus...");
        const quantumResult = await executeQuantumConsensus(this.blockchain, this.peers);

        if (!quantumResult.success) {
            console.warn("Quantum consensus failed. Skipping further validation.");
            return;
        }

        console.log("Quantum consensus succeeded. Proceeding to block-level consensus...");
        const poaResult = await executeConsensus(this.blockchain, this.peers);

        if (poaResult.success) {
            console.log("Block-level consensus achieved.");
        } else {
            console.warn("Block-level consensus failed. Initiating recovery...");
        }
    }

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
            atomicMetadata
        );

        console.log("Processing shard movements...");
        newBlock.finalizeBlock();

        if (validateBounce(newBlock, this.blockchain)) {
            this.blockchain.push(newBlock);

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

    calculateRedundancyLevel(shards) {
        const uniqueShardIds = new Set(shards.map((shard) => shard.id));
        return uniqueShardIds.size / shards.length;
    }
}

module.exports = BlockchainNode;
