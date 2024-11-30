"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Main Module: BitAtomDistributor Tests
//
// Description: 
// This module includes tests for the BitAtomDistributor functionalities within 
// the ATOMIC system. It validates storage path initialization, user address 
// management, and atom distribution to pools, alongside proper handling of 
// user-specific data. Mock dependencies simulate behavior of core ATOMIC 
// modules, allowing isolated testing of distribution and bounce rate operations.
//
// Author: Shawn Blackmore
//
// Dependencies: 
// - Node.js: Required runtime environment.
// - crypto: For encryption and hash generation.
// - jest: For mocking dependencies and structuring tests.
// - fs-extra: For file system interactions such as directory creation and JSON file reading.
// - path: For handling file paths and ensuring proper directory structures.
//
// Usage:
// Run this module using a test runner like Jest to confirm the integrity of 
// BitAtomDistributor functionality in ATOMIC.
//
// Example:
// Run `jest` in the terminal to execute tests for this module.
//
// Contact:
// For inquiries regarding licensing or usage, please contact:
// - Email: licensing@atomic.ca
// - Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');

// Mock dependencies
jest.mock('../../../AtomFission/AddressNode/Tracker/user/script/userAddressTracker', () => ({
    getUserAddressInfo: jest.fn(),  // Mock getUserAddressInfo
    validateUserAddress: jest.fn(),
}));

jest.mock('../../../Atom/Contracts/Distribution/script/bitAtomDistributorContract', () => ({
    createBitAtomProposal: jest.fn(),
    getBitAtomProposalStatus: jest.fn(),
}));

jest.mock('../../../Atom/Contracts/Staking/script/stakingContract', () => ({
    checkActiveStakes: jest.fn(),
}));

jest.mock('../../Logger/script/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
}));

jest.mock('fs-extra', () => ({
    readdir: jest.fn(),
    ensureDir: jest.fn(),
    pathExists: jest.fn(),
    readJson: jest.fn(),
    writeJson: jest.fn(),
}));

const { distributeToPools, initializeStoragePaths, loadBounceRates } = require('../script/bitAtomDistributor');
const { getUserAddressInfo, validateUserAddress } = require('../../../AtomFission/AddressNode/Tracker/user/script/userAddressTracker');
const { createBitAtomProposal } = require('../../../Atom/Contracts/Distribution/script/bitAtomDistributorContract');
const { checkActiveStakes } = require('../../../Atom/Contracts/Staking/script/stakingContract');
const { logInfo, logError } = require('../../Logger/script/logger');

const MINING_PATH = path.resolve(__dirname, '../../../Ledgers/Mining');
const DISTRIBUTION_PATH = path.resolve(__dirname, '../../../Ledgers/Distribution');

const testUserId = 'd9ff8a1e-4dd4-4248-a6fc-672c478fbdc3';
const mockAddress = 'ae208d14a58a59a0e68d200456a11161c1566c2cedd756b4f53acec9957c1f38';
const duration = 30;

describe('BitAtomDistributor Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Reset mocks between tests
    });

    it('should initialize storage paths', async () => {
        fs.ensureDir.mockResolvedValue();

        await initializeStoragePaths();

        expect(fs.ensureDir).toHaveBeenCalledWith(MINING_PATH);
        expect(fs.ensureDir).toHaveBeenCalledWith(DISTRIBUTION_PATH);
        expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Initialized storage paths'));
    });

    it('should create a proposal and distribute atoms for valid user and stake', async () => {
        validateUserAddress.mockResolvedValue(mockAddress);  // Mock user address validation
        createBitAtomProposal.mockResolvedValue({ id: 'proposal-1' });
        checkActiveStakes.mockResolvedValue({ amount: 100 });

        fs.readdir.mockResolvedValue(['address1', 'address2']);
        fs.readJson.mockResolvedValue([{ bitIndex: 0, particle: 'proton' }]);

        await distributeToPools(testUserId, duration);

        expect(validateUserAddress).toHaveBeenCalledWith(testUserId);
        expect(createBitAtomProposal).toHaveBeenCalledWith(`distribute ${testUserId} ${duration}`, 'system');
        expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Proposal created with ID: proposal-1'));
    });

    it('should handle no active stakes gracefully', async () => {
        console.log('Setting up mocks for getUserAddressInfo...');

        // Ensure correct mock setup for user info and stakes
        getUserAddressInfo.mockResolvedValue({ address: mockAddress }); // User has an address
        checkActiveStakes.mockResolvedValue(null);  // No active stakes

        // Run function and verify that it throws the "no active stake" error
        await expect(distributeToPools(testUserId, duration))
            .rejects.toThrow(`No active stake found for ${mockAddress} with duration: ${duration}`);

        // Confirm the logError call
        expect(logError).toHaveBeenCalledWith(expect.stringContaining('No active stake found'));
    });

    it('should load bounce rates correctly', async () => {
        const mockBounceRates = [
            { bitIndex: 0, particle: 'proton' },
            { bitIndex: 1, particle: 'neutron' },
            { bitIndex: 2, particle: 'electron' },
        ];

        fs.readJson
            .mockResolvedValueOnce([mockBounceRates[0]])
            .mockResolvedValueOnce([mockBounceRates[1]])
            .mockResolvedValueOnce([mockBounceRates[2]]);

        const result = await loadBounceRates(MINING_PATH, mockAddress);

        expect(result).toEqual(mockBounceRates);
        expect(fs.readJson).toHaveBeenCalledTimes(3);
    });

    it('should log error if bounce rate files are missing', async () => {
        fs.readJson.mockRejectedValue(new Error('File not found'));

        await loadBounceRates(MINING_PATH, mockAddress);

        expect(logError).toHaveBeenCalledWith(expect.stringContaining('Failed to load bounce rates'));
    });

    it('should skip atom types with no addresses found', async () => {
        fs.readdir.mockResolvedValue([]);

        validateUserAddress.mockResolvedValue(mockAddress);
        checkActiveStakes.mockResolvedValue({ amount: 100 });

        await distributeToPools(testUserId, duration);

        expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('No addresses found'));
        expect(logInfo).not.toHaveBeenCalledWith(expect.stringContaining('Distributing atoms for type'));
    });
});

// ------------------------------------------------------------------------------
// End of Main Module: BitAtomDistributor Tests
// Version: 1.0.0 | Updated: 2024-10-31
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------