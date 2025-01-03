"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Token Validation
 *
 * Description:
 * Validates the authenticity, integrity, and Proof-of-Access (PoA) of tokens within
 * the ATOMIC ecosystem. Includes compliance checks and secure logging.
 *
 * Dependencies:
 * - encryptionUtils.js: For decrypting and validating token encryption.
 * - fs-extra: For managing token metadata.
 * - path: For directory management.
 * - crypto: For cryptographic operations.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { decryptToken, verifyTokenSignature } = require("../Utilities/encryptionUtils");
const crypto = require("crypto");

// Config paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");

/**
 * Validate a token's authenticity, integrity, and Proof-of-Access.
 * @param {string} tokenId - The unique identifier for the token.
 * @param {string} encryptedToken - The encrypted token string.
 * @returns {Object} - Validation result with token details or an error.
 */
async function validateToken(tokenId, encryptedToken) {
    try {
        console.log("Loading token metadata...");
        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        console.log("Checking token existence...");
        const tokenDetails = tokenMetadata.issuedTokens.find((token) => token.tokenId === tokenId);

        if (!tokenDetails) {
            throw new Error("Invalid token: Token ID not found.");
        }

        console.log("Decrypting token...");
        const decryptedToken = decryptToken(encryptedToken, tokenDetails.metadata.encryptionKey);

        if (decryptedToken !== tokenId) {
            throw new Error("Invalid token: Decrypted data does not match token ID.");
        }

        console.log("Verifying token signature...");
        const isSignatureValid = verifyTokenSignature(
            encryptedToken,
            tokenDetails.signature,
            tokenDetails.metadata.publicKey
        );

        if (!isSignatureValid) {
            throw new Error("Invalid token: Signature verification failed.");
        }

        console.log("Token successfully validated.");
        return { valid: true, tokenDetails };
    } catch (error) {
        console.error("Token validation failed:", error.message);
        return { valid: false, error: error.message };
    }
}

/**
 * Generate Proof-of-Access for a token.
 * @param {string} tokenId - The token ID to validate.
 * @returns {Object} - Proof-of-Access details.
 */
async function generateProofOfAccess(tokenId) {
    try {
        console.log("Loading token metadata...");
        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        console.log("Validating token existence...");
        const tokenDetails = tokenMetadata.issuedTokens.find((t) => t.tokenId === tokenId);

        if (!tokenDetails) {
            throw new Error("Invalid token: Token ID not found.");
        }

        console.log("Generating Proof-of-Access...");
        const proof = crypto.createHash("sha256").update(tokenId + tokenDetails.metadata.owner).digest("hex");

        console.log("Proof-of-Access generated.");
        return { tokenId, proof, timestamp: new Date().toISOString() };
    } catch (error) {
        console.error("Error generating Proof-of-Access:", error.message);
        throw error;
    }
}

/**
 * Validate and log token usage for Proof-of-Access operations.
 * @param {string} tokenId - The token ID to validate.
 * @param {string} encryptedToken - The encrypted token data.
 * @returns {boolean} - Returns true if validation is successful, otherwise false.
 */
async function validateAndLogUsage(tokenId, encryptedToken) {
    console.log("Starting token validation process...");
    const tokenValidationResult = await validateToken(tokenId, encryptedToken);

    if (!tokenValidationResult.valid) {
        console.error("Token validation failed:", tokenValidationResult.error);
        return false;
    }

    console.log("Logging token usage...");
    const usageHistory = await fs.readJson(tokenUsageHistoryPath);
    usageHistory.push({ tokenId, usedAt: new Date().toISOString() });
    await fs.writeJson(tokenUsageHistoryPath, usageHistory, { spaces: 2 });

    console.log("Token is valid and usage logged successfully.");
    return true;
}

// Example usage if called directly
if (require.main === module) {
    const [tokenId, encryptedToken] = process.argv.slice(2);

    if (!tokenId || !encryptedToken) {
        console.error("Usage: node tokenValidation.js <tokenId> <encryptedToken>");
        process.exit(1);
    }

    validateAndLogUsage(tokenId, encryptedToken)
        .then((isValid) => {
            if (isValid) {
                console.log("Token validation successful.");
            } else {
                console.error("Token validation failed.");
            }
        })
        .catch((error) => {
            console.error("Critical error during token validation:", error.message);
        });
}

module.exports = { validateToken, generateProofOfAccess, validateAndLogUsage };
