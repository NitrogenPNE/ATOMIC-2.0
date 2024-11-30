"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Automated Smart Contract Validator
//
// Description:
// Validates, auto-generates, and enforces the integrity of smart contracts
// within the ATOMIC system. Designed for automation and scalability, ensuring
// contracts align with ATOMIC's operational policies and subscription models.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file operations.
// - crypto: For hash validation.
// - contractTemplates: Predefined contract templates for automation.
// - logger: Logs validation results and contract operations.
//
// Usage:
// const { validateSmartContract } = require('./smartContractValidator');
// validateSmartContract(userId, contractType).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const crypto = require("crypto");
const contractTemplates = require("./contractTemplates"); // Template library
const validationUtils = require("./validationUtils");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Constants
const ALLOWED_CONTRACT_SIZE = 1024 * 200; // Increased to 200 KB to allow flexibility
const HASH_ALGORITHM = "sha256";

/**
 * Validates and optionally auto-generates a smart contract.
 * @param {string} userId - User or node ID requesting the contract.
 * @param {string} contractType - Type of contract (e.g., "subscription", "shard-allocation").
 * @returns {Promise<boolean>} - Returns true if the contract is valid.
 */
async function validateSmartContract(userId, contractType) {
    logInfo(`Starting smart contract validation for userId: ${userId}, type: ${contractType}`);

    try {
        // Step 1: Generate or locate contract file
        const contractPath = await generateOrRetrieveContract(userId, contractType);

        // Step 2: Verify file size and existence
        await verifyContractSize(contractPath);

        // Step 3: Calculate and log contract hash
        const contractHash = await calculateContractHash(contractPath);
        logInfo(`Contract hash: ${contractHash}`);

        // Step 4: Validate schema and logic
        const contractContent = await fs.readJson(contractPath);
        await validateContractSchema(contractContent);
        await validateContractLogic(contractContent);

        logInfo(`Smart contract validation succeeded for userId: ${userId}`);
        return true;
    } catch (error) {
        logError(`Smart contract validation failed: ${error.message}`, { userId, contractType });
        throw error;
    }
}

/**
 * Generates or retrieves a smart contract based on the user and type.
 * @param {string} userId - User or node ID.
 * @param {string} contractType - Type of contract.
 * @returns {Promise<string>} - Path to the contract file.
 */
async function generateOrRetrieveContract(userId, contractType) {
    const contractPath = `./contracts/${userId}_${contractType}.json`;

    // Check if contract already exists
    if (await fs.pathExists(contractPath)) {
        logInfo(`Existing contract found: ${contractPath}`);
        return contractPath;
    }

    // Auto-generate contract from template
    const template = contractTemplates[contractType];
    if (!template) {
        throw new Error(`Unknown contract type: ${contractType}`);
    }

    const generatedContract = {
        ...template,
        userId,
        createdAt: new Date().toISOString(),
    };

    await fs.ensureDir("./contracts");
    await fs.writeJson(contractPath, generatedContract, { spaces: 2 });
    logInfo(`Generated new contract: ${contractPath}`);
    return contractPath;
}

/**
 * Verifies that the contract size does not exceed the allowed limit.
 * @param {string} contractPath - Path to the contract file.
 * @throws {Error} - If the file size exceeds the allowed limit.
 */
async function verifyContractSize(contractPath) {
    const stats = await fs.stat(contractPath);
    if (stats.size > ALLOWED_CONTRACT_SIZE) {
        throw new Error(`Contract size exceeds allowed limit: ${stats.size} bytes`);
    }
}

/**
 * Calculates the hash of the smart contract file.
 * @param {string} contractPath - Path to the contract file.
 * @returns {Promise<string>} - The calculated hash value.
 */
async function calculateContractHash(contractPath) {
    const fileBuffer = await fs.readFile(contractPath);
    return crypto.createHash(HASH_ALGORITHM).update(fileBuffer).digest("hex");
}

/**
 * Validates the schema of the smart contract.
 * @param {Object} contractContent - Parsed content of the smart contract.
 * @throws {Error} - If the schema validation fails.
 */
async function validateContractSchema(contractContent) {
    const isValidSchema = validationUtils.validateSchema(contractContent, validationUtils.smartContractSchema);

    if (!isValidSchema) {
        throw new Error("Smart contract schema validation failed.");
    }

    logInfo("Smart contract schema validated successfully.");
}

/**
 * Validates the logic of the smart contract.
 * @param {Object} contractContent - Parsed content of the smart contract.
 * @throws {Error} - If logic validation fails.
 */
async function validateContractLogic(contractContent) {
    const isLogicValid = validationUtils.validateLogic(contractContent);

    if (!isLogicValid) {
        throw new Error("Smart contract logic validation failed.");
    }

    logInfo("Smart contract logic validated successfully.");
}

module.exports = {
    validateSmartContract,
};

// ------------------------------------------------------------------------------
// End of Module: Automated Smart Contract Validator
// Version: 2.0.0 | Updated: 2024-11-24
// Change Log: Added automation for contract generation and enhanced validation.
// ------------------------------------------------------------------------------
