"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Ledger Contract Integration
//
// Description:
// This module provides methods for interacting with the ATOMIC blockchain's
// smart contract system. Handles logging, querying, and verifying metadata
// related to shard and atom management.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const Web3 = require("web3");
const fs = require("fs-extra");
const path = require("path");

// Load contract ABI and address
const CONTRACT_ABI_PATH = path.resolve(__dirname, "../../Ledgers/Ledgers/LedgerContract.abi.json");
const CONTRACT_ADDRESS_PATH = path.resolve(__dirname, "../../Ledgers/Ledgers/LedgerContract.address");

const CONTRACT_ABI = fs.readJsonSync(CONTRACT_ABI_PATH);
const CONTRACT_ADDRESS = fs.readFileSync(CONTRACT_ADDRESS_PATH, "utf8").trim();

// Configure Web3 and Contract
const web3 = new Web3(process.env.BLOCKCHAIN_NODE_URL || "http://localhost:8545");
const ledgerContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

// **Functions**

/**
 * Logs metadata to the blockchain via the ledger contract.
 * @param {string} address - The user or node address.
 * @param {Object} metadata - The metadata object to log.
 * @returns {Promise<string>} - The transaction hash.
 */
async function createBlockchainEntry(address, metadata) {
    try {
        const account = process.env.CONTRACT_OWNER_ACCOUNT || "0xYourAccountAddressHere";
        const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY || "0xYourPrivateKeyHere";

        const data = ledgerContract.methods.logMetadata(address, JSON.stringify(metadata)).encodeABI();

        const tx = {
            to: CONTRACT_ADDRESS,
            data,
            gas: 3000000,
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log(`Metadata logged on blockchain. Tx Hash: ${receipt.transactionHash}`);
        return receipt.transactionHash;
    } catch (error) {
        console.error(`Failed to create blockchain entry: ${error.message}`);
        throw error;
    }
}

/**
 * Retrieves logged metadata from the blockchain for a specific address.
 * @param {string} address - The user or node address.
 * @returns {Promise<Object>} - The retrieved metadata object.
 */
async function getBlockchainMetadata(address) {
    try {
        const metadata = await ledgerContract.methods.getMetadata(address).call();
        console.log(`Metadata retrieved for address: ${address}`);
        return JSON.parse(metadata);
    } catch (error) {
        console.error(`Failed to retrieve blockchain metadata: ${error.message}`);
        throw error;
    }
}

/**
 * Verifies the integrity of logged metadata.
 * @param {string} address - The user or node address.
 * @param {Object} metadata - The metadata to verify.
 * @returns {Promise<boolean>} - True if the metadata matches the blockchain entry.
 */
async function verifyMetadataIntegrity(address, metadata) {
    try {
        const blockchainMetadata = await getBlockchainMetadata(address);
        const isValid = JSON.stringify(blockchainMetadata) === JSON.stringify(metadata);

        console.log(
            `Metadata verification for address ${address}: ${isValid ? "Passed" : "Failed"}`
        );
        return isValid;
    } catch (error) {
        console.error(`Failed to verify metadata integrity: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createBlockchainEntry,
    getBlockchainMetadata,
    verifyMetadataIntegrity,
};

// ------------------------------------------------------------------------------
// End of Module: Ledger Contract Integration
// Version: 1.0.0 | Updated: 2024-11-28
// ------------------------------------------------------------------------------
