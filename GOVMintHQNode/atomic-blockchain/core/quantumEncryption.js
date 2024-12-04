"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Quantum-Resistant Cryptography
 *
 * Description:
 * Implements quantum-resistant encryption (Kyber) and signing (Dilithium) for secure
 * communication within the ATOMIC ecosystem.
 *
 * Dependencies:
 * - node-liboqs: Bindings for Open Quantum Safe (OQS) algorithms.
 *
 * Author: ATOMIC Development Team
 * -------------------------------------------------------------------------------
 */

const oqs = require("node-liboqs");

// Configuration Constants
const KYBER_ALGORITHM = "Kyber1024"; // Example: Kyber1024 for encryption
const DILITHIUM_ALGORITHM = "Dilithium5"; // Example: Dilithium5 for signing
const MESSAGE_ENCODING = "utf8";

/**
 * Generates a key pair for Kyber (encryption) or Dilithium (signing).
 * @param {string} algorithm - The algorithm name (e.g., "Kyber1024", "Dilithium5").
 * @returns {Object} - Public and private key pair.
 */
function generateKeyPair(algorithm) {
    const keyPair = oqs.KeyEncapsulation.generateKeypair(algorithm);
    return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
    };
}

/**
 * Encrypts a message using Kyber.
 * @param {string} message - The plaintext message to encrypt.
 * @param {Buffer} recipientPublicKey - The recipient's public key.
 * @returns {Object} - Ciphertext and shared secret.
 */
function encryptWithKyber(message, recipientPublicKey) {
    const kem = new oqs.KeyEncapsulation(KYBER_ALGORITHM);
    const { ciphertext, sharedSecret } = kem.encapsulate(recipientPublicKey);

    const iv = crypto.randomBytes(12); // AES-GCM IV
    const cipher = crypto.createCipheriv("aes-256-gcm", sharedSecret, iv);

    const encryptedMessage = Buffer.concat([
        cipher.update(message, MESSAGE_ENCODING),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
        ciphertext: ciphertext.toString("base64"),
        encryptedMessage: encryptedMessage.toString("base64"),
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
    };
}

/**
 * Decrypts a message using Kyber.
 * @param {Object} encryptedObject - The encrypted object containing ciphertext, IV, and tag.
 * @param {Buffer} privateKey - The recipient's private key.
 * @returns {string} - The decrypted plaintext message.
 */
function decryptWithKyber(encryptedObject, privateKey) {
    const { ciphertext, encryptedMessage, iv, authTag } = encryptedObject;

    const kem = new oqs.KeyEncapsulation(KYBER_ALGORITHM);
    const sharedSecret = kem.decapsulate(Buffer.from(ciphertext, "base64"), privateKey);

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        sharedSecret,
        Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    const decryptedMessage = Buffer.concat([
        decipher.update(Buffer.from(encryptedMessage, "base64")),
        decipher.final(),
    ]);

    return decryptedMessage.toString(MESSAGE_ENCODING);
}

/**
 * Signs a message using Dilithium.
 * @param {string} message - The plaintext message to sign.
 * @param {Buffer} privateKey - The signer's private key.
 * @returns {string} - The base64-encoded signature.
 */
function signWithDilithium(message, privateKey) {
    const sig = new oqs.Signature(DILITHIUM_ALGORITHM);
    return sig.sign(message, privateKey).toString("base64");
}

/**
 * Verifies a message signature using Dilithium.
 * @param {string} message - The plaintext message.
 * @param {string} signature - The base64-encoded signature.
 * @param {Buffer} publicKey - The signer's public key.
 * @returns {boolean} - True if the signature is valid, otherwise false.
 */
function verifyDilithiumSignature(message, signature, publicKey) {
    const sig = new oqs.Signature(DILITHIUM_ALGORITHM);
    return sig.verify(message, Buffer.from(signature, "base64"), publicKey);
}

// Exported Functions
module.exports = {
    generateKeyPair,
    encryptWithKyber,
    decryptWithKyber,
    signWithDilithium,
    verifyDilithiumSignature,
};

