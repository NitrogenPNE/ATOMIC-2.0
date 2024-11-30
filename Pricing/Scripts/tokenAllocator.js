"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Token Allocator
//
// Description:
// Handles dynamic token allocation for nodes based on their carbon footprint,
// performance, and proof-of-access validation. Optimizes allocation using
// AI-driven insights for load balancing and network efficiency.
//
// Dependencies:
// - predictionEngine.js: Provides insights for token allocation.
// - tokenTransactionLogger.js: Logs allocation transactions.
// - fs-extra: For reading and updating token metadata.
// - path: For file path management.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { predictOptimalAllocation } = require("../../NIKI/predictionEngine");
const { logTokenTransaction } = require("./tokenTransactionLogger");

// Paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");

/**
 * Allocate tokens dynamically based on node performance and requirements.
 * @param {string} nodeId - The unique ID of the node requesting allocation.
 * @param {Object} nodeMetrics - Performance metrics for the node.
 * @param {number} nodeMetrics.carbonFootprint - Carbon footprint of the node.
 * @param {number} nodeMetrics.dataTransferred - Data transferred in GB.
 * @returns {Object} - Allocation details including allocated tokens.
 */
async function allocateTokens(nodeId, nodeMetrics) {
    try {
        console.log(`Allocating tokens for Node ID: ${nodeId}...`);

        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        // Predict the optimal token allocation based on node metrics
        const optimalAllocation = await predictOptimalAllocation(nodeMetrics);

        if (!optimalAllocation || optimalAllocation.tokens <= 0) {
            throw new Error(`No tokens allocated for Node ID: ${nodeId}.`);
        }

        // Update token metadata
        tokenMetadata.circulatingTokens -= optimalAllocation.tokens;
        tokenMetadata.allocatedTokens[nodeId] = (tokenMetadata.allocatedTokens[nodeId] || 0) + optimalAllocation.tokens;
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        // Log the allocation in the transaction log
        const allocationDetails = {
            type: "ALLOCATE",
            tokenId: `allocation-${nodeId}-${Date.now()}`,
            metadata: {
                nodeId,
                tokensAllocated: optimalAllocation.tokens,
                carbonFootprint: nodeMetrics.carbonFootprint,
                dataTransferred: nodeMetrics.dataTransferred,
            },
        };

        await logTokenTransaction(allocationDetails);

        console.log(`Tokens allocated successfully: ${optimalAllocation.tokens} tokens for Node ID: ${nodeId}.`);
        return allocationDetails.metadata;
    } catch (error) {
        console.error(`Error allocating tokens for Node ID: ${nodeId}:`, error.message);
        throw error;
    }
}

/**
 * Deallocate tokens from a node.
 * @param {string} nodeId - The unique ID of the node.
 * @returns {Object} - Details of the deallocation.
 */
async function deallocateTokens(nodeId) {
    try {
        console.log(`Deallocating tokens for Node ID: ${nodeId}...`);

        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        const allocatedTokens = tokenMetadata.allocatedTokens[nodeId] || 0;

        if (allocatedTokens <= 0) {
            throw new Error(`No tokens to deallocate for Node ID: ${nodeId}.`);
        }

        // Update token metadata
        tokenMetadata.circulatingTokens += allocatedTokens;
        delete tokenMetadata.allocatedTokens[nodeId];
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        // Log the deallocation in the transaction log
        const deallocationDetails = {
            type: "DEALLOCATE",
            tokenId: `deallocation-${nodeId}-${Date.now()}`,
            metadata: {
                nodeId,
                tokensDeallocated: allocatedTokens,
            },
        };

        await logTokenTransaction(deallocationDetails);

        console.log(`Tokens deallocated successfully: ${allocatedTokens} tokens for Node ID: ${nodeId}.`);
        return deallocationDetails.metadata;
    } catch (error) {
        console.error(`Error deallocating tokens for Node ID: ${nodeId}:`, error.message);
        throw error;
    }
}

// Example usage if called directly
if (require.main === module) {
    const [action, nodeId, carbonFootprint, dataTransferred] = process.argv.slice(2);

    if (action === "allocate") {
        if (!nodeId || !carbonFootprint || !dataTransferred) {
            console.error("Usage: node tokenAllocator.js allocate <nodeId> <carbonFootprint> <dataTransferred>");
            process.exit(1);
        }

        allocateTokens(nodeId, {
            carbonFootprint: parseFloat(carbonFootprint),
            dataTransferred: parseFloat(dataTransferred),
        })
            .then((details) => {
                console.log("Token Allocation Details:", details);
            })
            .catch((error) => {
                console.error("Critical error during token allocation:", error.message);
            });
    } else if (action === "deallocate") {
        if (!nodeId) {
            console.error("Usage: node tokenAllocator.js deallocate <nodeId>");
            process.exit(1);
        }

        deallocateTokens(nodeId)
            .then((details) => {
                console.log("Token Deallocation Details:", details);
            })
            .catch((error) => {
                console.error("Critical error during token deallocation:", error.message);
            });
    } else {
        console.error("Invalid action. Use 'allocate' or 'deallocate'.");
        process.exit(1);
    }
}

module.exports = { allocateTokens, deallocateTokens };

