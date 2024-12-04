"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Standard Contract Framework
//
// Description:
// Framework for deploying and managing contracts in the ATOMIC blockchain, aligned with atomic unit principles.
// ------------------------------------------------------------------------------

const path = require("path");
const fs = require("fs-extra");
const { signTransaction, verifyTransaction } = require("../utils/cryptoUtils");
const { logEvent } = require("../utils/loggingUtils");
const { saveDeployedContract, deleteDeployedContract, updateContractRegistry } = require("../utils/storageManager");
const { checkCompliance } = require("../utils/complianceChecker");
const shardManager = require("../utils/shardManager");

const CONTRACTS_DIR = path.join(__dirname, "../data/contracts");
const DEPLOYMENT_LOG_FILE = path.join(__dirname, "../logs/deployment.log");

/**
 * Deploy a standardized smart contract.
 * @param {string} contractFile - Path to the smart contract file.
 * @param {Object} abi - Contract Application Binary Interface.
 * @param {Object} initialArguments - Constructor arguments.
 * @param {Object} shardMetadata - Metadata for shard-based governance.
 * @param {Object} atomicMetadata - Metadata for atomic units (neutrons, protons, electrons).
 * @returns {Promise<string>} - Transaction ID of the deployed contract.
 */
async function deployContract(contractFile, abi, initialArguments, shardMetadata = {}, atomicMetadata = {}) {
    let transactionId = null;

    try {
        console.log(`Starting contract deployment: ${contractFile}`);

        // Step 1: Validate contract source and ABI
        const contractSource = await validateContractSource(contractFile);
        validateABI(abi);

        // Step 2: Check compliance with ATOMIC rules
        const complianceReport = checkCompliance(contractSource, abi, shardMetadata, atomicMetadata);
        if (!complianceReport.valid) {
            throw new Error(`Contract compliance failed: ${complianceReport.reason}`);
        }
        console.log("Contract passed compliance checks.");

        // Step 3: Validate atomic metadata
        validateAtomicMetadata(atomicMetadata);

        // Step 4: Prepare and sign the deployment payload
        const payload = prepareDeploymentPayload(contractSource, abi, initialArguments, shardMetadata, atomicMetadata);
        const signedPayload = signTransaction(payload, shardMetadata.encryptionKeyPath);
        console.log("Payload signed with quantum-safe signature.");

        // Step 5: Multi-signature approval (for sensitive deployments)
        if (shardMetadata.requiresApproval) {
            await requestApproval(signedPayload);
        }

        // Step 6: Broadcast deployment transaction
        transactionId = await sendDeploymentTransaction(signedPayload);
        console.log(`Contract deployed successfully. Transaction ID: ${transactionId}`);

        // Step 7: Log and persist deployment metadata
        await logEvent("ContractDeployment", { contractFile, transactionId, atomicMetadata });
        await saveDeployedContract(transactionId, { contractSource, abi, initialArguments, shardMetadata, atomicMetadata });
        await updateContractRegistry(transactionId, shardMetadata);
        console.log("Deployment metadata and registry updated.");

        return transactionId;
    } catch (error) {
        console.error("Error during contract deployment:", error.message);
        await logEvent("ContractDeploymentError", { error: error.message });

        // Rollback on failure
        if (transactionId) {
            console.log("Rolling back deployment...");
            await deleteDeployedContract(transactionId);
        }

        throw error;
    }
}

// ------------------------ Helper Functions ------------------------

async function validateContractSource(contractFile) {
    const contractSource = await fs.readFile(contractFile, "utf8");
    if (!contractSource.trim()) {
        throw new Error("Contract source file is empty or missing.");
    }
    console.log("Contract source validated.");
    return contractSource;
}

function validateABI(abi) {
    if (!Array.isArray(abi) || abi.length === 0) {
        throw new Error("Invalid ABI format.");
    }
    console.log("ABI validated.");
}

function prepareDeploymentPayload(contractSource, abi, initialArguments, shardMetadata, atomicMetadata) {
    return {
        type: "deployContract",
        source: contractSource,
        abi,
        arguments: initialArguments,
        shardMetadata,
        atomicMetadata,
        timestamp: Date.now(),
    };
}

function validateAtomicMetadata(atomicMetadata) {
    if (!atomicMetadata.neutrons || !atomicMetadata.protons || !atomicMetadata.electrons) {
        throw new Error("Atomic metadata must include neutrons, protons, and electrons.");
    }
    console.log("Atomic metadata validated.");
}

async function requestApproval(payload) {
    console.log("Requesting multi-signature approval...");
    // Simulate approval process
    const approvalGranted = true; // Replace with actual multi-signature logic
    if (!approvalGranted) {
        throw new Error("Multi-signature approval denied.");
    }
    console.log("Multi-signature approval granted.");
}

async function sendDeploymentTransaction(signedPayload) {
    console.log("Broadcasting deployment transaction...");
    const transactionId = `tx-${Date.now()}`;
    return transactionId;
}

// ------------------------ CLI Interface ------------------------

(async () => {
    const contractFile = process.argv[2];
    const abiFile = process.argv[3];
    const initialArguments = process.argv[4] ? JSON.parse(process.argv[4]) : {};
    const shardMetadata = process.argv[5] ? JSON.parse(process.argv[5]) : {};
    const atomicMetadata = process.argv[6] ? JSON.parse(process.argv[6]) : {};

    if (!contractFile || !abiFile) {
        console.error("Usage: node deployContract.js <contractFile> <abiFile> <initialArguments> <shardMetadata> <atomicMetadata>");
        process.exit(1);
    }

    try {
        console.log("Loading ABI...");
        const abi = await fs.readJson(abiFile);

        console.log("Deploying contract...");
        const transactionId = await deployContract(contractFile, abi, initialArguments, shardMetadata, atomicMetadata);

        console.log(`Contract deployed successfully. Transaction ID: ${transactionId}`);
    } catch (error) {
        console.error("Deployment failed:", error.message);
    }
})();