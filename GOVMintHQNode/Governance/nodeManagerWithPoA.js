"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Enhanced Node Manager
 *
 * Description:
 * Registers nodes, assigns tokens, manages subscriptions, and validates Proof-of-Access (PoA).
 * Integrates with blockchain for event logging, shard allocation for redundancy, and 
 * secure connection management for compliance with ATOMIC standards.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const path = require("path");
const { issueToken, validateToken } = require("../../HQNode/Subscriptions/tokenIssuer");
const { assignAddress } = require("../../HQNode/Subscriptions/addressIssuer");
const { logBlockchainEvent } = require("../../HQNode/Subscriptions/blockchainLogger");
const { manageSubscription } = require("../../HQNode/Subscriptions/subscriptionManager");
const { allocateShard } = require("../../HQNode/Subscriptions/shardAllocator");

// Config paths
const NODE_REGISTRY_PATH = path.resolve(__dirname, "../Config/NodeRegistry.json");

/**
 * Register a node, assign tokens, and manage subscriptions.
 * @param {Object} nodeDetails - Metadata about the new node.
 */
async function registerNode(nodeDetails) {
    try {
        console.log(`Registering node: ${nodeDetails.name} (${nodeDetails.type})`);

        // Step 1: Assign a unique blockchain-compliant address
        const address = await assignAddress(nodeDetails.name);

        // Step 2: Issue a unique token for PoA
        const tokenDetails = await issueToken(address);

        // Step 3: Add node to subscription ledger
        const subscriptionData = {
            address,
            type: nodeDetails.type,
            roles: nodeDetails.roles || [],
            createdAt: new Date().toISOString(),
            tokenId: tokenDetails.tokenId,
        };
        await manageSubscription(subscriptionData);

        // Step 4: Log the registration event to the blockchain
        await logBlockchainEvent({
            action: "RegisterNode",
            nodeName: nodeDetails.name,
            address,
            token: tokenDetails.tokenId,
        });

        // Step 5: Allocate initial shards if applicable
        if (nodeDetails.type === "ShardNode" || nodeDetails.type === "ValidationNode") {
            const allocationResult = await allocateShard(address, nodeDetails.shardPreferences || {});
            if (!allocationResult.success) {
                throw new Error(`Shard allocation failed for node: ${nodeDetails.name}`);
            }
        }

        console.log(`Node registered successfully: ${nodeDetails.name}`);
        console.log(`Assigned Address: ${address}`);
        console.log(`Assigned Token: ${tokenDetails.tokenId}`);
    } catch (error) {
        console.error("Error registering node:", error.message);
        throw error;
    }
}

/**
 * Validate a node's token for Proof-of-Access.
 * @param {string} nodeAddress - Node's unique address.
 * @param {string} providedToken - The token to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
async function validateNodeToken(nodeAddress, providedToken) {
    try {
        const isValid = await validateToken(nodeAddress, providedToken);
        console.log(`Token validation for ${nodeAddress}: ${isValid ? "Success" : "Failure"}`);
        return isValid;
    } catch (error) {
        console.error("Error validating node token:", error.message);
        return false;
    }
}

/**
 * Example: Register and validate a node.
 */
async function main() {
    try {
        console.log("Initializing GOVMintHQNode Node Manager...");

        // Example: Register a new node
        await registerNode({
            name: "Validation Node 1",
            type: "ValidationNode",
            roles: ["ValidateTransactions", "ValidateShards"],
        });

        // Example: Validate a node's token
        const isValid = await validateNodeToken("node://validation-node1.internal", "SOME_FAKE_TOKEN");
        console.log(`Node Token Validation Result: ${isValid}`);
    } catch (error) {
        console.error("Error in Node Manager:", error.message);
    }
}

// Execute if the script is run directly
if (require.main === module) {
    main();
}

module.exports = {
    registerNode,
    validateNodeToken,
};