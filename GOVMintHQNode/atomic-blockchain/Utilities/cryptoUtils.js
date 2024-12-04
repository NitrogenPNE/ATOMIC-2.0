"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Cryptographic Utilities (HSM-Integrated)
 *
 * Description:
 * Provides cryptographic operations (signing, encryption, verification)
 * integrated with Hardware Security Modules (HSMs) for secure key management.
 * -------------------------------------------------------------------------------
 */

const AWS = require("aws-sdk"); // Example: Using AWS CloudHSM
const crypto = require("crypto");

// HSM Configuration
AWS.config.update({ region: "us-east-1" }); // Update region as needed
const cloudHSM = new AWS.CloudHSM();

/**
 * Generate a new HSM-managed key.
 * @param {string} keyType - Type of key to generate (e.g., "RSA_2048", "ECC_NIST_P256").
 * @returns {Promise<string>} - Key ID for the newly generated key.
 */
async function generateHSMKey(keyType = "RSA_2048") {
    console.log(`Generating HSM-managed key: ${keyType}...`);

    try {
        const params = {
            KeyUsage: "SIGN_VERIFY",
            CustomerMasterKeySpec: keyType,
        };

        const result = await cloudHSM.createKey(params).promise();
        console.log("HSM Key generated successfully:", result.KeyId);
        return result.KeyId;
    } catch (error) {
        console.error("Failed to generate HSM key:", error.message);
        throw error;
    }
}

/**
 * Sign data using an HSM-managed key.
 * @param {string} keyId - HSM Key ID to use for signing.
 * @param {Buffer} data - Data to sign.
 * @returns {Promise<string>} - Base64-encoded signature.
 */
async function signWithHSM(keyId, data) {
    console.log(`Signing data with HSM-managed key: ${keyId}...`);

    try {
        const params = {
            KeyId: keyId,
            Message: data.toString("base64"),
            MessageType: "RAW",
            SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256", // Update algorithm as needed
        };

        const result = await cloudHSM.sign(params).promise();
        console.log("Data signed successfully.");
        return result.Signature.toString("base64");
    } catch (error) {
        console.error("Failed to sign data with HSM:", error.message);
        throw error;
    }
}

/**
 * Verify a signature using an HSM-managed key.
 * @param {string} keyId - HSM Key ID to use for verification.
 * @param {Buffer} data - Original data.
 * @param {string} signature - Base64-encoded signature.
 * @returns {Promise<boolean>} - Whether the signature is valid.
 */
async function verifyWithHSM(keyId, data, signature) {
    console.log(`Verifying signature with HSM-managed key: ${keyId}...`);

    try {
        const params = {
            KeyId: keyId,
            Message: data.toString("base64"),
            MessageType: "RAW",
            Signature: Buffer.from(signature, "base64"),
            SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256", // Update algorithm as needed
        };

        const result = await cloudHSM.verify(params).promise();
        console.log("Signature verification result:", result.SignatureValid);
        return result.SignatureValid;
    } catch (error) {
        console.error("Failed to verify signature with HSM:", error.message);
        throw error;
    }
}

module.exports = {
    generateHSMKey,
    signWithHSM,
    verifyWithHSM,
};

