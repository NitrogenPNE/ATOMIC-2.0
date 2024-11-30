"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Address Issuer
//
// Description:
// Handles the generation and management of unique blockchain-compatible addresses
// for subscribing nodes (Corporate and National Defense). Ensures each node is
// associated with a verified corporate identity and prevents duplicate address issuance.
//
// Author: ATOMIC Development Team
//
// Dependencies:
// - crypto: For secure address generation.
// - fs-extra: For managing address records in a local JSON ledger.
// - uuid: To generate unique identifiers for issued addresses.
//
// Usage:
// const { issueAddress, validateAddress } = require("./addressIssuer");
// const address = await issueAddress("Corporate", "CORP-ID-001");
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const uuid = require("uuid");

// Path to store the address ledger
const ADDRESS_LEDGER_PATH = path.resolve(__dirname, "subscriptionLedger.json");

/**
 * Initialize the address ledger file if it doesn't exist.
 */
async function initializeLedger() {
    if (!(await fs.pathExists(ADDRESS_LEDGER_PATH))) {
        await fs.writeJson(ADDRESS_LEDGER_PATH, { issuedAddresses: [] }, { spaces: 2 });
        console.log(`Initialized address ledger at: ${ADDRESS_LEDGER_PATH}`);
    }
}

/**
 * Issue a unique blockchain-compatible address for a subscribing node.
 * @param {string} nodeType - Type of the node (e.g., "Corporate", "National Defense").
 * @param {string} corporateId - Verified corporate or national defense identifier.
 * @returns {Promise<string>} - The newly issued blockchain address.
 */
async function issueAddress(nodeType, corporateId) {
    // Validate inputs
    if (!nodeType || !corporateId) {
        throw new Error("Node type and corporate ID are required to issue an address.");
    }

    // Ensure the ledger exists
    await initializeLedger();

    // Load the current ledger
    const ledger = await fs.readJson(ADDRESS_LEDGER_PATH);

    // Generate a unique blockchain-compatible address
    const uniqueIdentifier = uuid.v4();
    const blockchainAddress = crypto
        .createHash("sha256")
        .update(`${nodeType}-${corporateId}-${uniqueIdentifier}`)
        .digest("hex");

    // Check for duplicate addresses
    if (ledger.issuedAddresses.some((entry) => entry.address === blockchainAddress)) {
        throw new Error("Address collision detected. Retry issuing the address.");
    }

    // Add the new address to the ledger
    const newAddressEntry = {
        address: blockchainAddress,
        nodeType,
        corporateId,
        issuedAt: new Date().toISOString(),
    };
    ledger.issuedAddresses.push(newAddressEntry);

    // Save the updated ledger
    await fs.writeJson(ADDRESS_LEDGER_PATH, ledger, { spaces: 2 });

    console.log(`Issued new address: ${blockchainAddress} for ${nodeType} (${corporateId})`);
    return blockchainAddress;
}

/**
 * Validate an address for existence in the ledger.
 * @param {string} address - The blockchain address to validate.
 * @returns {Promise<boolean>} - True if the address exists, false otherwise.
 */
async function validateAddress(address) {
    if (!address) {
        throw new Error("Address is required for validation.");
    }

    // Ensure the ledger exists
    await initializeLedger();

    // Load the ledger
    const ledger = await fs.readJson(ADDRESS_LEDGER_PATH);

    // Check if the address exists in the ledger
    return ledger.issuedAddresses.some((entry) => entry.address === address);
}

module.exports = {
    issueAddress,
    validateAddress,
};

// ------------------------------------------------------------------------------
// End of Module: Address Issuer
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial release for ATOMIC HQ Node Subscriptions.
// ------------------------------------------------------------------------------