"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Unit Test for Subscription Manager
//
// Description:
// Tests the `subscriptionManager.js` module to ensure subscription-based
// functionality, such as node registration, pricing calculations, and subscription
// validation, operates correctly.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - Jest: Testing framework for executing unit tests.
// - Mock Data: Predefined subscriptions and node configurations.
// - subscriptionManager: The module under test.
//
// Usage:
// Run the tests using the Jest framework: `npm test testSubscriptionManager.js`
// ------------------------------------------------------------------------------

const subscriptionManager = require("../../Subscriptions/subscriptionManager");
const mockDataGenerator = require("../TestUtilities/mockDataGenerator");
const { logTestInfo, logTestError, logTestResult } = require("../TestUtilities/testLogger");

describe("Subscription Manager Unit Tests", () => {
    beforeAll(() => {
        logTestInfo("Starting Subscription Manager Unit Tests...");
    });

    afterAll(() => {
        logTestInfo("Completed Subscription Manager Unit Tests.");
    });

    test("Registering a new node subscription", async () => {
        const nodeData = mockDataGenerator.generateNodeRegistrationData();

        try {
            const subscriptionDetails = await subscriptionManager.registerNodeSubscription(nodeData);
            logTestResult("Node Registration Test", subscriptionDetails.nodeId === nodeData.nodeId, {
                subscriptionDetails,
            });

            expect(subscriptionDetails).toHaveProperty("nodeId", nodeData.nodeId);
            expect(subscriptionDetails).toHaveProperty("subscriptionCost");
        } catch (error) {
            logTestError("Node Registration Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Calculating subscription cost for a node", async () => {
        const nodeSize = 50; // Example: Medium-sized node
        const expectedCost = 5000; // Hypothetical cost for 50 nodes

        try {
            const calculatedCost = subscriptionManager.calculateSubscriptionCost(nodeSize);
            logTestResult(
                "Subscription Cost Calculation Test",
                calculatedCost === expectedCost,
                { nodeSize, calculatedCost }
            );

            expect(calculatedCost).toBe(expectedCost);
        } catch (error) {
            logTestError("Subscription Cost Calculation Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Validating a subscription with correct data", async () => {
        const validSubscription = mockDataGenerator.generateValidSubscription();

        try {
            const isValid = subscriptionManager.validateSubscription(validSubscription);
            logTestResult("Valid Subscription Test", isValid === true, { subscription: validSubscription });

            expect(isValid).toBe(true);
        } catch (error) {
            logTestError("Valid Subscription Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Rejecting a subscription with invalid data", async () => {
        const invalidSubscription = mockDataGenerator.generateInvalidSubscription();

        try {
            const isValid = subscriptionManager.validateSubscription(invalidSubscription);
            logTestResult("Invalid Subscription Test", isValid === false, { subscription: invalidSubscription });

            expect(isValid).toBe(false);
        } catch (error) {
            logTestError("Invalid Subscription Test failed.", { error: error.message });
            throw error;
        }
    });

    test("Handling missing subscription data", async () => {
        const incompleteSubscription = mockDataGenerator.generateIncompleteSubscription();

        try {
            await expect(() => subscriptionManager.validateSubscription(incompleteSubscription)).toThrow();
            logTestResult("Missing Subscription Data Test", true);
        } catch (error) {
            logTestError("Missing Subscription Data Test failed.", { error: error.message });
            throw error;
        }
    });
});
