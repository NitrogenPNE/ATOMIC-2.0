"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Integration Test: Smart Contract and Validation
//
// Description:
// Validates the integration between the smart contract management system and 
// the validation framework. Ensures that contracts meet compliance and security 
// standards before deployment.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - chai: For assertions.
// - sinon: For mocks and spies.
// - smartContractValidator: Module under test for contract validation.
// - contractTemplates: Provides templates for testing contracts.
//
// Usage:
// Execute this script using a test runner or directly with Node.js.
// ------------------------------------------------------------------------------

const chai = require("chai");
const sinon = require("sinon");
const { expect } = chai;

// Modules under test
const smartContractValidator = require("../../Validation/smartContractValidator");
const contractTemplates = require("../../Validation/contractTemplates");
const validationUtils = require("../../Validation/validationUtils");

// Test Suite: Smart Contract and Validation Integration
describe("Integration Test: Smart Contract and Validation", () => {
    let logSpy;

    beforeEach(() => {
        // Setup spies for logging
        logSpy = sinon.spy(console, "log");
    });

    afterEach(() => {
        // Restore spies and mocks
        sinon.restore();
    });

    it("should validate a default smart contract template successfully", async () => {
        const defaultTemplate = contractTemplates.defaultTemplate;

        // Mock schema validation
        const schemaValidationStub = sinon
            .stub(validationUtils, "validateSchema")
            .returns(true);

        // Mock logic validation
        const logicValidationStub = sinon
            .stub(validationUtils, "validateLogic")
            .returns(true);

        const isValid = await smartContractValidator.validateSmartContract(defaultTemplate);

        // Assertions
        expect(isValid).to.be.true;
        expect(schemaValidationStub.calledOnce).to.be.true;
        expect(logicValidationStub.calledOnce).to.be.true;
        expect(logSpy.calledWithMatch("Smart contract validation succeeded")).to.be.true;
    });

    it("should reject a malformed smart contract", async () => {
        const malformedContract = { name: "InvalidContract", invalidField: true };

        // Mock schema validation failure
        const schemaValidationStub = sinon
            .stub(validationUtils, "validateSchema")
            .returns(false);

        try {
            await smartContractValidator.validateSmartContract(malformedContract);
        } catch (error) {
            // Assertions
            expect(schemaValidationStub.calledOnce).to.be.true;
            expect(logSpy.calledWithMatch("Smart contract validation failed")).to.be.true;
            expect(error.message).to.equal("Smart contract schema validation failed.");
        }
    });

    it("should detect logic issues in a contract", async () => {
        const faultyContract = {
            name: "FaultyContract",
            logic: "while(true) { consumeAllResources(); }",
        };

        // Mock schema validation pass
        const schemaValidationStub = sinon
            .stub(validationUtils, "validateSchema")
            .returns(true);

        // Mock logic validation failure
        const logicValidationStub = sinon
            .stub(validationUtils, "validateLogic")
            .returns(false);

        try {
            await smartContractValidator.validateSmartContract(faultyContract);
        } catch (error) {
            // Assertions
            expect(schemaValidationStub.calledOnce).to.be.true;
            expect(logicValidationStub.calledOnce).to.be.true;
            expect(logSpy.calledWithMatch("Smart contract logic validation failed")).to.be.true;
            expect(error.message).to.equal("Smart contract logic validation failed.");
        }
    });

    it("should log hash of the validated smart contract", async () => {
        const validContract = contractTemplates.defaultTemplate;

        // Mock schema and logic validation
        sinon.stub(validationUtils, "validateSchema").returns(true);
        sinon.stub(validationUtils, "validateLogic").returns(true);

        // Mock hash calculation
        const hashStub = sinon
            .stub(smartContractValidator, "calculateContractHash")
            .returns("abc123hash");

        await smartContractValidator.validateSmartContract(validContract);

        // Assertions
        expect(hashStub.calledOnce).to.be.true;
        expect(logSpy.calledWithMatch("Contract hash: abc123hash")).to.be.true;
    });
});
