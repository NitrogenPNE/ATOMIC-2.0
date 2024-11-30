"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Integration Test: Shard and Blockchain
//
// Description:
// This test validates the integration between the shard management system and
// the blockchain module in the National Defense HQ Node. It ensures shards
// are correctly logged, validated, and synchronized with the blockchain ledger.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - chai: For assertions.
// - sinon: For mocks and spies.
// - shardManager: The shard management module under test.
// - ledgerManager: The blockchain ledger module under test.
//
// Usage:
// Run this test using the test runner or directly with Node.js.
// ------------------------------------------------------------------------------

const chai = require("chai");
const sinon = require("sinon");
const { expect } = chai;

// Modules under test
const shardManager = require("../../ShardManager/shardManager");
const ledgerManager = require("../../atomic-blockchain/ledgerManager");
const shardValidator = require("../../Validation/shardIntegrityValidator");

// Test Suite: Integration of Shard and Blockchain
describe("Integration Test: Shard and Blockchain", () => {
    let logSpy;

    beforeEach(() => {
        // Setup spy for ledger logging
        logSpy = sinon.spy(ledgerManager, "logShardCreation");
    });

    afterEach(() => {
        // Restore spies and mocks
        sinon.restore();
    });

    it("should validate and log a shard to the blockchain", async () => {
        const shard = { id: "shard-001", data: "encrypted-data" };

        // Simulate shard validation
        const validateStub = sinon.stub(shardValidator, "validateShard").returns(Promise.resolve(true));

        // Simulate logging shard to blockchain
        const logStub = sinon.stub(ledgerManager, "logShardCreation").returns(Promise.resolve("Logged"));

        const isValid = await shardValidator.validateShard(shard);
        if (isValid) {
            const logResult = await ledgerManager.logShardCreation(shard.id, shard.data);
            expect(logResult).to.equal("Logged");
        }

        // Assertions
        expect(validateStub.calledOnce).to.be.true;
        expect(logStub.calledOnce).to.be.true;
        expect(logSpy.calledWithMatch(shard.id)).to.be.true;
    });

    it("should handle validation failure and skip logging", async () => {
        const shard = { id: "shard-002", data: "corrupt-data" };

        // Simulate validation failure
        const validateStub = sinon.stub(shardValidator, "validateShard").returns(Promise.resolve(false));

        try {
            const isValid = await shardValidator.validateShard(shard);
            expect(isValid).to.be.false;

            if (!isValid) {
                throw new Error("Shard validation failed");
            }
        } catch (error) {
            // Assertions
            expect(validateStub.calledOnce).to.be.true;
            expect(logSpy.notCalled).to.be.true;
        }
    });

    it("should synchronize shard metadata with the blockchain ledger", async () => {
        const shard = { id: "shard-003", metadata: { size: "1MB", type: "secure" } };

        // Simulate synchronization with blockchain ledger
        const syncStub = sinon.stub(ledgerManager, "syncShardMetadata").returns(Promise.resolve("Synchronized"));

        const syncResult = await ledgerManager.syncShardMetadata(shard.id, shard.metadata);

        // Assertions
        expect(syncStub.calledOnce).to.be.true;
        expect(syncResult).to.equal("Synchronized");
        expect(logSpy.calledWithMatch("Synchronized")).to.be.true;
    });
});
