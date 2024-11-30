"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Token Minting
 *
 * Description:
 * Handles the minting of tokens based on demand and node association.
 * Ensures secure, traceable minting transactions with cryptographic signatures.
 *
 * Dependencies:
 * - tokenPriceCalculator.js: Determines current token pricing.
 * - fs-extra: For handling token data storage.
 * - path: For directory management.
 * - crypto: For generating secure token identifiers.
 * - ledgerManager.js: Logs minting transactions on the blockchain.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { calculateTokenPrice } = require("../PricingEngine/tokenPriceCalculator");
const { logTokenTransaction } = require("./tokenTransactionLogger");

// Config paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");

/**
 * Generate a unique token ID using cryptographic methods.
 * @returns {string} - A unique token ID.
 */
function generateTokenId() {
    return crypto.randomUUID();
}

/**
 * Generate a cryptographic signature for the token.
 * @param {Object} tokenDetails - Details of the token to be signed.
 * @returns {string} - A cryptographic signature for the token.
 */
function generateTokenSignature(tokenDetails) {
    const secretKey = process.env.TOKEN_SECRET_KEY || "default-secret-key"; // Replace with a secure key in production
    const data = JSON.stringify(tokenDetails);
    return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
}

/**
 * Mint tokens dynamically based on the number of nodes.
 * @param {number} nodeCount - The number of nodes to allocate tokens for.
 * @returns {Object} - Details of minted tokens.
 */
async function mintTokens(nodeCount) {
    try {
        if (nodeCount < 1) {
            throw new Error("Node count must be at least 1.");
        }

        console.log("Calculating token price based on node carbon footprint...");
        const { adjustedTokenPrice } = await calculateTokenPrice();

        console.log("Generating tokens...");
        const tokensMinted = nodeCount; // One token corresponds to one node
        const timestamp = new Date().toISOString();

        const mintingDetails = {
            tokens: [],
            tokenPrice: parseFloat(adjustedTokenPrice),
            totalCost: parseFloat(adjustedTokenPrice * nodeCount).toFixed(2), // Total cost for tokens minted
            timestamp,
        };

        for (let i = 0; i < nodeCount; i++) {
            const tokenId = generateTokenId();
            const tokenDetails = {
                tokenId,
                nodeCount: 1, // Each token represents a single node
            };

            tokenDetails.signature = generateTokenSignature(tokenDetails);

            mintingDetails.tokens.push(tokenDetails);
        }

        console.log("Updating token metadata...");
        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        tokenMetadata.circulatingTokens += tokensMinted;
        tokenMetadata.tokens = [...(tokenMetadata.tokens || []), ...mintingDetails.tokens];
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log("Logging minting details...");
        const usageHistory = await fs.readJson(tokenUsageHistoryPath);
        usageHistory.push(mintingDetails);
        await fs.writeJson(tokenUsageHistoryPath, usageHistory, { spaces: 2 });

        console.log("Recording minting transaction in the ledger...");
        await logTokenTransaction({
            action: "MINT",
            details: mintingDetails,
        });

        console.log("Tokens minted successfully.");
        return mintingDetails;
    } catch (error) {
        console.error("Error minting tokens:", error.message);
        throw error;
    }
}

/**
 * Main function for minting tokens if called directly.
 */
if (require.main === module) {
    const nodeCount = parseInt(process.argv[2], 10) || 1; // Default to 1 node if no input

    mintTokens(nodeCount)
        .then((details) => {
            console.log("Minting Details:", details);
        })
        .catch((error) => {
            console.error("Critical error during token minting:", error.message);
        });
}

module.exports = { mintTokens };
