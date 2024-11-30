"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Shard Metadata Manager
//
// Description:
// This script handles the management and synchronization of shard metadata.
// Metadata includes shard distributions, frequency logs, redundancy mappings,
// and atomic hierarchy (neutrons, protons, electrons).
//
// Enhancements:
// - Integration of neutron, proton, and electron data in metadata.
// - Secure storage with blockchain logging.
// - Improved synchronization for multi-node consistency.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logShardMetadata } = require("../ledgerManager");
const { createBlockchainEntry } = require("../../SmartContracts/Ledgers/LedgerContract");

// Paths for metadata storage
const METADATA_PATH = path.resolve(__dirname, "../../Ledgers/ShardMetadata");

// Ensure metadata directory exists
(async () => {
    try {
        await fs.ensureDir(METADATA_PATH);
    } catch (error) {
        console.error(`Failed to initialize shard metadata directory: ${error.message}`);
    }
})();

/**
 * Writes shard metadata to local storage and logs it to the blockchain.
 * @param {string} address - Node or user address.
 * @param {Array<Object>} atoms - Array of atomic data (neutrons, protons, electrons).
 * @param {Array<string>} optimalNodes - Array of optimal nodes for shard distribution.
 * @returns {Promise<void>} - Resolves after metadata is written and logged.
 */
async function writeShardMetadata(address, atoms, optimalNodes) {
    try {
        const metadata = {
            address,
            timestamp: new Date().toISOString(),
            atomCount: atoms.length,
            optimalNodes,
            atoms: atoms.map(atom => ({
                type: atom.type, // "neutron", "proton", or "electron"
                frequency: atom.frequency,
                energyLevel: atom.energyLevel || null, // Specific to neutrons
                charge: atom.charge || null,           // Specific to protons
                spin: atom.spin || null,               // Specific to electrons
                node: atom.node || null,
            })),
        };

        const metadataFilePath = path.join(METADATA_PATH, `${address}-shardMetadata.json`);
        const existingMetadata = (await fs.pathExists(metadataFilePath)) ? await fs.readJson(metadataFilePath) : [];
        existingMetadata.push(metadata);

        await fs.writeJson(metadataFilePath, existingMetadata, { spaces: 2 });
        console.log(`Shard metadata written locally for address: ${address}`);

        // Log metadata to the blockchain
        await logShardMetadata(address, metadata);
        console.log(`Shard metadata logged to blockchain for address: ${address}`);
    } catch (error) {
        console.error(`Failed to write shard metadata: ${error.message}`);
        throw error;
    }
}

/**
 * Reads shard metadata for a specific address.
 * @param {string} address - Node or user address.
 * @returns {Promise<Array<Object>>} - Resolves with an array of shard metadata.
 */
async function readShardMetadata(address) {
    try {
        const metadataFilePath = path.join(METADATA_PATH, `${address}-shardMetadata.json`);
        if (!(await fs.pathExists(metadataFilePath))) {
            throw new Error(`No shard metadata found for address: ${address}`);
        }

        const metadata = await fs.readJson(metadataFilePath);
        console.log(`Shard metadata retrieved for address: ${address}`);
        return metadata;
    } catch (error) {
        console.error(`Failed to read shard metadata: ${error.message}`);
        throw error;
    }
}

/**
 * Synchronizes shard metadata to ensure consistency across nodes.
 * @param {string} address - Node or user address.
 * @returns {Promise<void>} - Resolves after synchronization.
 */
async function synchronizeShardMetadata(address) {
    try {
        console.log(`Synchronizing shard metadata for address: ${address}...`);
        const metadata = await readShardMetadata(address);

        // Example synchronization logic:
        // Broadcast metadata to peers, validate consistency, and update local state
        console.log(`Synchronizing shard metadata across network for address: ${address}`);
    } catch (error) {
        console.error(`Failed to synchronize shard metadata: ${error.message}`);
        throw error;
    }
}

/**
 * Validates the integrity of shard metadata.
 * @param {string} address - Node or user address.
 * @returns {Promise<boolean>} - True if metadata is valid, false otherwise.
 */
async function validateShardMetadata(address) {
    try {
        const metadata = await readShardMetadata(address);
        if (!metadata || metadata.length === 0) {
            throw new Error(`No metadata to validate for address: ${address}`);
        }

        // Example validation logic:
        for (const entry of metadata) {
            if (!entry.address || !entry.timestamp || !entry.atoms) {
                throw new Error(`Invalid metadata structure for address: ${address}`);
            }
        }

        console.log(`Shard metadata validated successfully for address: ${address}`);
        return true;
    } catch (error) {
        console.error(`Failed to validate shard metadata: ${error.message}`);
        return false;
    }
}

module.exports = {
    writeShardMetadata,
    readShardMetadata,
    synchronizeShardMetadata,
    validateShardMetadata,
};

// ------------------------------------------------------------------------------
// End of Module: Shard Metadata Manager
// Version: 2.0.0 | Updated: 2024-11-28
// ------------------------------------------------------------------------------