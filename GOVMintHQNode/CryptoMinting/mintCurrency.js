"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Crypto Minting
 *
 * Description:
 * Facilitates secure minting of government-backed cryptocurrencies. 
 * Implements quantum-resistant cryptographic validations, Proof-of-Access (PoA),
 * and integrates with the ATOMIC blockchain for transparent ledger updates.
 *
 * Features:
 * - Proof-of-Access validation for minting authorization.
 * - Quantum-resistant key generation and transaction signing.
 * - AML/KYC compliance checks during minting operations.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidator");
const { signWithQuantum, verifyQuantumSignature } = require("../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { logOperation, logError } = require("../../Utilities/loggingUtils");

// Configuration
const MINT_LOG_FILE = path.resolve(__dirname, "../Logs/minting.log");
const MINT_CONFIG_FILE = path.resolve(__dirname, "../Config/mintingConfig.json");
const BLOCKCHAIN_API = process.env.BLOCKCHAIN_API || "http://blockchain-node.internal/api/mint";

/**
 * Mint cryptocurrency securely.
 * @param {string} currencyCode - The currency code to mint (e.g., USD, EUR).
 * @param {number} amount - The amount to mint.
 * @param {Object} tokenDetails - Token details for authorization.
 * @returns {Promise<Object>} - Details of the minting operation.
 */
async function mintCurrency(currencyCode, amount, tokenDetails) {
    try {
        console.log(`Minting request: ${amount} ${currencyCode}`);

        // Step 1: Validate minting token
        const tokenValidation = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error(`Token validation failed: ${tokenValidation.error}`);
        }
        console.log("Token validation successful.");

        // Step 2: Load minting configuration
        const mintConfig = JSON.parse(fs.readFileSync(MINT_CONFIG_FILE, "utf8"));
        if (!mintConfig.SupportedCurrencies.includes(currencyCode)) {
            throw new Error(`Unsupported currency: ${currencyCode}`);
        }

        if (amount > mintConfig.MaxMintAmount) {
            throw new Error(`Minting amount exceeds the maximum allowed (${mintConfig.MaxMintAmount}).`);
        }

        // Step 3: Create minting transaction
        const mintTransaction = {
            currencyCode,
            amount,
            timestamp: new Date().toISOString(),
            issuedBy: tokenValidation.tokenDetails.issuingNode,
        };

        const signedTransaction = {
            ...mintTransaction,
            signature: signWithQuantum(mintTransaction),
        };

        console.log("Minting transaction created and signed.");

        // Step 4: Submit to blockchain
        const response = await fetch(BLOCKCHAIN_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(signedTransaction),
        });

        if (!response.ok) {
            throw new Error(`Blockchain minting failed: ${response.statusText}`);
        }

        const blockchainResponse = await response.json();
        console.log("Minting transaction successfully added to blockchain.");

        // Step 5: Log minting operation
        logOperation({
            action: "MintCurrency",
            details: {
                currencyCode,
                amount,
                timestamp: mintTransaction.timestamp,
                issuedBy: tokenValidation.tokenDetails.issuingNode,
                transactionId: blockchainResponse.transactionId,
            },
        });

        return {
            status: "success",
            message: "Minting completed successfully.",
            transactionId: blockchainResponse.transactionId,
        };
    } catch (error) {
        console.error("Error during minting operation:", error.message);
        logError({
            action: "MintCurrency",
            error: error.message,
        });
        return {
            status: "failure",
            message: error.message,
        };
    }
}

/**
 * Validate and authorize minting requests.
 * @param {Object} mintRequest - Details of the minting request.
 * @returns {Promise<boolean>} - True if the minting request is valid, false otherwise.
 */
async function validateMintingRequest(mintRequest) {
    try {
        console.log("Validating minting request...");

        const { currencyCode, amount, tokenDetails } = mintRequest;

        // Validate token and currency support
        const tokenValidation = await validateToken(tokenDetails.tokenId, tokenDetails.encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error(`Invalid token: ${tokenValidation.error}`);
        }

        const mintConfig = JSON.parse(fs.readFileSync(MINT_CONFIG_FILE, "utf8"));
        if (!mintConfig.SupportedCurrencies.includes(currencyCode)) {
            throw new Error(`Unsupported currency: ${currencyCode}`);
        }

        if (amount <= 0 || amount > mintConfig.MaxMintAmount) {
            throw new Error("Invalid minting amount.");
        }

        console.log("Minting request validated successfully.");
        return true;
    } catch (error) {
        console.error("Error validating minting request:", error.message);
        return false;
    }
}

module.exports = {
    mintCurrency,
    validateMintingRequest,
};