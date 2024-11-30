"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// ------------------------------------------------------------------------------
//
// Module: Training Data Generator
//
// Description:
// Script to generate training data for the Advanced Task Scheduler Model.
// Simulates realistic input features (`cpuUsage`, `memoryUsage`, `gpuUsage`,
// `taskPriority`, `latency`) and assigns tasks to optimal nodes.
//
// Dependencies:
// - fs-extra: For file operations to save the JSON file.
//
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// **Output Configuration**
const OUTPUT_FILE = path.join(__dirname, "./Training/taskTrainingData.json");

// **Number of Training Records**
const RECORD_COUNT = 1000;

// **Nodes in the system**
const NODES = ["node1", "node2", "node3", "node4", "node5"];

/**
 * Generate a random float between min and max.
 * @param {number} min - Minimum value (inclusive).
 * @param {number} max - Maximum value (inclusive).
 * @returns {number} - Random float.
 */
function getRandomFloat(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

/**
 * Assign an optimal node based on input features.
 * This is a mock function simulating a basic heuristic.
 * @param {number} cpuUsage - CPU usage percentage.
 * @param {number} memoryUsage - Memory usage percentage.
 * @param {number} gpuUsage - GPU usage percentage.
 * @param {number} taskPriority - Task priority (1-10).
 * @param {number} latency - Network latency in ms.
 * @returns {string} - Optimal node.
 */
function assignOptimalNode(cpuUsage, memoryUsage, gpuUsage, taskPriority, latency) {
    if (cpuUsage < 30 && memoryUsage < 30) return "node1";
    if (gpuUsage > 80 && latency < 50) return "node2";
    if (taskPriority > 8) return "node5";
    if (latency > 100) return "node4";
    return "node3";
}

/**
 * Generate a single training record.
 * @returns {Object} - A simulated training data record.
 */
function generateRecord() {
    const cpuUsage = getRandomFloat(5, 100); // CPU usage percentage
    const memoryUsage = getRandomFloat(5, 100); // Memory usage percentage
    const gpuUsage = getRandomFloat(5, 100); // GPU usage percentage
    const taskPriority = Math.floor(getRandomFloat(1, 10)); // Task priority (1-10)
    const latency = Math.floor(getRandomFloat(10, 200)); // Latency in milliseconds

    const optimalNode = assignOptimalNode(cpuUsage, memoryUsage, gpuUsage, taskPriority, latency);

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
 * Generate training data and save it as a JSON file.
 */
async function generateTrainingData() {
    console.log("Generating training data...");
    const records = [];

    for (let i = 0; i < RECORD_COUNT; i++) {
        records.push(generateRecord());
    }

    console.log(`Saving ${RECORD_COUNT} training records to: ${OUTPUT_FILE}`);
    await fs.ensureDir(path.dirname(OUTPUT_FILE));
    await fs.writeJson(OUTPUT_FILE, records, { spaces: 2 });
    console.log("Training data saved successfully.");
}

// Execute the script
(async () => {
    try {
        await generateTrainingData();
    } catch (error) {
        console.error("Error generating training data:", error.message);
    }
})();
