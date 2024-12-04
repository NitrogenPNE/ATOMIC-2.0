"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: GB Bonding Manager (GB → TB)
 *
 * Description:
 * Bonds GB atoms into TB atoms while incorporating Token Proof-of-Access (PoA)
 * and shard node communication. Ensures data integrity, validates bonding operations,
 * and records transactions in the blockchain.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { validateTokenAccess } = require("../../../../Pricing/TokenManagement/tokenValidation");
const { communicateWithNode } = require("../../../../Utilities/shardNodeCommunicator");
const { validateBonding, recordBond } = require("../../../../SmartContracts/Bonding/TB/TbBondingContract");
const { logInfo, logError } = require("../../../../Logger/logger");

// Define paths for ledgers
const GB_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/GB/");
const TB_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/TB/");

/**
 * Bond GB atoms into a TB atom.
 * Integrates Token PoA and shard node communication.
 *
 * @param {string} userAddress - User-specific address.
 * @param {number} tbIndex - Index for the TB atom.
 * @param {string} tokenId - Token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - Encrypted token data for validation.
 * @returns {Object|null} - The bonded TB atom entry or null if bonding fails.
 */
async function bondGbToTb(userAddress, tbIndex, tokenId, encryptedToken) {
    try {
        logInfo("Validating token for TB bonding operation...");
        await validateTokenAccess(tokenId, encryptedToken);

        const protonPath = path.join(GB_LEDGER_PATH, userAddress, "protonBounceRate.json");
        const electronPath = path.join(GB_LEDGER_PATH, userAddress, "electronBounceRate.json");
        const neutronPath = path.join(GB_LEDGER_PATH, userAddress, "neutronBounceRate.json");

        const protonAtoms = loadJson(protonPath).flatMap(({ gbAtoms }) => gbAtoms || []);
        const electronAtoms = loadJson(electronPath).flatMap(({ gbAtoms }) => gbAtoms || []);
        const neutronAtoms = loadJson(neutronPath).flatMap(({ gbAtoms }) => gbAtoms || []);

        if (protonAtoms.length < 1024 || electronAtoms.length < 1024 || neutronAtoms.length < 1024) {
            logError(`Insufficient GB atoms for bonding at address: ${userAddress}`);
            return null;
        }

        const protonGroup = protonAtoms.slice(0, 1024);
        const electronGroup = electronAtoms.slice(0, 1024);
        const neutronGroup = neutronAtoms.slice(0, 1024);

        // Validate bonding using the contract
        await validateBonding(protonGroup, electronGroup, neutronGroup);

        const tbAtomEntry = createTbAtomEntry(protonGroup, electronGroup, neutronGroup, tbIndex);

        const ledgerPath = path.join(TB_LEDGER_PATH, userAddress, "tbLedger.json");
        const ledger = loadJson(ledgerPath);

        ledger.push(tbAtomEntry);
        saveJson(ledgerPath, ledger);

        // Record bonding in the blockchain
        await recordBond(userAddress, tbAtomEntry);

        // Notify shard node of bonding completion
        await communicateWithNode(userAddress, {
            type: "bondingComplete",
            payload: { tbAtomEntry, tokenId },
        });

        logInfo(`Bonded TB atom at index ${tbIndex} for user: ${userAddress}`);
        return tbAtomEntry;
    } catch (error) {
        logError(`Error bonding GB to TB: ${error.message}`);
        return null;
    }
}

/**
 * Synchronize GB and TB address folders.
 */
async function syncAddressFolders() {
    try {
        const gbFolders = await fs.readdir(GB_LEDGER_PATH);

        for (const folder of gbFolders) {
            const gbFolderPath = path.join(GB_LEDGER_PATH, folder);
            const tbFolderPath = path.join(TB_LEDGER_PATH, folder);

            if (fs.existsSync(gbFolderPath)) {
                logInfo(`Syncing folder for address: ${folder}`);
                await fs.ensureDir(tbFolderPath);
                await createEmptyBounceRateFiles(tbFolderPath);
            }
        }
    } catch (error) {
        logError(`Error syncing address folders: ${error.message}`);
    }
}

/**
 * Create empty BounceRate files for a TB folder.
 * @param {string} folderPath - Target folder path.
 */
async function createEmptyBounceRateFiles(folderPath) {
    const files = ["protonBounceRate.json", "neutronBounceRate.json", "electronBounceRate.json"];

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        if (!fs.existsSync(filePath)) {
            logInfo(`Creating empty file: ${filePath}`);
            await fs.writeJson(filePath, [], { spaces: 2 });
        }
    }
}

/**
 * Creates a TB atom entry from the provided atom groups.
 * @param {Array} protonAtoms - Array of proton atoms.
 * @param {Array} electronAtoms - Array of electron atoms.
 * @param {Array} neutronAtoms - Array of neutron atoms.
 * @param {number} tbIndex - The index for the TB atom.
 * @returns {Object} - TB atom entry with metadata and frequency.
 */
function createTbAtomEntry(protonAtoms, electronAtoms, neutronAtoms, tbIndex) {
    const representativeAtom = protonAtoms[0];
    const frequency = calculateGroupFrequency([...protonAtoms, ...electronAtoms, ...neutronAtoms]);

    return {
        type: "TB",
        tbIndex,
        timestamp: representativeAtom.timestamp,
        frequency,
        atomicWeight: 1024,
        gbAtoms: [...protonAtoms, ...electronAtoms, ...neutronAtoms],
    };
}

/**
 * Calculates the group frequency for a set of atoms.
 * @param {Array} atoms - Array of atoms with frequency data.
 * @returns {string} - The average frequency.
 */
function calculateGroupFrequency(atoms) {
    const validFrequencies = atoms.map((atom) => atom.frequency).filter((f) => typeof f === "number");
    const total = validFrequencies.reduce((sum, freq) => sum + freq, 0);
    return (total / validFrequencies.length).toFixed(2);
}

/**
 * Load JSON data from a file.
 * @param {string} filePath - Path to JSON file.
 * @returns {Array} - Parsed data or an empty array.
 */
function loadJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readJsonSync(filePath);
        }
        logInfo(`File not found: ${filePath}`);
        return [];
    } catch (error) {
        logError(`Error reading JSON from ${filePath}: ${error.message}`);
        return [];
    }
}

/**
 * Save JSON data to a file.
 * @param {string} filePath - Path to save JSON.
 * @param {Array} data - Data to save.
 */
function saveJson(filePath, data) {
    try {
        fs.writeJsonSync(filePath, data, { spaces: 2 });
        logInfo(`Data saved to ${filePath}`);
    } catch (error) {
        logError(`Error saving JSON to ${filePath}: ${error.message}`);
    }
}

// Start folder synchronization
syncAddressFolders().catch(console.error);

module.exports = { bondGbToTb };