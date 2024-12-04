"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Consensus Tests
//
// Description:
// Comprehensive tests for the consensus mechanism of the internal ATOMIC blockchain.
// Includes block proposal, voting, fork resolution, finalization, and dispute resolution.
//
// Dependencies:
// - Jest: For testing framework.
// - consensus.js: The core consensus implementation being tested.
//
// Author: Adaptation by [Your Name]
// ------------------------------------------------------------------------------

const Consensus = require("../core/consensus");
const Block = require("../core/block");

describe("Internal ATOMIC Blockchain Consensus Mechanism", () => {
    let consensusInstance;

    beforeAll(() => {
        // Initialize the consensus instance before tests
        consensusInstance = new Consensus();
    });

    afterEach(() => {
        // Reset any state in the consensus instance after each test
        consensusInstance.resetState();
    });

    describe("HQ-Supernode Arbitration", () => {
        it("should synchronize consensus results with HQ supernode", () => {
            const block = new Block({
                index: 2,
                previousHash: "abc123",
                timestamp: Date.now(),
                data: { transactions: ["tx-789"] },
                nonce: 42,
            });

            consensusInstance.proposeBlock(block);
            consensusInstance.castVotes(block, {
                totalNodes: 10,
                votesFor: 6,
                votesAgainst: 4,
            });

            const arbitrationResult = consensusInstance.syncWithHQSupernode(block);
            expect(arbitrationResult).toBe(true); // HQ confirms the consensus
        });

        it("should override peer votes if HQ supernode detects inconsistencies", () => {
            const block = new Block({
                index: 3,
                previousHash: "def456",
                timestamp: Date.now(),
                data: { transactions: ["tx-999"] },
                nonce: 21,
            });

            consensusInstance.proposeBlock(block);
            consensusInstance.castVotes(block, {
                totalNodes: 10,
                votesFor: 4,
                votesAgainst: 6,
            });

            const arbitrationResult = consensusInstance.syncWithHQSupernode(block);
            expect(arbitrationResult).toBe(false); // HQ rejects the block
        });
    });

    describe("Dispute Resolution", () => {
        it("should resolve chain inconsistencies automatically", () => {
            const validChain = [
                new Block({ index: 1, previousHash: "0", data: {}, nonce: 0 }),
                new Block({ index: 2, previousHash: "hash-1", data: {}, nonce: 1 }),
            ];

            const invalidChain = [
                new Block({ index: 1, previousHash: "0", data: {}, nonce: 0 }),
                new Block({ index: 2, previousHash: "invalid-hash", data: {}, nonce: 1 }),
            ];

            const resolvedChain = consensusInstance.resolveDisputes([validChain, invalidChain]);
            expect(resolvedChain).toEqual(validChain); // Valid chain is selected
        });

        it("should rollback invalid blocks on detection", () => {
            const blockchain = [
                new Block({ index: 1, previousHash: "0", data: {}, nonce: 0 }),
                new Block({ index: 2, previousHash: "hash-1", data: {}, nonce: 1 }),
                new Block({ index: 3, previousHash: "invalid-hash", data: {}, nonce: 2 }),
            ];

            const correctedChain = consensusInstance.rollbackInvalidBlocks(blockchain);
            expect(correctedChain).toHaveLength(2); // Only valid blocks remain
        });
    });

    describe("Consensus Status Reporting", () => {
        it("should generate a detailed status report after voting", () => {
            const block = new Block({
                index: 4,
                previousHash: "ghi789",
                timestamp: Date.now(),
                data: { transactions: ["tx-111", "tx-222"] },
                nonce: 84,
            });

            consensusInstance.proposeBlock(block);
            consensusInstance.castVotes(block, {
                totalNodes: 7,
                votesFor: 5,
                votesAgainst: 2,
            });

            const statusReport = consensusInstance.generateStatusReport();
            expect(statusReport).toHaveProperty("totalNodes", 7);
            expect(statusReport).toHaveProperty("votesFor", 5);
            expect(statusReport).toHaveProperty("votesAgainst", 2);
            expect(statusReport).toHaveProperty("selectedBlock", block.hash);
        });

        it("should include rejected blocks in the status report", () => {
            const acceptedBlock = new Block({
                index: 5,
                previousHash: "xyz123",
                timestamp: Date.now(),
                data: { transactions: ["tx-333"] },
                nonce: 18,
            });

            const rejectedBlock = new Block({
                index: 6,
                previousHash: "xyz123",
                timestamp: Date.now(),
                data: { transactions: ["tx-444"] },
                nonce: 99,
            });

            consensusInstance.proposeBlock(acceptedBlock);
            consensusInstance.castVotes(acceptedBlock, {
                totalNodes: 10,
                votesFor: 7,
                votesAgainst: 3,
            });

            consensusInstance.proposeBlock(rejectedBlock);
            consensusInstance.castVotes(rejectedBlock, {
                totalNodes: 10,
                votesFor: 3,
                votesAgainst: 7,
            });

            const statusReport = consensusInstance.generateStatusReport();
            expect(statusReport.rejectedBlocks).toContain(rejectedBlock.hash);
            expect(statusReport.selectedBlock).toBe(acceptedBlock.hash);
        });
    });
});