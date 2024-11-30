"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Military-Grade Bit Sharding
 *
 * Description:
 * Handles quantum-resistant encryption, sharding, and distribution of data into bit atoms for
 * HQNode, CorporateHQNode, and NationalDefenseHQNode networks. Integrates
 * NIKI AI for optimal shard placement and logs shard creation into blockchain ledgers.
 *
 * Dependencies:
 * - quantumEncryption: For secure quantum-resistant encryption.
 * - fs-extra: For shard management and ledger operations.
 * - ledgerManager.js: Logs shard operations to the ATOMIC blockchain.
 * - predictionEngine: NIKI-powered shard placement optimization.
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

// **Paths and Constants**
const ADDRESS_LEDGER_DIR = path.resolve(__dirname, "../../Ledgers/UserAddresses");
const SHARD_BASE_DIR = path.resolve(__dirname, "../../Ledgers/Frequencies/BITS");

/**
 * Generates a unique address for a node (Corporate or National Defense).
 * @param {string} nodeType - Node type (e.g., "CorporateHQNode", "NationalDefenseHQNode").
 * @param {string} corporateId - Corporate or Defense identifier.
 * @returns {Promise<string>} - Generated address.
 */
async function generateNodeAddress(nodeType, corporateId) {
    const addressLedger = path.join(ADDRESS_LEDGER_DIR, `${corporateId}.json`);

    // Generate a unique address
    const uniqueIdentifier = uuid.v4();
    const address = quantumEncryption.signWithQuantum({
        nodeType,
        corporateId,
        uniqueIdentifier,
    });

    const addressData = {
        address,
        nodeType,
        corporateId,
        createdAt: new Date().toISOString(),
    };

    await fs.ensureDir(ADDRESS_LEDGER_DIR);
    await fs.writeJson(addressLedger, addressData, { spaces: 2 });

    console.log(`Address generated for ${nodeType} ID: ${corporateId}`);
    return address;
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
 * Shards encrypted data into bit atoms and logs shard frequencies.
 * @param {string} nodeType - Node type (e.g., "CorporateHQNode", "NationalDefenseHQNode").
 * @param {string} corporateId - Corporate or Defense identifier.
 * @param {string} data - Data to shard.
 * @returns {Promise<Object>} - Sharded data and node address.
 */
async function shardDataIntoBits(nodeType, corporateId, data) {
    const address = await generateNodeAddress(nodeType, corporateId);

    // Encrypt data using quantum encryption
    const encryptedObject = encryptDataWithQuantum(data);

    // Convert encrypted data into a buffer and shard into bit atoms
    const buffer = Buffer.from(encryptedObject.encryptedData, "base64");
    const bitAtoms = Array.from(buffer).flatMap((byte) =>
        [...Array(8)].map((_, bitIndex) => ({
            bit: (byte >> (7 - bitIndex)) & 1,
            particle: ["proton", "neutron", "electron"][bitIndex % 3],
            frequency: Math.floor(Math.random() * 1000) + 1,
        }))
    );

    await logShardFrequencies(address, bitAtoms, encryptedObject);

    // Predict optimal shard placement with NIKI
    const optimalNodes = await predictionEngine.predictOptimalShardDistribution(address, bitAtoms);

    console.log(`Data sharded into ${bitAtoms.length} atoms for address: ${address}`);
    return { address, bitAtoms, optimalNodes };
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
    generateNodeAddress,
    encryptDataWithQuantum,
};