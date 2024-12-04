"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Token Redemption
 *
 * Description:
 * Manages token redemption for Proof-of-Access operations, ensuring secure validation,
 * ledger updates, and traceability within the ATOMIC ecosystem.
 *
 * Dependencies:
 * - tokenValidation.js: Validates the token authenticity and integrity.
 * - fs-extra: For managing token metadata and history.
 * - path: For directory management.
 * - carbonTokenLedger.js: Logs redemption transactions securely.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { validateToken } = require("../TokenManagement/tokenValidation");
const { recordTokenTransaction } = require("../Blockchain/carbonTokenLedger");

// Config paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");

/**
 * Redeem a token by verifying its validity and updating ledgers.
 * @param {string} tokenId - The unique identifier for the token.
 * @param {string} encryptedToken - The encrypted token string.
 * @param {Object} issuingNode - Details of the node requesting redemption (e.g., serialNumber, nodeClass).
 * @returns {Object} - Details of the redemption process.
 */
async function redeemToken(tokenId, encryptedToken, issuingNode) {
    try {
        console.log("Validating token for redemption...");
        const validationResult = await validateToken(tokenId, encryptedToken);

        if (!validationResult.valid) {
            throw new Error(`Token validation failed: ${validationResult.error}`);
        }

        console.log("Loading token metadata...");
        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        const tokenDetails = tokenMetadata.tokens.find((token) => token.tokenId === tokenId);

        if (!tokenDetails) {
            throw new Error("Token not found in metadata.");
        }

        if (tokenDetails.redeemed) {
            throw new Error("Token has already been redeemed.");
        }

        console.log("Validating issuing node...");
        if (
            !tokenDetails.issuingNode ||
            tokenDetails.issuingNode.serialNumber !== issuingNode.serialNumber ||
            tokenDetails.issuingNode.nodeClass !== issuingNode.nodeClass
        ) {
            throw new Error("Token redemption request does not match issuing node details.");
        }

        console.log("Marking token as redeemed...");
        tokenDetails.redeemed = true;
        tokenDetails.redeemedAt = new Date().toISOString();
        tokenDetails.redeemedBy = issuingNode.serialNumber;

        console.log("Updating token metadata...");
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log("Logging redemption transaction...");
        await recordTokenTransaction({
            action: "REDEEM",
            tokenId,
            issuingNode,
            timestamp: tokenDetails.redeemedAt,
        });

        console.log("Updating usage history...");
        const usageHistory = await fs.readJson(tokenUsageHistoryPath);
        usageHistory.push({
            action: "REDEEM",
            tokenId,
            issuingNode,
            timestamp: tokenDetails.redeemedAt,
        });
        await fs.writeJson(tokenUsageHistoryPath, usageHistory, { spaces: 2 });

        console.log("Token successfully redeemed.");
        return { success: true, tokenId, issuingNode, redeemedAt: tokenDetails.redeemedAt };
    } catch (error) {
        console.error("Error during token redemption:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main function for redeeming a token if called directly.
 */
if (require.main === module) {
    const [tokenId, encryptedToken, nodeClass, serialNumber] = process.argv.slice(2);

    if (!tokenId || !encryptedToken || !nodeClass || !serialNumber) {
        console.error(
            "Usage: node tokenRedemption.js <tokenId> <encryptedToken> <nodeClass> <serialNumber>"
        );
        process.exit(1);
    }

    const issuingNode = { nodeClass, serialNumber };

    redeemToken(tokenId, encryptedToken, issuingNode)
        .then((result) => {
            if (result.success) {
                console.log("Redemption Details:", result);
            } else {
                console.error("Redemption failed:", result.error);
            }
        })
        .catch((error) => {
            console.error("Critical error during token redemption:", error.message);
        });
}

module.exports = { redeemToken };