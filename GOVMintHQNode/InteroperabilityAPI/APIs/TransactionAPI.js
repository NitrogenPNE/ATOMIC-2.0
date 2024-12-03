"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Transaction API
//
// Description:
// Facilitates transaction processing, integrates with ATOMIC blockchain, and validates
// shard-level metadata and token-based Proof-of-Access.
//
// Features:
// - Quantum-resistant digital signature verification.
// - Shard metadata validation for transaction integrity.
// - Secure token validation for Proof-of-Access compliance.
//
// Dependencies:
// - express: Web framework for REST API.
// - body-parser: Middleware for parsing JSON payloads.
// - ../core/transaction.js: Provides core transaction logic.
// - quantumCryptoUtils.js: Provides encryption utilities.
// - complianceValidator.js: Validates transaction compliance with AML/KYC policies.
//
// ------------------------------------------------------------------------------

const express = require("express");
const bodyParser = require("body-parser");
const { Transaction } = require("../../../../atomic-blockchain/core/transaction");
const { enforceCompliance, logTransaction } = require("../utils/complianceValidator");
const { decryptData, encryptData } = require("../utils/quantumCryptoUtils");

// Configuration
const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 8081;
const ENCRYPTION_ALGORITHM = "aes-256-quintum"; // Custom ATOMIC encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_secure_key";

// Middleware for transaction validation
async function validateTransactionMiddleware(req, res, next) {
    const { payload, signature } = req.body;

    try {
        // Decrypt payload
        const decryptedPayload = decryptData(payload, ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);

        // Parse and validate transaction
        const transaction = new Transaction(
            decryptedPayload.inputs,
            decryptedPayload.outputs,
            decryptedPayload.shardMetadata,
            decryptedPayload.tokenDetails,
            decryptedPayload.militaryClassification
        );

        const isValid = await transaction.validate();
        if (!isValid) {
            return res.status(400).json({ error: "Transaction validation failed." });
        }

        req.transaction = transaction; // Pass validated transaction to handler
        next();
    } catch (error) {
        console.error("Error during transaction validation:", error.message);
        return res.status(400).json({ error: "Invalid transaction payload." });
    }
}

// Transaction processing endpoint
app.post("/api/transaction/process", validateTransactionMiddleware, async (req, res) => {
    const transaction = req.transaction;

    try {
        // Enforce compliance
        const complianceResult = enforceCompliance(transaction);
        if (!complianceResult.valid) {
            return res.status(400).json({ error: complianceResult.error });
        }

        // Log transaction
        logTransaction({
            transactionId: transaction.id,
            inputs: transaction.inputs,
            outputs: transaction.outputs,
            metadata: transaction.shardMetadata,
        });

        // Encrypt response
        const response = {
            status: "Success",
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
        };
        const encryptedResponse = encryptData(response, ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);

        return res.status(200).json({ payload: encryptedResponse });
    } catch (error) {
        console.error("Error processing transaction:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ error: "An unexpected error occurred." });
});

// Start the server
app.listen(PORT, () => {
    console.log(`TransactionAPI running on port ${PORT}`);
});
