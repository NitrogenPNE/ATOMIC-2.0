"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Transaction Tests
//
// Description:
// Validates transaction creation, quantum-resistant signing, ACL-based authorization,
// and integration within blocks for the ATOMIC blockchain.
//
// Dependencies:
// - Jest: For testing framework.
// - transaction.js: The core transaction implementation being tested.
// ------------------------------------------------------------------------------

const Transaction = require("../core/transaction");
const Block = require("../core/block");
const crypto = require("crypto");
const { isAuthorizedNode } = require("../utils/authUtils");

describe("Internal ATOMIC Blockchain Transaction Functionality", () => {
    describe("Transaction Creation", () => {
        it("should create a valid transaction with required fields", () => {
            const transaction = new Transaction({
                from: "node1",
                to: "node2",
                amount: 100,
                timestamp: Date.now(),
            });

            expect(transaction).toBeDefined();
            expect(transaction.from).toBe("node1");
            expect(transaction.to).toBe("node2");
            expect(transaction.amount).toBe(100);
            expect(transaction.signature).toBeNull();
        });

        it("should reject transactions with invalid fields", () => {
            expect(() => {
                new Transaction({ from: "node1", to: "", amount: -50 });
            }).toThrow("Invalid transaction data");
        });
    });

    describe("Quantum-Resistant Signing", () => {
        it("should sign a transaction using quantum-resistant keys", () => {
            const privateKey = crypto.generateKeyPairSync("rsa", {
                modulusLength: 4096, // Quantum-resistant strength
            }).privateKey;

            const transaction = new Transaction({
                from: "node1",
                to: "node2",
                amount: 200,
                timestamp: Date.now(),
            });

            transaction.sign(privateKey);

            expect(transaction.signature).toBeDefined();
            expect(typeof transaction.signature).toBe("string");
        });

        it("should verify a valid quantum-resistant signature", () => {
            const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
                modulusLength: 4096,
            });

            const transaction = new Transaction({
                from: "node1",
                to: "node2",
                amount: 200,
                timestamp: Date.now(),
            });

            transaction.sign(privateKey);

            const isValid = transaction.verify(publicKey);
            expect(isValid).toBe(true);
        });

        it("should fail verification for tampered transactions", () => {
            const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
                modulusLength: 4096,
            });

            const transaction = new Transaction({
                from: "node1",
                to: "node2",
                amount: 200,
                timestamp: Date.now(),
            });

            transaction.sign(privateKey);

            // Tamper with transaction data
            transaction.amount = 300;

            const isValid = transaction.verify(publicKey);
            expect(isValid).toBe(false);
        });
    });

    describe("Node Authorization", () => {
        it("should accept transactions from authorized nodes", () => {
            const transaction = new Transaction({
                from: "authorized-node",
                to: "node2",
                amount: 100,
                timestamp: Date.now(),
            });

            const isAuthorized = isAuthorizedNode(transaction.from);
            expect(isAuthorized).toBe(true);
        });

        it("should reject transactions from unauthorized nodes", () => {
            const transaction = new Transaction({
                from: "unauthorized-node",
                to: "node2",
                amount: 100,
                timestamp: Date.now(),
            });

            const isAuthorized = isAuthorizedNode(transaction.from);
            expect(isAuthorized).toBe(false);
        });
    });

    describe("Transaction Integration with Blocks", () => {
        it("should add valid transactions to a block", () => {
            const block = new Block({
                index: 1,
                previousHash: "0",
                timestamp: Date.now(),
                data: [],
                nonce: 0,
            });

            const transaction1 = new Transaction({
                from: "node1",
                to: "node2",
                amount: 50,
                timestamp: Date.now(),
            });

            const transaction2 = new Transaction({
                from: "node3",
                to: "node4",
                amount: 150,
                timestamp: Date.now(),
            });

            block.addTransaction(transaction1);
            block.addTransaction(transaction2);

            expect(block.data.length).toBe(2);
            expect(block.data[0]).toBe(transaction1);
            expect(block.data[1]).toBe(transaction2);
        });

        it("should reject invalid transactions from being added to a block", () => {
            const block = new Block({
                index: 1,
                previousHash: "0",
                timestamp: Date.now(),
                data: [],
                nonce: 0,
            });

            const invalidTransaction = new Transaction({
                from: "node1",
                to: "node2",
                amount: -100, // Invalid amount
                timestamp: Date.now(),
            });

            expect(() => {
                block.addTransaction(invalidTransaction);
            }).toThrow("Invalid transaction");
        });
    });

    describe("Transaction Status Reporting", () => {
        it("should generate a detailed transaction status report", () => {
            const transactions = [
                new Transaction({ from: "node1", to: "node2", amount: 50, timestamp: Date.now() }),
                new Transaction({ from: "node3", to: "node4", amount: 150, timestamp: Date.now() }),
            ];

            const report = Transaction.generateStatusReport(transactions);
            expect(report.totalTransactions).toBe(2);
            expect(report.acceptedTransactions).toContain(transactions[0]);
            expect(report.acceptedTransactions).toContain(transactions[1]);
        });

        it("should include rejected transactions in the status report", () => {
            const validTransaction = new Transaction({
                from: "node1",
                to: "node2",
                amount: 50,
                timestamp: Date.now(),
            });

            const invalidTransaction = new Transaction({
                from: "node3",
                to: "node4",
                amount: -150, // Invalid amount
                timestamp: Date.now(),
            });

            const report = Transaction.generateStatusReport([validTransaction, invalidTransaction]);
            expect(report.rejectedTransactions).toContain(invalidTransaction);
        });
    });
});