"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Block Validator
//
// Description:
// Implements validation logic for blockchain blocks within the ATOMIC network,
// ensuring structural integrity, shard compliance, and quantum-resistant security.
// 
// Features:
// - Validates block structure and parent hash consistency.
// - Verifies digital signatures using post-quantum cryptography.
// - Checks shard compliance and metadata integrity.
// - Supports Proof-of-Access (PoA) consensus rules.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { validateBlockStructure, validateShardMetadata } = require("../../../../Utils/validationUtils");
const { verifyQuantumSignature } = require("../../../../Utils/quantumCrypto");
const { validateTransactions } = require("../../../../Utils/transactionUtils");
const { getLastBlockHash } = require("../../../../Core/ledgerManager");

/**
 * Validate a blockchain block.
 * @param {Object} block - The block to validate.
 * @param {Object} blockchain - The current state of the blockchain.
 * @returns {boolean} - True if the block is valid, false otherwise.
 */
function validateBlock(block, blockchain) {
    console.log(`Validating block with hash: ${block.hash}`);

    // Step 1: Validate the block structure
    if (!validateBlockStructure(block)) {
        console.error("Block structure validation failed.");
        return false;
    }

    // Step 2: Verify the digital signature
    if (!verifyQuantumSignature(block.hash, block.signature, block.publicKey)) {
        console.error("Block signature verification failed.");
        return false;
    }

    // Step 3: Check parent hash consistency
    const lastBlockHash = getLastBlockHash(blockchain);
    if (block.previousHash !== lastBlockHash) {
        console.error("Block's previous hash does not match the last block hash.");
        return false;
    }

    // Step 4: Validate shard metadata integrity
    if (!validateShardMetadata(block.shardMetadata)) {
        console.error("Shard metadata validation failed.");
        return false;
    }

    // Step 5: Validate transactions in the block
    if (!validateTransactions(block.transactions)) {
        console.error("Transaction validation failed within the block.");
        return false;
    }

    console.log("Block validation successful.");
    return true;
}

module.exports = {
    validateBlock,
};
