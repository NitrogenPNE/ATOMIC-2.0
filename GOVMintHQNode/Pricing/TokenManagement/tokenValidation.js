"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintingHQNode - Token Validation with Lifecycle Management
 *
 * Description:
 * Validates tokens with added lifecycle management:
 * - Expiration validation
 * - Renewal mechanism
 * - Revocation checks
 *
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { verifyLatticeSignature, verifyHmacSignature } = require("../Utilities/quantumCryptoUtils");
const { getSystemSerialNumber } = require("../Utilities/systemUtils");

// Config paths
const tokenMetadataPath = path.resolve(__dirname, "../Config/tokenMetadata.json");
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");
const tokenRevocationListPath = path.resolve(__dirname, "../Data/tokenRevocationList.json");

// Token version constants
const TOKEN_VERSION = "2.0"; // Quantum-resistant
const LEGACY_TOKEN_VERSION = "1.0"; // Legacy cryptographic tokens
const TOKEN_RENEWAL_THRESHOLD_HOURS = 24; // Renew tokens nearing expiration within 24 hours

/**
 * Validate a token's authenticity, integrity, expiration, and revocation status.
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

        // Check revocation list
        console.log("Checking token revocation status...");
        const isRevoked = await isTokenRevoked(tokenId);
        if (isRevoked) {
            throw new Error("Invalid token: Token has been revoked.");
        }

        // Validate expiration
        console.log("Validating token expiration...");
        const now = new Date();
        const expirationDate = new Date(tokenDetails.expiration);
        if (now > expirationDate) {
            throw new Error("Invalid token: Token has expired.");
        }

        // Check for renewal need
        const hoursUntilExpiration = (expirationDate - now) / (1000 * 60 * 60);
        const needsRenewal = hoursUntilExpiration <= TOKEN_RENEWAL_THRESHOLD_HOURS;

        console.log("Decrypting token...");
        const decryptedToken = decryptToken(encryptedToken, tokenDetails.metadata.encryptionKey);
        if (decryptedToken !== tokenId) {
            throw new Error("Invalid token: Decrypted data does not match token ID.");
        }

        console.log("Verifying token signature...");
        const isSignatureValid = tokenDetails.version === TOKEN_VERSION
            ? verifyLatticeSignature(encryptedToken, tokenDetails.signature, tokenDetails.metadata.publicKey)
            : verifyHmacSignature(encryptedToken, tokenDetails.signature, tokenDetails.metadata.secretKey);

        if (!isSignatureValid) {
            throw new Error("Invalid token: Signature verification failed.");
        }

        console.log("Token successfully validated.");
        return { valid: true, tokenDetails, needsRenewal };
    } catch (error) {
        console.error("Token validation failed:", error.message);
        return { valid: false, error: error.message };
    }
}

/**
 * Renew a token nearing expiration.
 * @param {string} tokenId - The unique identifier for the token.
 * @param {string} encryptedToken - The encrypted token string.
 * @returns {Object} - Result of the renewal operation.
 */
async function renewToken(tokenId, encryptedToken) {
    try {
        console.log("Loading token metadata...");
        const tokenMetadata = await fs.readJson(tokenMetadataPath);

        const tokenDetails = tokenMetadata.issuedTokens.find((token) => token.tokenId === tokenId);
        if (!tokenDetails) {
            throw new Error("Token not found.");
        }

        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error("Token validation failed. Cannot renew.");
        }

        console.log("Renewing token...");
        const newExpirationDate = new Date();
        newExpirationDate.setDate(newExpirationDate.getDate() + 30); // Extend token validity by 30 days
        tokenDetails.expiration = newExpirationDate.toISOString();

        await fs.writeJson(tokenMetadataPath, tokenMetadata, { spaces: 2 });
        console.log("Token renewed successfully.");
        return { success: true, newExpiration: tokenDetails.expiration };
    } catch (error) {
        console.error("Token renewal failed:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Check if a token is revoked.
 * @param {string} tokenId - The unique identifier for the token.
 * @returns {Promise<boolean>} - Whether the token is revoked.
 */
async function isTokenRevoked(tokenId) {
    try {
        console.log("Loading token revocation list...");
        const revocationList = await fs.readJson(tokenRevocationListPath);
        return revocationList.includes(tokenId);
    } catch (error) {
        console.error("Failed to load token revocation list:", error.message);
        return false;
    }
}

module.exports = { validateToken, renewToken, isTokenRevoked };
