"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Unit Test for Shard Validator
//
// Description:
// Tests the functionality of the `shardValidator.js` module, ensuring shards
// are validated correctly based on ATOMIC blockchain and National Defense standards.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - Jest: Testing framework for executing unit tests.
// - Mock Data: Predefined shards for validation tests.
// - shardValidator: The module under test.
//
// Usage:
// Run the tests using the Jest framework: `npm test testShardValidator.js`
// ------------------------------------------------------------------------------

const shardValidator = require("../../Validation/shardValidator");
const mockDataGenerator = require("../TestUtilities/mockDataGenerator");
const { logTestInfo, logTestError, logTestResult } = require("../TestUtilities/testLogger");

describe("Shard Validator Unit Tests", () => {
    beforeAll(() => {
        logTestInfo("Starting Shard Validator Unit Tests...");
    });

    afterAll(() => {
        logTestInfo("Completed Shard Validator Unit Tests.");
    });

    test("Valid shard passes validation", async () => {
        const validShard = mockDataGenerator.generateValidShard();

        try {
            const result = await shardValidator.validateShard(validShard);
            logTestResult("Valid Shard Test", result === true, { shardId: validShard.id });

            expect(result).toBe(true);
        } catch (error) {
            logTestError("Valid Shard Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Shard with corrupted data fails validation", async () => {
        const corruptedShard = mockDataGenerator.generateCorruptedShard();

        try {
            const result = await shardValidator.validateShard(corruptedShard);
            logTestResult("Corrupted Shard Test", result === false, { shardId: corruptedShard.id });

            expect(result).toBe(false);
        } catch (error) {
            logTestError("Corrupted Shard Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Shard with invalid structure fails schema validation", async () => {
        const invalidStructureShard = mockDataGenerator.generateInvalidStructureShard();

        try {
            const result = await shardValidator.validateShard(invalidStructureShard);
            logTestResult("Invalid Structure Test", result === false, { shardId: invalidStructureShard.id });

            expect(result).toBe(false);
        } catch (error) {
            logTestError("Invalid Structure Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Shard missing required fields fails validation", async () => {
        const incompleteShard = mockDataGenerator.generateIncompleteShard();

        try {
            const result = await shardValidator.validateShard(incompleteShard);
            logTestResult("Incomplete Shard Test", result === false, { shardId: incompleteShard.id });

            expect(result).toBe(false);
        } catch (error) {
            logTestError("Incomplete Shard Test failed.", { error: error.message });
            throw error;
        }
    });
});
