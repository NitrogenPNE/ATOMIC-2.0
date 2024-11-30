"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: MB Bonding Contract
//
// Description:
// This smart contract manages and validates bonding operations between MB 
// and GB. It ensures compliance with ATOMIC's military-grade standards 
// for data integrity, redundancy, and blockchain traceability. Bonding 
// events are securely logged to the ATOMIC blockchain.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { logSmartContractEvent } = require("../../../atomic-blockchain/ledgerManager");
const { validateFrequencyData } = require("../../../Validation/atomValidator");

/**
 * Validates the bonding structure for MB atoms to GB atoms.
 * Ensures that all necessary data integrity checks are performed.
 * @param {Array} protonAtoms - Array of proton MB atoms.
 * @param {Array} electronAtoms - Array of electron MB atoms.
 * @param {Array} neutronAtoms - Array of neutron MB atoms.
 * @throws {Error} - Throws error if validation fails.
 */
function validateStructure(protonAtoms, electronAtoms, neutronAtoms) {
    if (!Array.isArray(protonAtoms) || !Array.isArray(electronAtoms) || !Array.isArray(neutronAtoms)) {
        throw new Error("Invalid atom arrays: Expected arrays for proton, electron, and neutron atoms.");
    }

    if (protonAtoms.length < 1024 || electronAtoms.length < 1024 || neutronAtoms.length < 1024) {
        throw new Error("Insufficient atoms for bonding: Requires at least 1024 atoms per type.");
    }

    // Validate atom frequencies and consistency
    validateFrequencyData(protonAtoms, "proton");
    validateFrequencyData(electronAtoms, "electron");
    validateFrequencyData(neutronAtoms, "neutron");

    console.log("Validation passed for MB bonding.");
}

/**
 * Logs a bonding event for a newly created GB atom.
 * @param {number} gbIndex - The index of the bonded GB atom.
 * @param {string} userAddress - The user address associated with the bonding process.
 * @returns {Promise<void>} - Logs the event to the blockchain ledger.
 */
async function recordBond(gbIndex, userAddress) {
    try {
        const eventDetails = {
            type: "Bonding",
            operation: "MB-to-GB",
            userAddress,
            gbIndex,
            timestamp: new Date().toISOString(),
        };

        await logSmartContractEvent(eventDetails);
        console.log(`Bonding event logged for GB index ${gbIndex}, User: ${userAddress}`);
    } catch (error) {
        console.error(`Error logging bonding event: ${error.message}`);
        throw new Error("Failed to log bonding event to the blockchain.");
    }
}

module.exports = {
    validateStructure,
    recordBond,
};

// ------------------------------------------------------------------------------
// End of Module: MB Bonding Contract
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------ 