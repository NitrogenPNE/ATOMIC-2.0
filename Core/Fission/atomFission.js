"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Integrated Atom Fission Process
//
// Description:
// Optimized for military-grade security, this module handles classification,
// sharding, encryption, distribution of data, and token validation while 
// logging metadata to centralized blockchain ledgers.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const AtomFissionContract = require("../../SmartContracts/AtomFissionContract");
const { classifyData } = require("../Data/dataclassifier/script/dataClassifier");
const { shardDataIntoBits } = require("../Sharding/bitSharder");
const { distributeToPools } = require("../Distribution/bitAtomDistributor");
const { logShardCreation } = require("../../atomic-blockchain/scripts/ledgerManager");
const { writeShardMetadata } = require("../../atomic-blockchain/shardMetadataManager");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const NIKI = require("../../NIKI/predictionEngine");
const fs = require("fs-extra");

/**
 * Executes the Atom Fission Process, coordinating token validation, classification, sharding, and distribution.
 * @param {string} userId - User's unique identifier.
 * @param {string} tokenId - Unique token ID for validation.
 * @param {string} encryptedToken - Encrypted token data for Proof-of-Access.
 * @param {string} inputData - Raw input data (optional).
 * @param {string} filePath - Path to the input file (optional).
 * @returns {Promise<Object>} - Fission result containing the user address and bit atoms.
 */
async function atomFissionProcess(userId, tokenId, encryptedToken, inputData = null, filePath = null) {
    console.log(`Starting Atom Fission for User ID: ${userId}`);
    const atomFissionContract = new AtomFissionContract();

    try {
        // Step 1: Validate Inputs
        await validateInputs(userId, inputData, filePath);
        atomFissionContract.recordEvent("info", `Atom Fission initiated for User ID: ${userId}`);

        // Step 2: Validate Token
        console.log("Validating token for Proof-of-Access...");
        const tokenValidationResult = await validateToken(tokenId, encryptedToken);
        if (!tokenValidationResult.valid) {
            throw new Error("Invalid token: Access denied.");
        }
        atomFissionContract.recordEvent("info", `Token validated for User ID: ${userId}, Token ID: ${tokenId}`);

        let classificationResult;

        // Step 3: Classify Data
        if (filePath) {
            console.log(`Classifying input file: ${filePath}`);
            classificationResult = await classifyData(filePath);
        } else if (inputData) {
            console.log(`Classifying raw input data...`);
            classificationResult = await classifyData(inputData);
        } else {
            throw new Error("Missing required parameter: inputData or filePath.");
        }

        logClassificationResult(classificationResult);

        // Step 4: Shard Data into Bit Atoms
        console.log("Sharding data into bit atoms...");
        const { address, bitAtoms } = await shardDataIntoBits(userId, classificationResult);

        if (!bitAtoms || bitAtoms.length === 0) {
            throw new Error("No bit atoms generated.");
        }

        atomFissionContract.recordEvent("info", `Data sharded into bit atoms for User ID: ${userId}`);

        // Step 5: Predict Optimal Distribution with NIKI
        console.log("Predicting optimal shard distribution...");
        const optimalNodes = await NIKI.predictOptimalShardDistribution(address, bitAtoms);

        // Step 6: Log Shard Metadata to Blockchain
        console.log("Recording shard metadata to blockchain...");
        await writeShardMetadata(address, bitAtoms, optimalNodes, { tokenId });

        atomFissionContract.recordEvent("info", `Shard metadata recorded to blockchain for User ID: ${userId}`);

        // Step 7: Distribute Bit Atoms to Pools
        console.log("Distributing bit atoms to pools...");
        await distributeToPools(userId, bitAtoms, optimalNodes);

        atomFissionContract.recordEvent("info", `Bit atoms distributed for User ID: ${userId}`);

        console.log("Atom Fission process completed.");
        const fissionResult = { address, bitAtoms, optimalNodes };

        // Record success in the blockchain
        await logShardCreation(address, bitAtoms, { tokenId });
        atomFissionContract.recordEvent("success", `Atom Fission process completed successfully for User ID: ${userId}`);

        return fissionResult;
    } catch (error) {
        console.error(`Error during Atom Fission: ${error.message}`);
        atomFissionContract.recordEvent("error", `Atom Fission failed for User ID ${userId}: ${error.message}`);
        throw new Error(`Atom Fission failed for User ID ${userId}: ${error.message}`);
    }
}

/**
 * Validates input parameters for the fission process.
 * @param {string} userId - User's unique identifier.
 * @param {string} inputData - Raw input data (optional).
 * @param {string} filePath - Path to the input file (optional).
 */
async function validateInputs(userId, inputData, filePath) {
    console.log("Validating inputs...");
    if (!userId) {
        throw new Error("Invalid userId: Must be a non-empty string.");
    }

    if (!inputData && !filePath) {
        throw new Error("Missing required parameter: inputData or filePath.");
    }

    if (filePath) {
        const exists = await fs.pathExists(filePath);
        if (!exists) throw new Error(`File path does not exist: ${filePath}`);
    }

    console.log("All inputs are valid.");
}

/**
 * Logs a snippet of the classification result for debugging purposes.
 * @param {Object} classificationResult - Result of the classification process.
 */
function logClassificationResult(classificationResult) {
    const snippet = JSON.stringify(classificationResult, null, 2).slice(0, 1000);
    console.log(`Classification Result (snippet): ${snippet}...`);
}

module.exports = { atomFissionProcess };

// ------------------------------------------------------------------------------
// End of Module: Integrated Atom Fission Process
// Version: 3.0.0 | Updated: 2024-11-29
// Change Log: Added token validation for Proof-of-Access.
// ------------------------------------------------------------------------------
