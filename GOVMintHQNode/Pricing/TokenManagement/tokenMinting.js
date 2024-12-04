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
 * Supports quantum-resistant cryptographic signatures with backward compatibility.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const { calculateTokenPrice } = require("../PricingEngine/tokenPriceCalculator");
const { logTokenTransaction } = require("../Scripts/tokenTransactionLogger");
const { generateLatticeSignature } = require("../Utilities/quantumCryptoUtils");
const { KMS } = require("../Services/keyManagementService");

// Config paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");
const BASE_LEDGER_DIRECTORY = "C:\\ATOMIC-SecureStorage\\ATOMIC 2.0";

// Token version constants
const TOKEN_VERSION = "2.0"; // Quantum-resistant
const LEGACY_TOKEN_VERSION = "1.0"; // Legacy cryptographic tokens

/**
 * Get the system's baseboard serial number for tracking.
 * @returns {string} - The baseboard serial number.
 */
function getBaseboardSerialNumber() {
    try {
        const serialNumber = execSync('wmic baseboard get serialnumber')
            .toString()
            .split('\n')[1]
            .trim();
        if (!serialNumber) {
            throw new Error("Baseboard serial number not found.");
        }
        return serialNumber;
    } catch (error) {
        console.error("Error retrieving baseboard serial number:", error.message);
        throw error;
    }
}

/**
 * Save tokens to the appropriate ledger based on the node class.
 * @param {string} nodeClass - The class of the issuing node.
 * @param {Array<Object>} tokens - The tokens to save.
 */
async function saveTokenToLedger(nodeClass, tokens) {
    const ledgerPath = path.join(BASE_LEDGER_DIRECTORY, `${nodeClass}Node`, "tokenLedger.json");

    try {
        await fs.ensureFile(ledgerPath);

        let existingLedger = { tokens: [] };

        if (await fs.pathExists(ledgerPath)) {
            try {
                existingLedger = await fs.readJson(ledgerPath);
            } catch {
                console.warn(`Warning: Initializing new ledger for ${nodeClass}Node.`);
            }
        }

        existingLedger.tokens.push(...tokens);

        await fs.writeJson(ledgerPath, existingLedger, { spaces: 2 });
        console.log(`Token saved to ledger for ${nodeClass}Node.`);
    } catch (error) {
        console.error(`Error saving token to ledger for ${nodeClass}Node:`, error.message);
        throw error;
    }
}

/**
 * Generate token signature dynamically based on version.
 * @param {Object} tokenDetails - Details of the token to sign.
 * @param {string} version - Token version.
 * @returns {Promise<string>} - The generated signature.
 */
async function generateTokenSignature(tokenDetails, version) {
    const data = JSON.stringify(tokenDetails);

    if (version === TOKEN_VERSION) {
        // Quantum-resistant signature
        const quantumKey = await KMS.getQuantumKey();
        return generateLatticeSignature(data, quantumKey);
    } else if (version === LEGACY_TOKEN_VERSION) {
        // Legacy signature using HMAC-SHA256
        const legacyKey = await KMS.getLegacyKey();
        return crypto.createHmac("sha256", legacyKey).update(data).digest("hex");
    }

    throw new Error(`Unsupported token version: ${version}`);
}

/**
 * Mint tokens dynamically based on the number of nodes.
 * @param {number} nodeCount - The number of nodes to allocate tokens for.
 * @param {string} nodeClass - The class of node issuing the token.
 * @param {boolean} useQuantum - Use quantum-resistant cryptography if true.
 * @returns {Object} - Details of minted tokens.
 */
async function mintTokens(nodeCount, nodeClass, useQuantum = true) {
    try {
        if (nodeCount < 1) {
            throw new Error("Node count must be at least 1.");
        }

        console.log("Calculating token price based on node carbon footprint...");
        const { adjustedTokenPrice } = await calculateTokenPrice();

        console.log("Generating tokens...");
        const tokensMinted = nodeCount;
        const timestamp = new Date().toISOString();
        const serialNumber = getBaseboardSerialNumber();
        const version = useQuantum ? TOKEN_VERSION : LEGACY_TOKEN_VERSION;

        const mintingDetails = {
            tokens: [],
            tokenPrice: parseFloat(adjustedTokenPrice),
            totalCost: parseFloat(adjustedTokenPrice * nodeCount).toFixed(2),
            timestamp,
            issuingNode: {
                nodeClass,
                serialNumber,
            },
            version,
        };

        for (let i = 0; i < nodeCount; i++) {
            const tokenId = crypto.randomUUID();
            const tokenDetails = {
                tokenId,
                nodeCount: 1,
                tokenClass: nodeClass,
                timestamp,
                version,
                issuingNode: { nodeClass, serialNumber },
            };

            // Generate token signature
            tokenDetails.signature = await generateTokenSignature(tokenDetails, version);

            mintingDetails.tokens.push(tokenDetails);
        }

        console.log("Updating token metadata...");
        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        tokenMetadata.circulatingTokens += tokensMinted;
        tokenMetadata.totalTokensMinted += tokensMinted;
        tokenMetadata.tokens = [...(tokenMetadata.tokens || []), ...mintingDetails.tokens];
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log("Saving tokens to node ledger...");
        await saveTokenToLedger(nodeClass, mintingDetails.tokens);

        console.log("Recording minting transaction in the ledger...");
        await logTokenTransaction({
            type: "MINT",
            tokenId: mintingDetails.tokens[0].tokenId,
            metadata: mintingDetails,
        });

        console.log("Tokens minted successfully.");
        return mintingDetails;
    } catch (error) {
        console.error("Error minting tokens:", error.message);
        throw error;
    }
}

module.exports = { mintTokens };
