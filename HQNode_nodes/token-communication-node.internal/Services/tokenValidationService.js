"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Token Communication Node - Token Validation Service
// ------------------------------------------------------------------------------

// Dependencies
const crypto = require("crypto");
const { validateTokenSignature } = require("../../../atomic-blockchain/Utilities/validationUtils");
const { fetchTokenDetails, updateTokenRegistry } = require("../../../atomic-blockchain/core/tokenRegistry");
const { logInfo, logError } = require("../../../atomic-blockchain/Utilities/loggingUtils");

// Logger Configuration
const SERVICE_LOG_PATH = "../Logs/tokenValidationService.log";
const winston = require("winston");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: SERVICE_LOG_PATH })
    ]
});

/**
 * Validate a token using Proof of Access (PoA) standards.
 * @param {string} tokenId - The unique ID of the token.
 * @param {string} encryptedToken - The encrypted token payload.
 * @returns {Promise<boolean>} - True if the token is valid, otherwise false.
 */
async function validateTokenPoA(tokenId, encryptedToken) {
    logger.info("Validating token for Proof of Access (PoA)...", { tokenId });

    try {
        // Fetch token details from the registry
        const tokenDetails = await fetchTokenDetails(tokenId);
        if (!tokenDetails) {
            logger.error("Token not found in the registry.", { tokenId });
            return false;
        }

        logger.info("Token details fetched successfully.", { tokenId });

        // Validate token authenticity and signature
        const isValid = validateTokenSignature(tokenId, encryptedToken, tokenDetails.publicKey, tokenDetails.signature);
        if (!isValid) {
            logger.error("Token validation failed.", { tokenId });
            return false;
        }

        logger.info("Token validated successfully.", { tokenId });
        return true;
    } catch (error) {
        logger.error("Error occurred during token validation.", { tokenId, error: error.message });
        return false;
    }
}

/**
 * Refresh a token's validity by verifying its metadata and renewing its signature.
 * @param {string} tokenId - The unique ID of the token.
 * @param {string} ownerKey - The owner's private key for signature renewal.
 * @returns {Promise<boolean>} - True if the token is refreshed successfully, otherwise false.
 */
async function refreshToken(tokenId, ownerKey) {
    logger.info("Refreshing token...", { tokenId });

    try {
        // Fetch token details from the registry
        const tokenDetails = await fetchTokenDetails(tokenId);
        if (!tokenDetails) {
            logger.error("Token not found in the registry.", { tokenId });
            return false;
        }

        // Verify token ownership
        const tokenData = `${tokenId}${tokenDetails.owner}`;
        const isOwnerValid = crypto.verify(
            "sha256",
            Buffer.from(tokenData),
            { key: tokenDetails.publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
            Buffer.from(tokenDetails.signature, "base64")
        );

        if (!isOwnerValid) {
            logger.error("Token ownership verification failed.", { tokenId });
            return false;
        }

        // Generate a new signature for the token
        const newSignature = crypto.sign(
            "sha256",
            Buffer.from(tokenData),
            { key: ownerKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING }
        );

        // Update token details in the registry
        tokenDetails.signature = newSignature.toString("base64");
        await updateTokenRegistry(tokenId, tokenDetails);

        logger.info("Token refreshed successfully.", { tokenId });
        return true;
    } catch (error) {
        logger.error("Error occurred during token refresh.", { tokenId, error: error.message });
        return false;
    }
}

module.exports = {
    validateTokenPoA,
    refreshToken
};