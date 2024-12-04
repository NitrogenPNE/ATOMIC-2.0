"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Mining Ledger Synchronization and Bounce Rate Calculation
 *
 * Description:
 * Synchronizes mining ledgers across HQNode, CorporateHQNode, and NationalDefenseHQNode networks.
 * Calculates bounce rates for protons, neutrons, and electrons while ensuring redundancy checks
 * and military-specific thresholds for data retrieval. Incorporates PoA for every operation.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { validateTokenAccess } = require("../../../Pricing/TokenManagement/tokenValidation");
const { communicateWithNode } = require("../../../Utilities/shardNodeCommunicator");

// Paths to ledgers
const frequenciesBasePath = path.resolve(__dirname, "../../../Ledgers/Frequencies");
const miningBasePath = path.resolve(__dirname, "../../../Ledgers/Mining");

/**
 * Load JSON data safely from a given file.
 */
function loadJson(filePath) {
    try {
        return fs.existsSync(filePath) ? fs.readJsonSync(filePath) : [];
    } catch (error) {
        console.error(`Error reading JSON from ${filePath}:`, error.message);
        return [];
    }
}

/**
 * Save JSON data safely to a given file.
 */
function saveJson(filePath, data) {
    fs.writeJsonSync(filePath, data, { spaces: 2 });
}

/**
 * Calculate bounce rate: Bounce Rate = 1000 / Frequency.
 */
function calculateBounceRate(frequency) {
    return frequency > 0 ? (1000 / frequency).toFixed(2) : "Infinity";
}

/**
 * Ensure mining folders are synchronized with frequency-ledger addresses.
 * Validates token-based PoA and communicates with nodes for updates.
 * @param {string} tokenId - Token ID for PoA validation.
 * @param {string} encryptedToken - Encrypted token for PoA validation.
 */
async function syncMiningFolders(tokenId, encryptedToken) {
    try {
        console.log("Validating token for synchronization...");
        await validateTokenAccess(tokenId, encryptedToken);

        const atomTypes = ["BITS", "BYTES", "KB", "MB", "GB", "TB"];

        for (const type of atomTypes) {
            const freqPath = path.join(frequenciesBasePath, type);
            const miningPath = path.join(miningBasePath, type);

            await fs.ensureDir(miningPath);
            const addresses = await fs.readdir(freqPath);

            for (const address of addresses) {
                console.log(`Syncing folder for address: ${address} in ${type}...`);
                const miningAddressPath = path.join(miningPath, address);
                await fs.ensureDir(miningAddressPath);

                await createBounceRateFiles(miningAddressPath);

                // Notify relevant nodes
                await communicateWithNode(address, {
                    type: "syncMiningFolder",
                    payload: { type, address, tokenId },
                });
                console.log(`Node notified for folder synchronization: ${address}`);
            }
        }
    } catch (error) {
        console.error("Error during mining folder synchronization:", error.message);
        throw error;
    }
}

/**
 * Create empty bounce rate JSON files if not present.
 * @param {string} folderPath - Path to create bounce rate files.
 */
async function createBounceRateFiles(folderPath) {
    const files = ["protonBounceRate.json", "neutronBounceRate.json", "electronBounceRate.json"];

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        if (!fs.existsSync(filePath)) {
            console.log(`Creating ${file} in ${folderPath}`);
            await fs.writeJson(filePath, [], { spaces: 2 });
        }
    }
}

/**
 * Populate mining ledgers with bounce rate calculations for each atom type and particle.
 * Validates token-based PoA before processing.
 * @param {string} tokenId - Token ID for PoA validation.
 * @param {string} encryptedToken - Encrypted token for PoA validation.
 */
async function populateMiningLedger(tokenId, encryptedToken) {
    try {
        console.log("Validating token for ledger population...");
        await validateTokenAccess(tokenId, encryptedToken);

        const atomTypes = ["BITS", "BYTES", "KB", "MB", "GB", "TB"];

        for (const type of atomTypes) {
            const freqPath = path.join(frequenciesBasePath, type);
            const miningPath = path.join(miningBasePath, type);

            const addresses = await fs.readdir(freqPath);

            for (const address of addresses) {
                console.log(`Processing bounce rates for ${address} in ${type}...`);

                const particles = ["proton", "neutron", "electron"];
                for (const particle of particles) {
                    const freqFilePath = path.join(freqPath, address, `${particle}Frequency.json`);
                    const miningFilePath = path.join(miningPath, address, `${particle}BounceRate.json`);

                    const frequencyData = loadJson(freqFilePath);

                    // Safely extract bitAtoms and calculate bounce rates
                    const bounceRates = Array.isArray(frequencyData)
                        ? frequencyData.flatMap(({ bitAtoms = [] }) =>
                            bitAtoms.map(atom => ({
                                address,
                                particle,
                                bitIndex: atom.bitIndex,
                                frequency: atom.frequency,
                                bounceRate: calculateBounceRate(atom.frequency),
                                iv: atom.iv,
                                authTag: atom.authTag,
                                timestamp: new Date().toISOString(),
                                tokenId,
                            }))
                        )
                        : [];

                    saveJson(miningFilePath, bounceRates);
                    console.log(`Saved ${bounceRates.length} ${particle} atoms for ${address} in ${type}.`);
                }
            }
        }
    } catch (error) {
        console.error("Error during mining ledger population:", error.message);
        throw error;
    }
}

/**
 * Main Execution Block
 */
(async () => {
    try {
        const tokenId = "example-token-id"; // Replace with actual token
        const encryptedToken = "example-encrypted-token"; // Replace with actual encrypted token

        console.log("Synchronizing mining folders...");
        await syncMiningFolders(tokenId, encryptedToken);

        console.log("Populating mining ledger with bounce rates...");
        await populateMiningLedger(tokenId, encryptedToken);

        console.log("Bounce rate synchronization completed successfully.");
    } catch (error) {
        console.error("Error during mining ledger synchronization:", error.message);
    }
})();

module.exports = { syncMiningFolders, populateMiningLedger };
