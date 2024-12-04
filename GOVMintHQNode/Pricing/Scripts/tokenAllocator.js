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
const { validateToken } = require("../TokenManagement/tokenValidation");

// Paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");

/**
 * Allocate tokens dynamically based on node performance and requirements.
 * Validates token ownership and issuing node's serial number before allocation.
 * @param {string} tokenId - Token ID for validation.
 * @param {string} encryptedToken - Encrypted token data for validation.
 * @param {Object} nodeMetrics - Performance metrics for the node.
 * @param {number} nodeMetrics.carbonFootprint - Carbon footprint of the node.
 * @param {number} nodeMetrics.dataTransferred - Data transferred in GB.
 * @param {Object} issuingNode - Details of the issuing node (e.g., serialNumber, nodeClass).
 * @returns {Object} - Allocation details including allocated tokens.
 */
async function allocateTokens(tokenId, encryptedToken, nodeMetrics, issuingNode) {
    try {
        console.log(`Allocating tokens for Token ID: ${tokenId}...`);

        // Validate token for Proof-of-Access
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error("Invalid token: Access denied.");
        }

        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        const tokenDetails = tokenMetadata.tokens.find((token) => token.tokenId === tokenId);
        if (!tokenDetails) {
            throw new Error("Token not found in metadata.");
        }

        console.log("Validating issuing node...");
        if (
            !tokenDetails.issuingNode ||
            tokenDetails.issuingNode.serialNumber !== issuingNode.serialNumber ||
            tokenDetails.issuingNode.nodeClass !== issuingNode.nodeClass
        ) {
            throw new Error("Token allocation request does not match issuing node details.");
        }

        console.log("Predicting optimal token allocation...");
        const optimalAllocation = await predictOptimalAllocation(nodeMetrics);

        if (!optimalAllocation || optimalAllocation.tokens <= 0) {
            throw new Error(`No tokens allocated for Token ID: ${tokenId}.`);
        }

        // Update token metadata
        tokenMetadata.circulatingTokens -= optimalAllocation.tokens;
        tokenMetadata.allocatedTokens[tokenId] = (tokenMetadata.allocatedTokens[tokenId] || 0) + optimalAllocation.tokens;
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        // Log the allocation in the transaction log
        const allocationDetails = {
            type: "ALLOCATE",
            tokenId,
            metadata: {
                issuingNode,
                tokensAllocated: optimalAllocation.tokens,
                carbonFootprint: nodeMetrics.carbonFootprint,
                dataTransferred: nodeMetrics.dataTransferred,
                timestamp: new Date().toISOString(),
            },
        };

        await logTokenTransaction(allocationDetails);

        console.log(`Tokens allocated successfully: ${optimalAllocation.tokens} tokens for Token ID: ${tokenId}.`);
        return allocationDetails.metadata;
    } catch (error) {
        console.error(`Error allocating tokens for Token ID: ${tokenId}:`, error.message);
        throw error;
    }
}

/**
 * Deallocate tokens from a node associated with a specific token.
 * @param {string} tokenId - Token ID for deallocation.
 * @param {Object} issuingNode - Details of the issuing node (e.g., serialNumber, nodeClass).
 * @returns {Object} - Details of the deallocation.
 */
async function deallocateTokens(tokenId, issuingNode) {
    try {
        console.log(`Deallocating tokens for Token ID: ${tokenId}...`);

        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        const tokenDetails = tokenMetadata.tokens.find((token) => token.tokenId === tokenId);
        if (!tokenDetails) {
            throw new Error("Token not found in metadata.");
        }

        console.log("Validating issuing node...");
        if (
            !tokenDetails.issuingNode ||
            tokenDetails.issuingNode.serialNumber !== issuingNode.serialNumber ||
            tokenDetails.issuingNode.nodeClass !== issuingNode.nodeClass
        ) {
            throw new Error("Token deallocation request does not match issuing node details.");
        }

        const allocatedTokens = tokenMetadata.allocatedTokens[tokenId] || 0;

        if (allocatedTokens <= 0) {
            throw new Error(`No tokens to deallocate for Token ID: ${tokenId}.`);
        }

        // Update token metadata
        tokenMetadata.circulatingTokens += allocatedTokens;
        delete tokenMetadata.allocatedTokens[tokenId];
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        // Log the deallocation in the transaction log
        const deallocationDetails = {
            type: "DEALLOCATE",
            tokenId,
            metadata: {
                issuingNode,
                tokensDeallocated: allocatedTokens,
                timestamp: new Date().toISOString(),
            },
        };

        await logTokenTransaction(deallocationDetails);

        console.log(`Tokens deallocated successfully: ${allocatedTokens} tokens for Token ID: ${tokenId}.`);
        return deallocationDetails.metadata;
    } catch (error) {
        console.error(`Error deallocating tokens for Token ID: ${tokenId}:`, error.message);
        throw error;
    }
}

// Example usage if called directly
if (require.main === module) {
    const [action, tokenId, encryptedToken, nodeClass, serialNumber, carbonFootprint, dataTransferred] = process.argv.slice(
        2
    );

    const issuingNode = { nodeClass, serialNumber };

    if (action === "allocate") {
        if (!tokenId || !encryptedToken || !nodeClass || !serialNumber || !carbonFootprint || !dataTransferred) {
            console.error(
                "Usage: node tokenAllocator.js allocate <tokenId> <encryptedToken> <nodeClass> <serialNumber> <carbonFootprint> <dataTransferred>"
            );
            process.exit(1);
        }

        allocateTokens(tokenId, encryptedToken, {
            carbonFootprint: parseFloat(carbonFootprint),
            dataTransferred: parseFloat(dataTransferred),
        }, issuingNode)
            .then((details) => {
                console.log("Token Allocation Details:", details);
            })
            .catch((error) => {
                console.error("Critical error during token allocation:", error.message);
            });
    } else if (action === "deallocate") {
        if (!tokenId || !nodeClass || !serialNumber) {
            console.error(
                "Usage: node tokenAllocator.js deallocate <tokenId> <nodeClass> <serialNumber>"
            );
            process.exit(1);
        }

        deallocateTokens(tokenId, issuingNode)
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