"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Token Management
//
// Description:
// Centralized management of token minting, validation, redemption, and usage
// logging within the ATOMIC ecosystem. Ensures secure operations and
// eco-friendly practices.
//
// Dependencies:
// - tokenMinting.js: Handles dynamic token minting.
// - tokenValidation.js: Ensures the integrity and authenticity of tokens.
// - carbonTokenLedger.js: Records token transactions in the blockchain ledger.
// - fs-extra: For file operations.
// - path: For directory handling.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { mintTokens } = require("../TokenManagement/tokenMinting");
const { validateToken, validateAndLogUsage } = require("../TokenManagement/tokenValidation");
const { recordTokenTransaction } = require("../Blockchain/carbonTokenLedger");

// Config paths
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");

/**
 * Allocate tokens to nodes for initial use or network expansion.
 * @param {number} nodeCount - Number of nodes requiring tokens.
 * @returns {Object} - Minting details.
 */
async function allocateTokens(nodeCount) {
    try {
        console.log("Minting tokens for nodes...");
        const mintingDetails = await mintTokens(nodeCount);

        console.log("Recording token allocation in ledger...");
        await recordTokenTransaction({
            action: "ALLOCATE",
            details: mintingDetails,
        });

        console.log("Tokens allocated successfully.");
        return mintingDetails;
    } catch (error) {
        console.error("Error during token allocation:", error.message);
        throw error;
    }
}

/**
 * Validate a token for a specific operation and log its usage.
 * @param {string} tokenId - The token ID to validate.
 * @param {string} encryptedToken - The encrypted token data.
 * @returns {boolean} - Returns true if the token is valid, otherwise false.
 */
async function validateTokenForOperation(tokenId, encryptedToken) {
    try {
        console.log(`Validating token ${tokenId} for operation...`);
        const isValid = await validateAndLogUsage(tokenId, encryptedToken);

        if (!isValid) {
            console.error(`Token ${tokenId} validation failed.`);
            return false;
        }

        console.log(`Token ${tokenId} validated and logged successfully.`);
        return true;
    } catch (error) {
        console.error(`Error validating token ${tokenId}:`, error.message);
        throw error;
    }
}

/**
 * Redeem tokens for network services or privileges.
 * @param {string} tokenId - The token ID to redeem.
 * @param {number} serviceCost - The cost of the service in tokens.
 * @returns {Object} - Redemption details.
 */
async function redeemTokens(tokenId, serviceCost) {
    try {
        console.log(`Redeeming token ${tokenId} for service cost ${serviceCost}...`);
        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        const tokenDetails = tokenMetadata.issuedTokens.find((token) => token.tokenId === tokenId);
        if (!tokenDetails) {
            throw new Error("Token not found.");
        }

        if (tokenDetails.balance < serviceCost) {
            throw new Error("Insufficient token balance.");
        }

        // Deduct service cost
        tokenDetails.balance -= serviceCost;

        // Update metadata
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log(`Token ${tokenId} redeemed successfully.`);
        const redemptionDetails = {
            tokenId,
            redeemedAt: new Date().toISOString(),
            serviceCost,
        };

        console.log("Recording redemption in ledger...");
        await recordTokenTransaction({
            action: "REDEEM",
            details: redemptionDetails,
        });

        return redemptionDetails;
    } catch (error) {
        console.error(`Error redeeming token ${tokenId}:`, error.message);
        throw error;
    }
}

/**
 * Fetch token usage history for monitoring or auditing.
 * @param {string} tokenId - The token ID to fetch history for.
 * @returns {Array} - Usage history of the token.
 */
async function fetchTokenUsageHistory(tokenId) {
    try {
        console.log(`Fetching usage history for token ${tokenId}...`);
        const usageHistory = await fs.readJson(tokenUsageHistoryPath);

        const tokenHistory = usageHistory.filter((entry) => entry.tokenId === tokenId);

        console.log(`Fetched ${tokenHistory.length} usage records for token ${tokenId}.`);
        return tokenHistory;
    } catch (error) {
        console.error("Error fetching token usage history:", error.message);
        throw error;
    }
}

/**
 * Main function for token management operations.
 */
if (require.main === module) {
    const [operation, ...args] = process.argv.slice(2);

    async function run() {
        switch (operation) {
            case "allocate":
                const nodeCount = parseInt(args[0], 10) || 1;
                const allocation = await allocateTokens(nodeCount);
                console.log("Allocation Details:", allocation);
                break;

            case "validate":
                const [tokenId, encryptedToken] = args;
                if (!tokenId || !encryptedToken) {
                    throw new Error("Usage: validate <tokenId> <encryptedToken>");
                }
                const isValid = await validateTokenForOperation(tokenId, encryptedToken);
                console.log("Validation Result:", isValid);
                break;

            case "redeem":
                const [redeemTokenId, serviceCost] = args;
                if (!redeemTokenId || !serviceCost) {
                    throw new Error("Usage: redeem <tokenId> <serviceCost>");
                }
                const redemption = await redeemTokens(redeemTokenId, parseFloat(serviceCost));
                console.log("Redemption Details:", redemption);
                break;

            case "usage":
                const historyTokenId = args[0];
                if (!historyTokenId) {
                    throw new Error("Usage: usage <tokenId>");
                }
                const history = await fetchTokenUsageHistory(historyTokenId);
                console.log("Usage History:", history);
                break;

            default:
                console.error("Unknown operation. Valid operations: allocate, validate, redeem, usage");
        }
    }

    run().catch((error) => {
        console.error("Critical error during token management operation:", error.message);
        process.exit(1);
    });
}

module.exports = {
    allocateTokens,
    validateTokenForOperation,
    redeemTokens,
    fetchTokenUsageHistory,
};