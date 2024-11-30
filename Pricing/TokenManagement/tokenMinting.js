"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Token Minting
//
// Description:
// Handles the minting of tokens based on demand, node association, and carbon
// footprint calculations. Ensures secure, traceable minting transactions.
//
// Dependencies:
// - tokenPriceCalculator.js: Determines current token pricing.
// - fs-extra: For handling token data storage.
// - path: For directory management.
// - crypto: For generating secure token identifiers.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { calculateTokenPrice } = require("../PricingEngine/tokenPriceCalculator");

// Config paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");
const carbonTokenLedgerPath = path.resolve(__dirname, "../Blockchain/carbonTokenLedger.js");

/**
 * Generate a unique token ID using cryptographic methods.
 * @returns {string} - A unique token ID.
 */
function generateTokenId() {
    return crypto.randomUUID();
}

/**
 * Mint tokens dynamically based on the number of nodes and carbon pricing.
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
        const tokenId = generateTokenId();
        const timestamp = new Date().toISOString();

        const mintingDetails = {
            tokenId,
            nodeCount,
            tokensMinted,
            tokenPrice: parseFloat(adjustedTokenPrice),
            totalCost: parseFloat(adjustedTokenPrice * nodeCount).toFixed(2), // Total cost for tokens minted
            timestamp,
        };

        console.log("Updating token metadata...");
        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        tokenMetadata.circulatingTokens += tokensMinted;
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log("Logging minting details...");
        const usageHistory = await fs.readJson(tokenUsageHistoryPath);
        usageHistory.push(mintingDetails);
        await fs.writeJson(tokenUsageHistoryPath, usageHistory, { spaces: 2 });

        console.log("Recording minting transaction in the ledger...");
        const { recordTokenTransaction } = require(carbonTokenLedgerPath);
        await recordTokenTransaction({
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
