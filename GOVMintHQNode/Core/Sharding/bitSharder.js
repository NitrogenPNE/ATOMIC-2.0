"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Military-Grade Bit Sharding with Address Integration
 *
 * Description:
 * Handles quantum-resistant encryption, sharding, and distribution of data into bit atoms 
 * for GOVMintHQNode and its connected nodes. Integrates NIKI AI for optimal shard placement
 * and logs shard creation into blockchain ledgers. Ensures blockchain-compatible addresses
 * for all operations.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const uuid = require("uuid");
const quantumEncryption = require("../../atomic-blockchain/core/quantumEncryption"); // Quantum encryption utilities
const { logShardCreation } = require("../../atomic-blockchain/ledgerManager");
const predictionEngine = require("../../NIKI/predictionEngine");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const { communicateWithNode } = require("../../Utilities/shardNodeCommunicator");
const { issueAddress, validateAddress } = require("../../Utilities/addressIssuer");

// **Paths and Constants**
const ADDRESS_LEDGER_DIR = path.resolve(__dirname, "../../Ledgers/UserAddresses");
const SHARD_BASE_DIR = path.resolve(__dirname, "../../Ledgers/Frequencies/BITS");

/**
 * Validates the token before proceeding with data sharding.
 * @param {string} tokenId - The token ID to validate.
 * @param {string} encryptedToken - The encrypted token string.
 * @returns {Promise<boolean>} - True if the token is valid, otherwise false.
 */
async function validateAccessToken(tokenId, encryptedToken) {
    console.log("Validating access token...");
    const validation = await validateToken(tokenId, encryptedToken);
    if (!validation.valid) {
        console.error("Token validation failed:", validation.error);
        throw new Error("Invalid access token.");
    }
    console.log("Access token validated successfully.");
    return true;
}

/**
 * Generates and validates blockchain-compatible addresses for nodes.
 * @param {string} nodeType - Type of the node (e.g., "HQNode", "CorporateNode").
 * @param {string} corporateId - Corporate or node identifier.
 * @returns {Promise<Object>} - Address details, including token and signature.
 */
async function generateAndValidateNodeAddress(nodeType, corporateId) {
    // Issue a new address
    const issuedAddress = await issueAddress(nodeType, corporateId);

    // Validate the issued address to ensure integrity
    const isValid = await validateAddress(issuedAddress.blockchainAddress);
    if (!isValid) {
        throw new Error(`Generated address failed validation: ${issuedAddress.blockchainAddress}`);
    }

    console.log(`Generated and validated address for ${nodeType}: ${issuedAddress.blockchainAddress}`);
    return issuedAddress;
}

/**
 * Encrypts data using quantum-resistant encryption for secure sharding.
 * @param {string} data - Data to encrypt.
 * @returns {Object} - Encrypted data and quantum encryption metadata.
 */
function encryptDataWithQuantum(data) {
    return quantumEncryption.encryptWithQuantum(data);
}

/**
 * Shards encrypted data into bit atoms and assigns them to nodes in the GOVMintHQNode network.
 * @param {string} nodeType - Node type (e.g., "HQNode", "CorporateNode", "NationalDefenseNode").
 * @param {string} corporateId - Corporate or Defense identifier.
 * @param {string} data - Data to shard.
 * @param {string} tokenId - The token ID used for validation.
 * @param {string} encryptedToken - The encrypted token used for validation.
 * @returns {Promise<Object>} - Sharded data and node address.
 */
async function shardDataIntoBits(nodeType, corporateId, data, tokenId, encryptedToken) {
    // Validate the token before processing
    await validateAccessToken(tokenId, encryptedToken);

    // Generate and validate a node address
    const addressDetails = await generateAndValidateNodeAddress(nodeType, corporateId);

    // Encrypt data using quantum encryption
    const encryptedObject = encryptDataWithQuantum(data);

    // Convert encrypted data into a buffer and shard into bit atoms
    const buffer = Buffer.from(encryptedObject.encryptedData, "base64");
    const bitAtoms = Array.from(buffer).flatMap((byte) =>
        [...Array(8)].map((_, bitIndex) => ({
            bit: (byte >> (7 - bitIndex)) & 1,
            particle: ["proton", "neutron", "electron"][bitIndex % 3],
            frequency: Math.floor(Math.random() * 1000) + 1,
            associatedToken: tokenId, // Link shard with the token
        }))
    );

    await logShardFrequencies(addressDetails.blockchainAddress, bitAtoms, encryptedObject);

    // Predict optimal shard placement with NIKI
    const optimalNodes = await predictionEngine.predictOptimalShardDistribution(
        addressDetails.blockchainAddress,
        bitAtoms
    );

    // Communicate shard allocation with each node
    for (const node of optimalNodes) {
        await communicateWithNode(node.nodeAddress, {
            type: "shardData",
            payload: { address: addressDetails.blockchainAddress, bitAtoms },
        });
        console.log(`Shard data sent to node: ${node.nodeAddress}`);
    }

    console.log(`Data sharded into ${bitAtoms.length} atoms for address: ${addressDetails.blockchainAddress}`);
    return { address: addressDetails.blockchainAddress, bitAtoms, optimalNodes };
}

/**
 * Logs shard frequencies into frequency-ledgers.
 * @param {string} address - Node address.
 * @param {Array<Object>} bitAtoms - Sharded bit atoms.
 * @param {Object} encryptedObject - Quantum encryption metadata.
 */
async function logShardFrequencies(address, bitAtoms, encryptedObject) {
    const shardPath = path.join(SHARD_BASE_DIR, address);
    const ledgers = {
        proton: path.join(shardPath, "protonFrequency.json"),
        neutron: path.join(shardPath, "neutronFrequency.json"),
        electron: path.join(shardPath, "electronFrequency.json"),
    };

    // Ensure ledger directories exist
    await fs.ensureDir(shardPath);

    const frequencyData = {
        encryptionMetadata: encryptedObject,
        particles: {},
    };

    for (const atom of bitAtoms) {
        const { particle, frequency } = atom;
        frequencyData.particles[particle] = frequencyData.particles[particle] || [];
        frequencyData.particles[particle].push(frequency);
    }

    for (const [particle, filePath] of Object.entries(ledgers)) {
        if (frequencyData.particles[particle]) {
            await fs.writeJson(filePath, { frequencies: frequencyData.particles[particle] }, { spaces: 2 });
        }
    }

    await logShardCreation(address, frequencyData);
    console.log(`Shard frequencies logged for address: ${address}`);
}

module.exports = {
    shardDataIntoBits,
    generateAndValidateNodeAddress,
    encryptDataWithQuantum,
};