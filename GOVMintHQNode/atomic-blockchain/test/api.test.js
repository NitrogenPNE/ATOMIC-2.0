"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: API Tests
//
// Description:
// Provides a comprehensive suite of tests for the API server in the ATOMIC blockchain.
// Validates endpoints, request handling, and response integrity to ensure a reliable
// and scalable API interface.
//
// Author: Adaptation by [Your Name]
//
// Dependencies:
// - Jest: For testing framework.
// - Supertest: For HTTP assertions.
// - fs-extra: For checking any necessary data consistency during tests.
// ------------------------------------------------------------------------------

const request = require("supertest");
const fs = require("fs-extra");
const apiServer = require("../api/apiServer");

const API_BASE_URL = "/api/v1";

describe("ATOMIC Blockchain API Server", () => {
    let server;

    beforeAll(() => {
        server = apiServer.listen(4000, () => console.log("Test API Server started on port 4000"));
    });

    afterAll((done) => {
        server.close(done);
    });

    describe("Blockchain Querying", () => {
        it("should fetch the blockchain state", async () => {
            const response = await request(server).get(`${API_BASE_URL}/blockchain`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.blocks)).toBe(true);
        });

        it("should return details for a specific block", async () => {
            const blockId = "block-123";
            const response = await request(server).get(`${API_BASE_URL}/block/${blockId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("blockId", blockId);
        });

        it("should return 404 for non-existent block", async () => {
            const response = await request(server).get(`${API_BASE_URL}/block/invalid-id`);
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("error", "Block not found");
        });
    });

    describe("Shard Storage Interaction", () => {
        it("should fetch shard metadata", async () => {
            const shardId = "shard-456";
            const response = await request(server).get(`${API_BASE_URL}/shard/${shardId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("shardId", shardId);
        });

        it("should return 404 for invalid shard ID", async () => {
            const response = await request(server).get(`${API_BASE_URL}/shard/invalid-id`);
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("error", "Shard not found");
        });
    });

    describe("Node Management", () => {
        it("should fetch a list of connected peers", async () => {
            const response = await request(server).get(`${API_BASE_URL}/peers`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.peers)).toBe(true);
        });

        it("should report health status of nodes", async () => {
            const response = await request(server).get(`${API_BASE_URL}/health`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("status", "healthy");
        });
    });
});