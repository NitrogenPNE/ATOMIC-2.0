"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Token Management
//
// Description:
// Handles minting, validation, transfer, and proof-of-access for tokens. 
// Ensures tokens are cryptographically secure and integrated with blockchain
// and encryption layers.
//
// Dependencies:
// - fs-extra: For file operations on token metadata.
// - path: For file path management.
// - crypto: For cryptographic operations.
// - blockchainLogger: Logs token-related activities to the blockchain ledger.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { logTokenActivity } = require("../Blockchain/carbonTokenLedger");

// Config paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const encryptionUtils = require("../Utilities/encryptionUtils");

// Constants
const TOKEN_LIFETIME = 31536000; // 1 year in seconds (optional if tokens expire)

/**
 * Generate a unique token ID.
 * @returns {string} - A unique token ID.
 */
function generateTokenId() {
    return crypto.randomUUID();
}

/**
 * Mint a new token.
 * @param {Object} metadata - Token metadata (e.g., node ID, encryption keys, carbon footprint).
 * @returns {Object} - Details of the minted token.
 */
async function mintToken(metadata) {
    try {
        const tokenId = generateTokenId();
        const timestamp = new Date().toISOString();

        const tokenDetails = {
            tokenId,
            metadata,
            createdAt: timestamp,
            validUntil: metadata.lifetime ? new Date(Date.now() + metadata.lifetime * 1000).toISOString() : null,
        };

        console.log("Updating token metadata...");
        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        tokenMetadata.tokens.push(tokenDetails);
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log("Logging token minting...");
        await logTokenActivity({
            action: "MINT",
            details: tokenDetails,
        });

        return tokenDetails;
    } catch (error) {
        console.error("Error minting token:", error.message);
        throw error;
    }
}

/**
 * Validate a token for authenticity and compliance.
 * @param {string} tokenId - The token ID to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
async function validateToken(tokenId) {
    try {
        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        const token = tokenMetadata.tokens.find((t) => t.tokenId === tokenId);

        if (!token) {
            console.warn("Token not found.");
            return false;
        }

        if (token.validUntil && new Date() > new Date(token.validUntil)) {
            console.warn("Token has expired.");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error validating token:", error.message);
        throw error;
    }
}

/**
 * Transfer a token to another entity.
 * @param {string} tokenId - The token ID to transfer.
 * @param {Object} newOwner - New owner details (e.g., node ID, user ID).
 * @returns {Object} - Updated token details.
 */
async function transferToken(tokenId, newOwner) {
    try {
        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        const token = tokenMetadata.tokens.find((t) => t.tokenId === tokenId);

        if (!token) {
            throw new Error("Token not found.");
        }

        token.metadata.owner = newOwner;
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log("Logging token transfer...");
        await logTokenActivity({
            action: "TRANSFER",
            details: { tokenId, newOwner },
        });

        return token;
    } catch (error) {
        console.error("Error transferring token:", error.message);
        throw error;
    }
}

/**
 * Generate proof-of-access for a token.
 * @param {string} tokenId - The token ID to validate.
 * @returns {Object} - Proof-of-access details.
 */
async function generateProofOfAccess(tokenId) {
    try {
        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        const token = tokenMetadata.tokens.find((t) => t.tokenId === tokenId);

        if (!token) {
            throw new Error("Token not found.");
        }

        const proof = crypto.createHash("sha256").update(tokenId + token.metadata.owner).digest("hex");

        console.log("Proof of access generated.");
        return { tokenId, proof, timestamp: new Date().toISOString() };
    } catch (error) {
        console.error("Error generating proof of access:", error.message);
        throw error;
    }
}

/**
 * Revoke a token by removing it from metadata.
 * @param {string} tokenId - The token ID to revoke.
 * @returns {boolean} - True if revoked successfully, false otherwise.
 */
async function revokeToken(tokenId) {
    try {
        const tokenMetadata = await fs.readJson(tokenMetadataPath);
        const tokenIndex = tokenMetadata.tokens.findIndex((t) => t.tokenId === tokenId);

        if (tokenIndex === -1) {
            throw new Error("Token not found.");
        }

        tokenMetadata.tokens.splice(tokenIndex, 1);
        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });

        console.log("Logging token revocation...");
        await logTokenActivity({
            action: "REVOKE",
            details: { tokenId },
        });

        return true;
    } catch (error) {
        console.error("Error revoking token:", error.message);
        throw error;
    }
}

module.exports = {
    mintToken,
    validateToken,
    transferToken,
    generateProofOfAccess,
    revokeToken,
};
