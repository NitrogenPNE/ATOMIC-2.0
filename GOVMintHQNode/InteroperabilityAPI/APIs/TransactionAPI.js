"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Advanced Transaction API
 *
 * Description:
 * Facilitates transaction processing with integrated quantum-resistant cryptography,
 * Proof-of-Access (PoA), and compliance with shard-level metadata validation.
 *
 * Features:
 * - Kyber-based quantum-resistant encryption for payloads.
 * - Dilithium-based digital signatures for transaction integrity.
 * - Secure key management for cryptographic operations.
 * - Shard metadata validation and Proof-of-Access enforcement.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const express = require("express");
const bodyParser = require("body-parser");
const { Transaction } = require("../../../../atomic-blockchain/core/transaction");
const { enforceCompliance, logTransaction } = require("../../Utilities/complianceValidator");
const {
    kyberEncrypt,
    kyberDecrypt,
    dilithiumSign,
    dilithiumVerify,
} = require("../../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { validateToken } = require("../../../../atomic-blockchain/core/tokenValidation");
const { getEncryptionKey } = require("../../Utilities/keyManager");

// **Configuration**
const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 8081;

// **Middleware: Validate and Process Transactions**
async function validateTransactionMiddleware(req, res, next) {
    const { payload, signature } = req.body;

    try {
        // Step 1: Decrypt the payload with Kyber
        const encryptionKey = await getEncryptionKey();
        const decryptedPayload = kyberDecrypt(payload, encryptionKey);

        // Step 2: Parse and construct the transaction
        const transaction = new Transaction(
            decryptedPayload.inputs,
            decryptedPayload.outputs,
            decryptedPayload.shardMetadata,
            decryptedPayload.tokenDetails,
            decryptedPayload.militaryClassification
        );

        // Step 3: Validate the transaction
        const isValid = await transaction.validate();
        if (!isValid) {
            return res.status(400).json({ error: "Transaction validation failed." });
        }

        // Step 4: Verify the digital signature with Dilithium
        const isSignatureValid = dilithiumVerify(
            decryptedPayload,
            signature,
            decryptedPayload.tokenDetails.publicKey
        );
        if (!isSignatureValid) {
            return res.status(400).json({ error: "Transaction signature verification failed." });
        }

        req.transaction = transaction; // Pass the validated transaction to the handler
        next();
    } catch (error) {
        console.error("Error during transaction validation:", error.message);
        return res.status(400).json({ error: "Invalid transaction payload." });
    }
}

// **Transaction Processing Endpoint**
app.post("/api/transaction/process", validateTransactionMiddleware, async (req, res) => {
    const transaction = req.transaction;

    try {
        // Step 1: Enforce compliance (e.g., AML/KYC)
        const complianceResult = enforceCompliance(transaction);
        if (!complianceResult.valid) {
            return res.status(400).json({ error: complianceResult.error });
        }

        // Step 2: Log the transaction
        await logTransaction({
            transactionId: transaction.id,
            inputs: transaction.inputs,
            outputs: transaction.outputs,
            metadata: transaction.shardMetadata,
        });

        // Step 3: Prepare and encrypt the response
        const response = {
            status: "Success",
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
        };
        const encryptionKey = await getEncryptionKey();
        const encryptedResponse = kyberEncrypt(response, encryptionKey);

        return res.status(200).json({ payload: encryptedResponse });
    } catch (error) {
        console.error("Error processing transaction:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// **Error Handling Middleware**
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ error: "An unexpected error occurred." });
});

// **Start the Server**
app.listen(PORT, () => {
    console.log(`Advanced TransactionAPI running on port ${PORT}`);
});

module.exports = app;
