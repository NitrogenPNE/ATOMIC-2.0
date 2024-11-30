"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Shard Block
//
// Description:
// Defines the structure and methods for shard-based blockchain blocks in ATOMIC.
// Tracks shard movements, particle frequencies, and bounce metadata, incorporating
// proton, neutron, and electron atomic data. Verifies tokens for block authentication.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For secure hash generation.
// - validationUtils.js: For block structure and shard validation.
// - tokenValidation.js: For validating the token associated with the block.
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const { validateBlockStructure, validateShardMetadata } = require("../utils/validationUtils");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");

/**
 * Represents a shard block in the ATOMIC blockchain.
 */
class ShardBlock {
    /**
     * Constructs a new shard block.
     * @param {number} index - Block index in the blockchain.
     * @param {string} previousHash - Hash of the previous block.
     * @param {Object[]} shards - List of shard metadata in the block.
     * @param {number} timestamp - Timestamp of the block creation.
     * @param {Object} metadata - Optional metadata for the block (e.g., bounce rates).
     * @param {Object} atomicData - Proton, neutron, and electron data.
     * @param {string} tokenId - Token ID used to authenticate the block.
     * @param {string} encryptedToken - Encrypted token string for validation.
     */
    constructor(index, previousHash, shards, timestamp, metadata = {}, atomicData = {}, tokenId, encryptedToken) {
        this.index = index;
        this.previousHash = previousHash;
        this.shards = shards; // Array of shard metadata
        this.timestamp = timestamp || Date.now();
        this.metadata = metadata; // Additional metadata (e.g., bounce rates)
        this.atomicData = atomicData; // Proton, neutron, electron structures
        this.tokenId = tokenId; // Token ID for authentication
        this.encryptedToken = encryptedToken; // Encrypted token for validation
        this.nonce = 0; // For Proof-of-Access or equivalent consensus
        this.hash = this.calculateHash();
    }

    /**
     * Calculates the hash of the block.
     * @returns {string} - Hexadecimal hash of the block.
     */
    calculateHash() {
        const data = JSON.stringify({
            index: this.index,
            previousHash: this.previousHash,
            shards: this.shards,
            timestamp: this.timestamp,
            metadata: this.metadata,
            atomicData: this.atomicData,
            tokenId: this.tokenId,
            encryptedToken: this.encryptedToken,
            nonce: this.nonce,
        });
        return crypto.createHash("sha3-256").update(data).digest("hex"); // Use SHA-3 for quantum resistance
    }

    /**
     * Validates the block's structure, shard metadata, token, and integrity.
     * @returns {boolean} - True if the block is valid, false otherwise.
     */
    async isValid() {
        if (!validateBlockStructure(this)) {
            console.error("Block structure validation failed.");
            return false;
        }
        if (!validateShardMetadata(this.shards)) {
            console.error("Shard metadata validation failed.");
            return false;
        }
        if (this.hash !== this.calculateHash()) {
            console.error("Block hash does not match calculated hash.");
            return false;
        }
        console.log("Validating token...");
        const tokenValidation = await validateToken(this.tokenId, this.encryptedToken);
        if (!tokenValidation.valid) {
            console.error("Token validation failed:", tokenValidation.error);
            return false;
        }
        return true;
    }

    /**
     * Finalizes the block by validating and recalculating its hash.
     */
    async finalizeBlock() {
        console.log("Finalizing block...");
        this.hash = this.calculateHash();
        if (!(await this.isValid())) {
            throw new Error("Block failed validation during finalization.");
        }
        console.log(`Block finalized: ${this.hash}`);
    }

    /**
     * Mines the block using Proof-of-Access or similar consensus.
     * @param {number} difficulty - Difficulty level for mining (number of leading zeros).
     */
    mineBlock(difficulty) {
        const target = "0".repeat(difficulty);
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log(`Block mined: ${this.hash}`);
    }
}

module.exports = ShardBlock;