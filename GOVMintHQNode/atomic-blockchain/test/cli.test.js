"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: CLI Tests
//
// Description:
// Validates the functionality of CLI commands for the ATOMIC blockchain,
// including node management, shard auditing, and contract deployment.
//
// Author: Adaptation by [Your Name]
//
// Dependencies:
// - Jest: For testing framework.
// - child_process: To spawn CLI commands and capture output.
// ------------------------------------------------------------------------------

const { exec } = require("child_process");
const path = require("path");

const CLI_PATH = path.join(__dirname, "../scripts");

describe("ATOMIC Blockchain CLI", () => {
    describe("Node Management Commands", () => {
        it("should add a node successfully", (done) => {
            exec(`node ${CLI_PATH}/manageNodes.js addNode ws://localhost:6001`, (error, stdout) => {
                expect(error).toBeNull();
                expect(stdout).toContain("Node added successfully");
                done();
            });
        });

        it("should remove a node successfully", (done) => {
            exec(`node ${CLI_PATH}/manageNodes.js removeNode ws://localhost:6001`, (error, stdout) => {
                expect(error).toBeNull();
                expect(stdout).toContain("Node removed successfully");
                done();
            });
        });
    });

    describe("Shard Audit Commands", () => {
        it("should audit shards successfully", (done) => {
            exec(`node ${CLI_PATH}/auditShards.js`, (error, stdout) => {
                expect(error).toBeNull();
                expect(stdout).toContain("Shard audit completed successfully");
                done();
            });
        });
    });

    describe("Contract Deployment", () => {
        it("should deploy a contract successfully", (done) => {
            exec(
                `node ${CLI_PATH}/deployContract.js ../contracts/sampleContract.sol ../contracts/sampleABI.json '{}'`,
                (error, stdout) => {
                    expect(error).toBeNull();
                    expect(stdout).toContain("Contract deployed successfully");
                    done();
                }
            );
        });

        it("should handle deployment errors gracefully", (done) => {
            exec(
                `node ${CLI_PATH}/deployContract.js invalidFile.sol ../contracts/sampleABI.json '{}'`,
                (error, stdout, stderr) => {
                    expect(error).not.toBeNull();
                    expect(stderr).toContain("Error during contract deployment");
                    done();
                }
            );
        });
    });
});
