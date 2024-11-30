"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Unit Test for Block Validator
//
// Description:
// Tests the functionality of the `blockValidator.js` module, ensuring blocks
// are validated correctly based on ATOMIC blockchain standards.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - Jest: Testing framework for executing unit tests.
// - Mock Data: Predefined blocks for validation tests.
// - blockValidator: The module under test.
//
// Usage:
// Run the tests using the Jest framework: `npm test testBlockValidator.js`
// ------------------------------------------------------------------------------

const blockValidator = require("../../Validation/blockValidator");
const mockDataGenerator = require("../TestUtilities/mockDataGenerator");
const { logTestInfo, logTestError, logTestResult } = require("../TestUtilities/testLogger");

describe("Block Validator Unit Tests", () => {
    beforeAll(() => {
        logTestInfo("Starting Block Validator Unit Tests...");
    });

    afterAll(() => {
        logTestInfo("Completed Block Validator Unit Tests.");
    });

    test("Valid block passes validation", async () => {
        const validBlock = mockDataGenerator.generateValidBlock();

        try {
            const result = await blockValidator.validateBlock(validBlock, validBlock.previousHash);
            logTestResult("Valid Block Test", result === true, { blockId: validBlock.id });

            expect(result).toBe(true);
        } catch (error) {
            logTestError("Valid Block Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Block with invalid hash fails validation", async () => {
        const invalidBlock = mockDataGenerator.generateInvalidBlockHash();

        try {
            const result = await blockValidator.validateBlock(invalidBlock, invalidBlock.previousHash);
            logTestResult("Invalid Hash Test", result === false, { blockId: invalidBlock.id });

            expect(result).toBe(false);
        } catch (error) {
            logTestError("Invalid Hash Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Block with mismatched previous hash fails validation", async () => {
        const mismatchedBlock = mockDataGenerator.generateMismatchedPreviousHashBlock();

        try {
            const result = await blockValidator.validateBlock(mismatchedBlock, "incorrectPreviousHash");
            logTestResult("Mismatched Previous Hash Test", result === false, { blockId: mismatchedBlock.id });

            expect(result).toBe(false);
        } catch (error) {
            logTestError("Mismatched Previous Hash Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Block with invalid structure fails schema validation", async () => {
        const invalidStructureBlock = mockDataGenerator.generateInvalidStructureBlock();

        try {
            const result = await blockValidator.validateBlock(invalidStructureBlock, invalidStructureBlock.previousHash);
            logTestResult("Invalid Structure Test", result === false, { blockId: invalidStructureBlock.id });

            expect(result).toBe(false);
        } catch (error) {
            logTestError("Invalid Structure Test failed.", { error: error.message });
            throw error;
        }
    });
});
