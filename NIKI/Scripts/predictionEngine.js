"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: NIKI Prediction Engine
//
// Description:
// Implements AI-powered prediction and optimization for task distribution, 
// shard placement, and load balancing across the ATOMIC network. Enhanced with:
// - Particle-specific optimization for protons, neutrons, and electrons.
// - Multi-dimensional scoring for redundancy, reliability, and shard dependencies.
// - Real-time feedback and adaptive redundancy management.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - TensorFlow.js: For AI model inference.
// - lodash: For data transformation and statistical analysis.
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const _ = require("lodash");

// **Global Constants**
const MODEL_PATH = "./models/predictionModel"; // Path to the AI model
const THRESHOLD_CAPACITY = 75; // Threshold percentage for node overload
const REBALANCE_FACTOR = 1.5; // Weight for prioritizing underutilized nodes

// Particle-specific constants
const PARTICLE_PRIORITIES = {
    proton: 3,  // High-priority
    neutron: 2, // Medium-priority
    electron: 1 // Low-priority
};

/**
 * Predict optimal task or shard distribution.
 * @param {Array<Object>} tasks - List of tasks or shards.
 * @param {Array<Object>} nodes - List of available nodes with metrics.
 * @param {Object} systemMetrics - Current system metrics.
 * @returns {Promise<Array<Object>>} - Distribution plan.
 */
async function predictOptimalDistribution(tasks, nodes, systemMetrics) {
    console.log("[NIKI] Starting prediction for optimal distribution...");

    // Load AI model
    const model = await loadPredictionModel();

    // Prepare input data
    const inputData = prepareInputData(tasks, nodes, systemMetrics);

    // Run predictions
    const predictions = model.predict(tf.tensor2d(inputData));
    const scores = predictions.dataSync();

    // Construct distribution plan
    const distributionPlan = constructDistributionPlan(tasks, nodes, scores);

    console.log("[NIKI] Prediction complete. Distribution plan generated.");
    return distributionPlan;
}

/**
 * Load the AI prediction model.
 * @returns {Promise<Object>} - TensorFlow.js model instance.
 */
async function loadPredictionModel() {
    console.log("[NIKI] Loading prediction model...");
    return await tf.loadLayersModel(`file://${MODEL_PATH}/model.json`);
}

/**
 * Prepare input data for the AI model.
 * @param {Array<Object>} tasks - List of tasks or shards.
 * @param {Array<Object>} nodes - List of available nodes.
 * @param {Object} systemMetrics - Current system metrics.
 * @returns {Array<Array<number>>} - Flattened input data for model inference.
 */
function prepareInputData(tasks, nodes, systemMetrics) {
    const nodeMetrics = nodes.map((node) => [
        node.cpuLoad || 0,
        node.memoryUsage || 0,
        node.capacity || 1,
        node.uptime || 0, // Uptime for reliability
        node.energyEfficiency || 1 // Energy metric
    ]);

    const taskMetrics = tasks.map((task) => [
        task.priority || 1,
        task.size || 1,
        PARTICLE_PRIORITIES[task.particle] || 1 // Particle priority
    ]);

    const systemData = [
        systemMetrics.cpuLoad || 0,
        systemMetrics.memoryUsage || 0,
        systemMetrics.networkLatency || 0 // Add system-level latency
    ];

    // Combine task, node, and system metrics
    return _.flatMap(taskMetrics, (task) =>
        nodeMetrics.map((node) => [...task, ...node, ...systemData])
    );
}

/**
 * Construct a distribution plan based on AI scores.
 * @param {Array<Object>} tasks - List of tasks or shards.
 * @param {Array<Object>} nodes - List of available nodes.
 * @param {Float32Array} scores - Prediction scores from the AI model.
 * @returns {Array<Object>} - Distribution plan.
 */
function constructDistributionPlan(tasks, nodes, scores) {
    const plan = [];

    for (let i = 0; i < tasks.length; i++) {
        let maxScore = -Infinity;
        let selectedNode = null;

        for (let j = 0; j < nodes.length; j++) {
            const scoreIndex = i * nodes.length + j;
            if (scores[scoreIndex] > maxScore) {
                maxScore = scores[scoreIndex];
                selectedNode = nodes[j];
            }
        }

        if (selectedNode) {
            plan.push({
                taskId: tasks[i].id,
                node: selectedNode,
                score: maxScore,
                particle: tasks[i].particle // Include particle type in plan
            });
        }
    }

    return plan;
}

/**
 * Rebalance nodes if some are overloaded or underutilized.
 * @param {Array<Object>} nodes - List of available nodes.
 * @param {Object} systemMetrics - Current system metrics.
 * @returns {Array<Object>} - Adjusted node metrics.
 */
function rebalanceNodes(nodes, systemMetrics) {
    return nodes.map((node) => {
        if (node.cpuLoad > THRESHOLD_CAPACITY || node.memoryUsage > THRESHOLD_CAPACITY) {
            node.adjustedCapacity = node.capacity / REBALANCE_FACTOR;
        } else {
            node.adjustedCapacity = node.capacity * REBALANCE_FACTOR;
        }
        return node;
    });
}

/**
 * Real-time feedback loop for optimizing shard placement.
 * @param {Array<Object>} tasks - Tasks or shards to redistribute.
 * @param {Array<Object>} nodes - List of nodes.
 * @param {Object} systemMetrics - Current system metrics.
 * @returns {Array<Object>} - Updated distribution plan.
 */
async function realTimeFeedbackLoop(tasks, nodes, systemMetrics) {
    console.log("[NIKI] Initiating real-time feedback loop...");

    // Simulate metrics update
    const updatedNodes = rebalanceNodes(nodes, systemMetrics);

    // Generate updated predictions
    const updatedPlan = await predictOptimalDistribution(tasks, updatedNodes, systemMetrics);

    console.log("[NIKI] Real-time optimization complete.");
    return updatedPlan;
}

module.exports = {
    predictOptimalDistribution,
    rebalanceNodes,
    realTimeFeedbackLoop,
};