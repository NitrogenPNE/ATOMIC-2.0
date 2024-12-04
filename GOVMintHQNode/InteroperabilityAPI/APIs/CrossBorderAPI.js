"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Cross-Border Transaction API with Quantum Security
 *
 * Description:
 * Facilitates secure cross-border transactions between nodes in the ATOMIC network
 * using quantum-resistant encryption (Kyber) and signing (Dilithium).
 *
 * Enhancements:
 * - Token-based transaction validation.
 * - Secure communication with quantum-resistant encryption.
 * - AML/KYC compliance checks with real-time monitoring.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const express = require("express");
const bodyParser = require("body-parser");
const {
    validateTransaction,
    enforceCompliance,
    logTransaction,
} = require("../utils/complianceValidator");
const {
    encryptWithKyber,
    decryptWithKyber,
    signWithDilithium,
    verifyDilithiumSignature,
    generateKeyPair,
} = require("../utils/quantumCrypto");
const { validateToken } = require("../../../../atomic-blockchain/core/tokenValidation");

// **Configuration**
const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 8080;

// **Middleware: Verify and Decrypt Requests**
async function verifyRequest(req, res, next) {
    const { partnerNode, signature, payload, publicKey } = req.body;

    try {
        // Step 1: Validate partner node token
        const tokenValidation = await validateToken(partnerNode.tokenId, partnerNode.encryptedToken);
        if (!tokenValidation.valid) {
            return res.status(403).json({ error: "Unauthorized partner node." });
        }

        // Step 2: Verify signature with Dilithium
        const isSignatureValid = verifyDilithiumSignature(payload, signature, Buffer.from(publicKey, "base64"));
        if (!isSignatureValid) {
            return res.status(400).json({ error: "Invalid payload signature." });
        }

        // Step 3: Decrypt payload using Kyber
        const decryptedPayload = decryptWithKyber(JSON.parse(payload), tokenValidation.tokenDetails.privateKey);
        req.decryptedPayload = decryptedPayload;

        next();
    } catch (error) {
        console.error("Request verification failed:", error.message);
        return res.status(400).json({ error: "Request verification failed." });
    }
}

// **Cross-Border Transaction Endpoint**
app.post("/api/cross-border/transaction", verifyRequest, async (req, res) => {
    const { transactionId, sender, receiver, amount, currency, metadata } = req.decryptedPayload;

    try {
        // Step 1: Validate transaction against compliance rules
        const complianceResult = enforceCompliance({
            transactionId,
            sender,
            receiver,
            amount,
            currency,
        });

        if (!complianceResult.valid) {
            return res.status(400).json({ error: complianceResult.error });
        }

        // Step 2: Log transaction for auditing
        await logTransaction({
            transactionId,
            sender,
            receiver,
            amount,
            currency,
            metadata,
        });

        // Step 3: Prepare response and encrypt with Kyber
        const response = {
            status: "Success",
            transactionId,
            timestamp: new Date().toISOString(),
        };

        const encryptedResponse = encryptWithKyber(response, req.decryptedPayload.publicKey);
        return res.status(200).json({ payload: encryptedResponse });
    } catch (error) {
        console.error("Error processing transaction:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// **Error Handler**
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
});

// **Start Server**
app.listen(PORT, () => {
    console.log(`Cross-Border API running on port ${PORT}`);
});

module.exports = app;
