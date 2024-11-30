"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Integration Test: Orchestration and Monitoring
//
// Description:
// This test validates the interaction between the orchestration module
// and the monitoring module in the National Defense HQ Node. It ensures
// that tasks are correctly assigned, monitored, and logged.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - chai: For assertions.
// - sinon: For mocks and spies.
// - orchestration: The orchestration module to test.
// - monitoring: The monitoring module to test.
//
// Usage:
// Run this test using the test runner or directly with Node.js.
// ------------------------------------------------------------------------------

const chai = require("chai");
const sinon = require("sinon");
const { expect } = chai;

// Modules under test
const loadBalancer = require("../../Orchestration/loadBalancer");
const systemMonitor = require("../../Monitoring/systemMonitor");
const activityAuditLogger = require("../../Monitoring/activityAuditLogger");

// Test Suite: Integration of Orchestration and Monitoring
describe("Integration Test: Orchestration and Monitoring", () => {
    let logSpy;

    beforeEach(() => {
        // Setup spy for activityAuditLogger
        logSpy = sinon.spy(activityAuditLogger, "logInfo");
    });

    afterEach(() => {
        // Restore spies and mocks
        sinon.restore();
    });

    it("should log task assignments from orchestration to monitoring", async () => {
        const task = { id: "task-123", type: "shardDistribution", priority: "high" };

        // Simulate task assignment in loadBalancer
        const assignTaskStub = sinon.stub(loadBalancer, "assignTask").returns(Promise.resolve(task));

        // Simulate monitoring of task in systemMonitor
        const monitorTaskStub = sinon.stub(systemMonitor, "monitorTask").returns(Promise.resolve("Monitoring started"));

        const result = await loadBalancer.assignTask(task);
        await systemMonitor.monitorTask(result);

        // Assertions
        expect(assignTaskStub.calledOnce).to.be.true;
        expect(monitorTaskStub.calledOnce).to.be.true;
        expect(logSpy.calledWithMatch("Task assignment logged")).to.be.true;
    });

    it("should handle task failure and log the issue", async () => {
        const task = { id: "task-456", type: "validation", priority: "medium" };

        // Simulate failure in loadBalancer
        const assignTaskStub = sinon.stub(loadBalancer, "assignTask").throws(new Error("Task assignment failed"));

        try {
            await loadBalancer.assignTask(task);
        } catch (error) {
            // Assertions
            expect(assignTaskStub.calledOnce).to.be.true;
            expect(logSpy.calledWithMatch("Task assignment failed")).to.be.true;
        }
    });

    it("should monitor node health during task execution", async () => {
        const nodeHealthStub = sinon.stub(systemMonitor, "getNodeHealth").returns(Promise.resolve("Healthy"));

        const healthStatus = await systemMonitor.getNodeHealth("node-789");

        // Assertions
        expect(nodeHealthStub.calledOnce).to.be.true;
        expect(healthStatus).to.equal("Healthy");
        expect(logSpy.calledWithMatch("Node health check performed")).to.be.true;
    });
});
