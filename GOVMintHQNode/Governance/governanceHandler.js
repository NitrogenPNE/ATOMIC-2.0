"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Governance Handler
 *
 * Description:
 * Automates federated voting for critical operations in the ATOMIC ecosystem.
 * Logs all governance decisions and their results in the blockchain ledger.
 *
 * Author: ATOMIC Development Team
 * ------------------------------------------------------------------------------
 */

const crypto = require("crypto");
const { logBlockchainDecision } = require("../Blockchain/blockchainLogger");
const { validateSignatures, getGovernanceNodes } = require("../Utilities/governanceUtils");

/**
 * Initiates federated voting for a governance action.
 * @param {string} action - The action requiring governance approval.
 * @param {Object} details - Details of the action to be voted on.
 * @param {Array<{ nodeId: string, signature: string }>} signatures - Signatures from governance nodes.
 * @returns {Promise<Object>} - Results of the voting process.
 */
async function initiateFederatedVoting(action, details, signatures) {
    try {
        console.log(`Initiating federated voting for action: ${action}...`);

        // Generate a unique hash for the action
        const actionHash = crypto.createHash("sha256").update(JSON.stringify({ action, details })).digest("hex");

        // Validate signatures from governance nodes
        console.log("Validating governance signatures...");
        const isApproved = await validateSignatures(signatures, actionHash);

        // Log the decision in the blockchain ledger
        console.log("Logging governance decision to the blockchain...");
        await logBlockchainDecision({
            action,
            details,
            signatures,
            approved: isApproved,
            timestamp: new Date().toISOString(),
        });

        console.log(`Federated voting completed for action: ${action}. Approved: ${isApproved}`);
        return {
            action,
            approved: isApproved,
            details,
        };
    } catch (error) {
        console.error("Error during federated voting:", error.message);
        throw error;
    }
}

/**
 * Handles quorum-based decision-making for governance.
 * Ensures a minimum threshold of approval before proceeding with the action.
 * @param {string} action - The action requiring quorum-based approval.
 * @param {Object} details - Details of the action to be decided.
 * @param {Array<{ nodeId: string, vote: boolean }>} votes - Votes from governance nodes.
 * @returns {Object} - Results of the decision-making process.
 */
function handleQuorumDecision(action, details, votes) {
    console.log(`Handling quorum-based decision for action: ${action}...`);

    const totalVotes = votes.length;
    const approvals = votes.filter((vote) => vote.vote).length;
    const quorumRequired = Math.ceil(totalVotes * 0.67); // 67% quorum required

    const decisionApproved = approvals >= quorumRequired;

    // Log the decision to the blockchain ledger
    console.log("Logging quorum decision to the blockchain...");
    logBlockchainDecision({
        action,
        details,
        votes,
        quorumRequired,
        approvals,
        approved: decisionApproved,
        timestamp: new Date().toISOString(),
    });

    console.log(`Quorum decision completed for action: ${action}. Approved: ${decisionApproved}`);
    return {
        action,
        approved: decisionApproved,
        totalVotes,
        approvals,
        quorumRequired,
    };
}

/**
 * Retrieves governance nodes for voting.
 * @returns {Promise<Array>} - List of governance nodes.
 */
async function getGovernanceNodesForVoting() {
    try {
        console.log("Fetching governance nodes for voting...");
        const nodes = await getGovernanceNodes();
        console.log(`Governance nodes retrieved: ${nodes.length}`);
        return nodes;
    } catch (error) {
        console.error("Error fetching governance nodes:", error.message);
        throw error;
    }
}

module.exports = {
    initiateFederatedVoting,
    handleQuorumDecision,
    getGovernanceNodesForVoting,
};

// ------------------------------------------------------------------------------
// End of Module: Governance Handler
// Version: 1.0.0 | Updated: 2024-12-03
// ------------------------------------------------------------------------------
