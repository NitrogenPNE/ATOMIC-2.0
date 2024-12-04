"use strict"; // Enforce strict mode

"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintingHQNode - Quantum-Resistant Cryptographic Utilities
 *
 * Description:
 * Provides quantum-resistant cryptographic utilities tailored for the GOVMintingHQNode,
 * integrated with Hardware Security Modules (HSMs) for key management.
 * -------------------------------------------------------------------------------
 */

const AWS = require("aws-sdk"); // Example: Using AWS CloudHSM
const sodium = require("libsodium-wrappers");
const fs = require("fs-extra");
const path = require("path");
const { logError, logAtomic } = require("./loggingUtils");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");

// **HSM Configuration**
AWS.config.update({ region: "us-east-1" }); // Update to your HSM region
const cloudHSM = new AWS.CloudHSM();

// **Key Storage Paths**
const KEY_STORAGE_PATH = path.join(__dirname, "../Keys");

/**
 * Initialize cryptographic utilities and ensure HSM readiness.
 */
async function initializeCryptoUtils() {
    await sodium.ready;
    await fs.ensureDir(KEY_STORAGE_PATH);
    console.info("Quantum-resistant cryptographic utilities initialized with HSM support.");
}

/**
 * Generate a quantum-resistant keypair using HSM.
 * @param {string} type - "kyber" for encryption or "dilithium" for digital signatures.
 * @param {string} tokenId - Token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @returns {string} - HSM Key ID.
 */
async function generateQuantumKeypair(type, tokenId, encryptedToken) {
    try {
        console.info("Validating token for HSM keypair generation...");
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error("Token validation failed: Access denied.");
        }

        const keySpec = type === "kyber" ? "ECC_NIST_P256" : "RSA_2048";
        console.info(`Generating HSM-managed ${type} keypair (${keySpec})...`);

        const params = {
            KeyUsage: "SIGN_VERIFY",
            CustomerMasterKeySpec: keySpec,
        };

        const result = await cloudHSM.createKey(params).promise();
        console.info("HSM Key generated successfully:", result.KeyId);

        return result.KeyId;
    } catch (error) {
        logError(`Error generating ${type} keypair with HSM: ${error.message}`);
        throw error;
    }
}

/**
 * Sign data with an HSM-managed key.
 * @param {string} data - Data to be signed.
 * @param {string} keyId - HSM Key ID.
 * @param {string} tokenId - Token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @returns {string} - Base64-encoded signature.
 */
async function signWithQuantum(data, keyId, tokenId, encryptedToken) {
    try {
        console.info("Validating token for HSM signing...");
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error("Token validation failed: Access denied.");
        }

        console.info(`Signing data with HSM-managed key: ${keyId}...`);
        const params = {
            KeyId: keyId,
            Message: Buffer.from(data).toString("base64"),
            MessageType: "RAW",
            SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256", // Update as needed
        };

        const result = await cloudHSM.sign(params).promise();
        console.info("Data signed successfully.");
        return result.Signature.toString("base64");
    } catch (error) {
        logError(`Error signing data with HSM: ${error.message}`);
        throw error;
    }
}

/**
 * Verify a signature using an HSM-managed key.
 * @param {string} data - Original data.
 * @param {string} signature - Base64-encoded signature.
 * @param {string} keyId - HSM Key ID.
 * @returns {boolean} - Whether the signature is valid.
 */
async function verifyQuantumSignature(data, signature, keyId) {
    try {
        console.info(`Verifying signature with HSM-managed key: ${keyId}...`);

        const params = {
            KeyId: keyId,
            Message: Buffer.from(data).toString("base64"),
            MessageType: "RAW",
            Signature: Buffer.from(signature, "base64"),
            SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256", // Update as needed
        };

        const result = await cloudHSM.verify(params).promise();
        console.info("Signature verification result:", result.SignatureValid);
        return result.SignatureValid;
    } catch (error) {
        logError(`Error verifying signature with HSM: ${error.message}`);
        throw error;
    }
}

module.exports = {
    initializeCryptoUtils,
    generateQuantumKeypair,
    signWithQuantum,
    verifyQuantumSignature,
};
