"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// GOVMintHQNode Blockchain Consensus
//
// Description:
// This module integrates the GOVMintHQNode with the ATOMIC blockchain by
// referencing the core quantumConsensus.js for shard validation and consensus.
//
// Dependencies:
// - quantumConsensus.js: Implements the quantum-resistant consensus mechanism.
//
// Author: GOVMintHQNode Integration Team
// ------------------------------------------------------------------------------

const path = require("path");
const { executeQuantumConsensus } = require(path.resolve(__dirname, "../../atomic-blockchain/core/quantumConsensus.js"));

/**
 * Execute consensus for the GOVMintHQNode using ATOMIC blockchain's quantum consensus.
 * @param {Array} blockchain - The current state of the blockchain.
 * @param {Array} peers - The list of peers in the GOVMintHQNode network.
 * @returns {Promise<Object>} - The result of the consensus operation.
 */
async function executeGOVMintConsensus(blockchain, peers) {
    console.log("Starting GOVMintHQNode consensus process...");
    return await executeQuantumConsensus(blockchain, peers);
}

/**
 * Exports the GOVMintHQNode consensus method.
 */
module.exports = { executeGOVMintConsensus };
