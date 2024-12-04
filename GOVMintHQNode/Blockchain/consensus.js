"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode Blockchain Consensus
 * 
 * Description:
 * This module implements federated voting/quorum-based decision-making and logs
 * governance decisions in the blockchain ledger for the GOVMintHQNode.
 * -------------------------------------------------------------------------------
 */

const path = require("path");
const crypto = require("crypto");
const { executeQuantumConsensus } = require(path.resolve(__dirname, "../../atomic-blockchain/core/quantumConsensus.js"));
const { validateToken } = require(path.resolve(__dirname, "../../Pricing/TokenManagement/tokenValidation"));
const { logOperation, logError } = require(path.resolve(__dirname, "../../Utilities/loggingUtils"));
const { loadGovernanceNodes, validateSignatures } = require(path.resolve(__dirname, "../../Governance/governanceUtils"));
const { logBlockchainDecision } = require(path.resolve(__dirname, "../../atomic-blockchain/ledger/blockchainLogger"));

/**
 * Execute consensus for the GOVMintHQNode using federated voting and quantum-resistant consensus.
 * @param {Array} blockchain - The current state of the blockchain.
 * @param {Array} peers - The list of peers in the GOVMintHQNode network.
 * @param {Object} proofOfAccess - Contains PoA token details for the consensus process.
 * @param {Array<{ nodeId: string, signature: string }>} signatures - Signatures for governance approval.
 * @returns {Promise<Object>} - The result of the consensus operation.
 */
async function executeGOVMintConsensus(blockchain, peers, proofOfAccess, signatures) {
    try {
        console.log("Starting GOVMintHQNode consensus process...");

        // Validate Proof-of-Access token
        console.log("Validating Proof-of-Access token...");
        const tokenValidation = await validateToken(proofOfAccess.tokenId, proofOfAccess.encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error(`Invalid PoA token: ${tokenValidation.error}`);
        }
        console.log("Proof-of-Access token validated successfully.");

        // Validate governance signatures
        console.log("Validating governance signatures...");
        const actionHash = crypto.createHash("sha256").update(JSON.stringify({ blockchain, peers })).digest("hex");
        const governanceValidation = await validateSignatures(signatures, actionHash);
        if (!governanceValidation) {
            throw new Error("Governance approval quorum not met.");
        }
        console.log("Governance approval validated successfully.");

        // Execute quantum-resistant consensus
        console.log("Executing quantum-resistant consensus...");
        const consensusResult = await executeQuantumConsensus(blockchain, peers);
        if (!consensusResult.success) {
            throw new Error("Consensus process failed.");
        }
        console.log("Consensus achieved successfully.");

        // Log the governance decision to the blockchain
        console.log("Logging governance decision...");
        await logBlockchainDecision({
            action: "Consensus Execution",
            details: {
                blockchainState: blockchain.length,
                peersCount: peers.length,
                proofOfAccessToken: proofOfAccess.tokenId,
                signatures,
            },
        });

        logOperation("Consensus achieved", {
            blockchainState: blockchain.length,
            peersCount: peers.length,
            proofOfAccessToken: proofOfAccess.tokenId,
        });

        return {
            success: true,
            message: "Consensus completed successfully.",
            details: consensusResult,
        };
    } catch (error) {
        logError("Consensus process failed", { error: error.message, blockchain, peers });
        return {
            success: false,
            message: error.message,
        };
    }
}

module.exports = { executeGOVMintConsensus };
