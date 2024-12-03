"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Cross-Border Transaction API
//
// Description:
// Facilitates secure cross-border transactions between nodes in the ATOMIC network
// and ensures compliance with Proof-of-Access (PoA), KYC, and AML requirements.
//
// Enhancements:
// - Token-based transaction validation.
// - Secure communication with quantum-resistant encryption.
// - AML/KYC compliance checks with real-time monitoring.
//
// Dependencies:
// - express: Web framework for REST API.
// - body-parser: Middleware for parsing JSON payloads.
// - crypto: For secure encryption and decryption.
// - complianceValidator.js: Validates transactions against AML/KYC policies.
// - quantumCryptoUtils.js: Provides encryption utilities.
//
// ------------------------------------------------------------------------------

const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const {
    validateTransaction,
    enforceCompliance,
    logTransaction,
} = require("../utils/complianceValidator");
const { encryptData, decryptData } = require("../utils/quantumCryptoUtils");
const { validateToken } = require("../../../../atomic-blockchain/core/tokenValidation");

// Configuration
const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 8080;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_secure_key";
const ENCRYPTION_ALGORITHM = "aes-256-quintum"; // Custom ATOMIC quantum encryption

// Middleware for validating incoming requests
async function verifyRequest(req, res, next) {
    const { partnerNode, signature, payload } = req.body;

    try {
        // Validate partner node token
        const isValidToken = await validateToken(partnerNode);
        if (!isValidToken) {
            return res.status(403).json({ error: "Unauthorized partner node." });
        }

        // Validate payload signature
        const expectedSignature = crypto
            .createHmac("sha256", ENCRYPTION_KEY)
            .update(payload)
            .digest("hex");

        if (signature !== expectedSignature) {
            return res.status(400).json({ error: "Invalid payload signature." });
        }

        // Decrypt payload
        req.decryptedPayload = decryptData(payload, ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
        next();
    } catch (error) {
        console.error("Error during request verification:", error.message);
        return res.status(400).json({ error: "Request verification failed." });
    }
}

// Cross-border transaction endpoint
app.post("/api/cross-border/transaction", verifyRequest, async (req, res) => {
    const { transactionId, sender, receiver, amount, currency, metadata } = req.decryptedPayload;

    try {
        // Validate transaction against compliance rules
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

        // Log transaction for auditing
        logTransaction({
            transactionId,
            sender,
            receiver,
            amount,
            currency,
            metadata,
        });

        // Create encrypted response
        const response = {
            status: "Success",
            transactionId,
            timestamp: new Date().toISOString(),
        };

        const encryptedResponse = encryptData(response, ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);

        return res.status(200).json({ payload: encryptedResponse });
    } catch (error) {
        console.error("Error processing cross-border transaction:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
});

// Start the server
app.listen(PORT, () => {
    console.log(`CrossBorderAPI running on port ${PORT}`);
});
