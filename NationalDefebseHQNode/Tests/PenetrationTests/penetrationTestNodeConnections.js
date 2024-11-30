"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Penetration Test: Node Connections
//
// Description:
// Simulates penetration testing scenarios to evaluate the security of node
// connections within the National Defense HQ Node. Ensures that unauthorized
// nodes are detected, logged, and denied access while validating secure 
// communication protocols.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - chai: For assertions.
// - sinon: For mocks and spies.
// - axios: For simulating HTTP/WebSocket requests.
// - logger: Logs penetration test results.
//
// Usage:
// Execute this script using a test runner or directly with Node.js.
//
// ------------------------------------------------------------------------------

const chai = require("chai");
const sinon = require("sinon");
const axios = require("axios");
const WebSocket = require("ws");
const { expect } = chai;

// Modules under test
const { logInfo, logError } = require("../../Monitoring/activityAuditLogger");

// Configuration
const NODE_WS_ENDPOINT = "ws://localhost:9091"; // Adjust to actual WebSocket endpoint
const API_ENDPOINT = "http://localhost:9090"; // Adjust to actual API endpoint

// Test Suite: Penetration Test for Node Connections
describe("Penetration Test: Node Connections", () => {
    let logSpy;

    beforeEach(() => {
        // Setup spies for logging
        logSpy = sinon.spy(console, "log");
    });

    afterEach(() => {
        // Restore spies and mocks
        sinon.restore();
    });

    it("should reject unauthorized node connection attempts", (done) => {
        const ws = new WebSocket(NODE_WS_ENDPOINT, {
            headers: {
                "X-Node-ID": "unauthorized-node",
            },
        });

        ws.on("open", () => {
            ws.send(JSON.stringify({ action: "connect", nodeId: "unauthorized-node" }));
        });

        ws.on("error", (error) => {
            expect(error.message).to.include("unexpected server response 403");
            expect(logSpy.calledWithMatch("Unauthorized node connection attempt detected")).to.be.true;
            done();
        });
    });

    it("should allow authorized nodes to establish connections", (done) => {
        const ws = new WebSocket(NODE_WS_ENDPOINT, {
            headers: {
                "X-Node-ID": "authorized-node",
                Authorization: "Bearer valid-node-token",
            },
        });

        ws.on("open", () => {
            ws.send(JSON.stringify({ action: "connect", nodeId: "authorized-node" }));
        });

        ws.on("message", (message) => {
            const response = JSON.parse(message);
            expect(response.status).to.equal("connected");
            expect(logSpy.calledWithMatch("Authorized node connected")).to.be.true;
            ws.close();
            done();
        });
    });

    it("should log and block connection attempts from banned nodes", (done) => {
        const ws = new WebSocket(NODE_WS_ENDPOINT, {
            headers: {
                "X-Node-ID": "banned-node",
            },
        });

        ws.on("open", () => {
            ws.send(JSON.stringify({ action: "connect", nodeId: "banned-node" }));
        });

        ws.on("error", (error) => {
            expect(error.message).to.include("unexpected server response 403");
            expect(logSpy.calledWithMatch("Connection attempt from banned node detected")).to.be.true;
            done();
        });
    });

    it("should prevent MITM attacks by validating node certificates", async () => {
        try {
            await axios.get(`${API_ENDPOINT}/validate-node-cert`, {
                headers: {
                    "X-Node-ID": "test-node",
                    "X-Cert": "tampered-cert",
                },
            });
        } catch (error) {
            expect(error.response.status).to.equal(400);
            expect(logSpy.calledWithMatch("Certificate validation failed for node: test-node")).to.be.true;
        }
    });

    it("should log multiple failed connection attempts from the same node", async () => {
        for (let i = 0; i < 3; i++) {
            try {
                await axios.get(`${API_ENDPOINT}/connect-node`, {
                    headers: {
                        "X-Node-ID": "test-node",
                        Authorization: "Invalid-Token",
                    },
                });
            } catch (error) {
                // Expected to fail
            }
        }

        expect(logSpy.calledWithMatch("Multiple failed connection attempts detected for node: test-node")).to.be.true;
    });
});
