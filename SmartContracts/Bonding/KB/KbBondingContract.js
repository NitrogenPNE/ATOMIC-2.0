"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: KB Bonding Contract
//
// Description:
// This smart contract validates and manages bonding operations between KB 
// and MB. It ensures that all bonding operations meet the required standards 
// for data integrity, redundancy, and blockchain compliance. The contract 
// also logs bonded events to the ATOMIC blockchain for traceability.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { logSmartContractEvent } = require("../../../atomic-blockchain/ledgerManager");
const { validateFrequencyData } = require("../../../Validation/atomValidator");

/**
 * Validates the bonding structure between KB atoms and MB atoms.
 * Ensures compliance with data integrity and redundancy requirements.
 * @param {Array} protonAtoms - Array of proton KB atoms.
 * @param {Array} electronAtoms - Array of electron KB atoms.
 * @param {Array} neutronAtoms - Array of neutron KB atoms.
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

    console.log("Validation passed for KB bonding.");
}

/**
 * Logs the bonding event for a newly created MB atom.
 * @param {number} mbIndex - The index of the bonded MB atom.
 * @param {string} userAddress - The user address associated with the bonding process.
 * @returns {Promise<void>} - Logs the event to the blockchain ledger.
 */
async function recordBond(mbIndex, userAddress) {
    try {
        const eventDetails = {
            type: "Bonding",
            operation: "KB-to-MB",
            userAddress,
            mbIndex,
            timestamp: new Date().toISOString(),
        };

        await logSmartContractEvent(eventDetails);
        console.log(`Bonding event logged for MB index ${mbIndex}, User: ${userAddress}`);
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
// End of Module: KB Bonding Contract
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------ 
