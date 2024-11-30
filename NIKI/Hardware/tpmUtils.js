"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: TPM Utilities
//
// Description:
// This module provides utility functions for Trusted Platform Module (TPM)
// integration. It includes methods to fetch TPM-generated quotes and verify
// hardware signatures for secure shard validation.
//
// Features:
// - Fetch TPM-generated quotes via tpm2-tools or platform-specific APIs.
// - Verify TPM hardware signatures using public keys and cryptographic tools.
//
// Dependencies:
// - crypto: For cryptographic signature verification.
// - child_process: To execute TPM commands on the system.
//
// Notes:
// - Ensure TPM is enabled in BIOS/UEFI.
// - Install TPM 2.0 software stack (tpm2-tools, tpm2-tss) for Linux integration.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const { exec } = require("child_process");
const crypto = require("crypto"); // For cryptographic signature verification
const fs = require("fs-extra"); // File operations for TPM key management

/**
 * Fetch a TPM quote and public key using tpm2-tools.
 * This function interacts with TPM via tpm2-tools to fetch a hardware quote
 * and public key. Requires TPM 2.0 and tpm2-tools installed on the system.
 *
 * @returns {Promise<Object>} - TPM quote and public key.
 * Example:
 * {
 *   hardwareQuote: "base64-encoded quote",
 *   publicKey: "base64-encoded public key"
 * }
 */
async function getTPMQuote() {
    console.log("Fetching TPM quote and public key...");

    try {
        // TPM commands to generate a quote and retrieve the public key
        const nonce = crypto.randomBytes(20).toString("hex");
        const keyPath = "/tmp/tpm_ak.ctx"; // Key context path
        const quotePath = "/tmp/tpm_quote.out";
        const pubKeyPath = "/tmp/tpm_pubkey.pem";

        // Create an Attestation Key (AK)
        await executeCommand(
            `tpm2_createprimary -C o -c primary.ctx -G rsa -g sha256 && \
            tpm2_createak -C primary.ctx -c ${keyPath} -G rsa -g sha256 -s rsassa -u ak.pub -r ak.priv`
        );

        // Fetch TPM Quote
        await executeCommand(
            `tpm2_quote -c ${keyPath} -l sha256:0 -q ${nonce} -m ${quotePath}`
        );

        // Export the Public Key
        await executeCommand(`tpm2_readpublic -c ${keyPath} -o ${pubKeyPath}`);

        // Read and encode the quote and public key
        const hardwareQuote = await fs.readFile(quotePath, "base64");
        const publicKey = await fs.readFile(pubKeyPath, "base64");

        return { hardwareQuote, publicKey };
    } catch (error) {
        console.error("Error fetching TPM quote:", error.message);
        throw error;
    }
}

/**
 * Verify a TPM-generated hardware signature.
 * Verifies data integrity using a TPM-generated hardware quote and public key.
 *
 * @param {Buffer|string} data - The data to verify.
 * @param {string} hardwareQuote - Base64-encoded TPM-generated hardware quote.
 * @param {string} publicKey - Base64-encoded public key for verification.
 * @returns {boolean} - True if the signature is valid, false otherwise.
 */
function verifyTPMSignature(data, hardwareQuote, publicKey) {
    console.log("Verifying hardware signature with TPM...");

    try {
        const verifier = crypto.createVerify("RSA-SHA256");
        verifier.update(data);
        verifier.end();

        // Convert inputs from base64
        const quoteBuffer = Buffer.from(hardwareQuote, "base64");
        const publicKeyBuffer = Buffer.from(publicKey, "base64");

        // Perform signature verification
        const isValid = verifier.verify(publicKeyBuffer, quoteBuffer);

        console.log(`Signature verification result: ${isValid}`);
        return isValid;
    } catch (error) {
        console.error("Error verifying TPM signature:", error.message);
        return false;
    }
}

/**
 * Execute a shell command asynchronously.
 * @param {string} command - The shell command to execute.
 * @returns {Promise<void>} - Resolves when the command completes.
 */
async function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(stderr || error.message));
            }
            console.log(stdout);
            resolve();
        });
    });
}

module.exports = {
    getTPMQuote,
    verifyTPMSignature,
};
