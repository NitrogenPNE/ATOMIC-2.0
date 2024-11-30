"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Task Scheduler Training Data Generator
//
// Description:
// Generates training data for the Task Scheduler Model.
// Data includes node metrics, task priorities, and node-specific attributes.
//
// Dependencies:
// - fs-extra: For creating and managing training data files.
// - crypto: For generating randomness in training data.
// - path: For file path management.
//
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

// **Configuration**
const OUTPUT_DIR = path.join(__dirname, "../Training");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "taskTrainingData.json");

// Simulation Parameters
const NUM_ENTRIES = 1000; // Number of training data entries
const NODES = ["node1", "node2", "node3", "node4", "node5"]; // Available nodes

/**
 * Generate random task metadata for training.
 * @returns {Object} - Simulated task metadata.
 */
function generateTaskMetadata() {
    const cpuUsage = parseFloat((Math.random() * 100).toFixed(2)); // 0% to 100%
    const memoryUsage = parseFloat((Math.random() * 100).toFixed(2)); // 0% to 100%
    const gpuUsage = parseFloat((Math.random() * 100).toFixed(2)); // 0% to 100%
    const taskPriority = Math.floor(Math.random() * 10) + 1; // Priority 1-10
    const latency = Math.floor(Math.random() * 100) + 10; // Latency 10-100 ms
    const optimalNode = NODES[Math.floor(Math.random() * NODES.length)]; // Random node

    return {
        cpuUsage,
        memoryUsage,
        gpuUsage,
        taskPriority,
        latency,
        optimalNode,
    };
}

/**
 * Generate the training data set.
 * @param {number} count - Number of entries to generate.
 * @returns {Array<Object>} - Array of training data entries.
 */
function generateTrainingData(count) {
    console.log(`Generating ${count} training data entries...`);
    const trainingData = [];
    for (let i = 0; i < count; i++) {
        trainingData.push(generateTaskMetadata());
    }
    return trainingData;
}

/**
 * Save training data to a JSON file.
 * @param {Array<Object>} data - Training data to save.
 */
async function saveTrainingData(data) {
    try {
        console.log("Saving training data...");
        await fs.ensureDir(OUTPUT_DIR);
        await fs.writeJson(OUTPUT_FILE, data, { spaces: 2 });
        console.log(`Training data saved successfully at: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error("Error saving training data:", error.message);
    }
}

/**
 * Main function to generate and save training data.
 */
async function main() {
    try {
        const trainingData = generateTrainingData(NUM_ENTRIES);
        await saveTrainingData(trainingData);
        console.log("Task Scheduler Training Data Generation Completed.");
    } catch (error) {
        console.error("Error generating training data:", error.message);
    }
}

// Run the script
main();
