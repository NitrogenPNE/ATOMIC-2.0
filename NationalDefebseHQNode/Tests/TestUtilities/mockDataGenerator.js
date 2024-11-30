"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Mock Data Generator
//
// Description:
// Generates mock data for testing various components of the National Defense 
// HQ Node. Provides utilities to create sample data for shards, transactions, 
// and smart contracts for unit, integration, and penetration tests.
//
// Author: Shawn Blackmore
//
// Usage:
// const mockData = require('./mockDataGenerator');
// const mockShard = mockData.generateShard();
// console.log(mockShard);
// ------------------------------------------------------------------------------

const crypto = require("crypto");

/**
 * Generates a mock shard object.
 * @returns {Object} - A sample shard object.
 */
function generateShard() {
    const shardId = crypto.randomBytes(16).toString("hex");
    return {
        id: shardId,
        data: `Mock data for shard ${shardId}`,
        integrityHash: crypto.createHash("sha256").update(`Mock data for shard ${shardId}`).digest("hex"),
        timestamp: new Date().toISOString(),
    };
}

/**
 * Generates a mock transaction object.
 * @returns {Object} - A sample transaction object.
 */
function generateTransaction() {
    const transactionId = crypto.randomBytes(12).toString("hex");
    return {
        id: transactionId,
        from: `Node-${crypto.randomBytes(4).toString("hex")}`,
        to: `Node-${crypto.randomBytes(4).toString("hex")}`,
        amount: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        signature: crypto.randomBytes(64).toString("hex"),
    };
}

/**
 * Generates a mock smart contract object.
 * @returns {Object} - A sample smart contract object.
 */
function generateSmartContract() {
    const contractId = crypto.randomBytes(8).toString("hex");
    return {
        id: contractId,
        name: `MockContract-${contractId}`,
        content: {
            version: "1.0",
            logic: "return true;", // Simple logic for mock purposes
            parameters: {
                param1: "value1",
                param2: "value2",
            },
        },
        hash: crypto.createHash("sha256").update(`MockContract-${contractId}`).digest("hex"),
        createdAt: new Date().toISOString(),
    };
}

/**
 * Generates a list of mock nodes.
 * @param {number} count - Number of nodes to generate.
 * @returns {Array<Object>} - Array of mock node objects.
 */
function generateNodes(count = 5) {
    const nodes = [];
    for (let i = 0; i < count; i++) {
        const nodeId = `Node-${crypto.randomBytes(6).toString("hex")}`;
        nodes.push({
            id: nodeId,
            address: `192.168.0.${Math.floor(Math.random() * 255)}`,
            status: "active",
            role: "validator",
        });
    }
    return nodes;
}

module.exports = {
    generateShard,
    generateTransaction,
    generateSmartContract,
    generateNodes,
};

// ------------------------------------------------------------------------------
// End of Module: Mock Data Generator
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for generating mock test data.
// ------------------------------------------------------------------------------
