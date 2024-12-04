"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Proof-of-Access Consensus
 *
 * Description:
 * Executes quantum-resistant consensus for GOVMintHQNode, leveraging token-based
 * Proof-of-Access and blockchain shard validation.
 *
 * Dependencies:
 * - quantumConsensus.js: Implements quantum-resistant consensus.
 * - tokenValidation.js: Validates tokens for Proof-of-Access operations.
 * - loggingUtils.js: Logs consensus and validation events.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const { executeQuantumConsensus } = require("../../atomic-blockchain/core/quantumConsensus");
const { validateToken, validateAndLogUsage } = require("../../Pricing/TokenManagement/tokenValidation");
const { logOperation, logError } = require("../Utilities/loggingUtils");

/**
 * Executes consensus for a shard block with Proof-of-Access validation.
 * @param {Array} blockchain - The current state of the blockchain.
 * @param {Array} peers - The list of peers in the GOVMintHQNode network.
 * @param {string} tokenId - Token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - Encrypted token for Proof-of-Access validation.
 * @returns {Promise<Object>} - Result of the consensus operation.
 */
async function executeProofOfAccessConsensus(blockchain, peers, tokenId, encryptedToken) {
    try {
        logOperation("Starting Proof-of-Access consensus process...");

        // Step 1: Validate token for Proof-of-Access
        logOperation("Validating token for Proof-of-Access...");
        const isTokenValid = await validateAndLogUsage(tokenId, encryptedToken);
        if (!isTokenValid) {
            logError("Token validation failed for Proof-of-Access.", { tokenId });
            return { success: false, message: "Token validation failed." };
        }
        logOperation("Token validated successfully for Proof-of-Access.");

        // Step 2: Execute quantum-resistant consensus
        logOperation("Executing quantum-resistant consensus...");
        const consensusResult = await executeQuantumConsensus(blockchain, peers);

        if (consensusResult.success) {
            logOperation("Consensus achieved successfully.");
            return { success: true, message: "Consensus achieved.", block: consensusResult.block };
        } else {
            logError("Consensus failed.", { reason: consensusResult.message });
            return { success: false, message: "Consensus failed." };
        }
    } catch (error) {
        logError("Critical error during Proof-of-Access consensus.", { error: error.message });
        return { success: false, message: `Consensus error: ${error.message}` };
    }
}

module.exports = {
    executeProofOfAccessConsensus,
};
