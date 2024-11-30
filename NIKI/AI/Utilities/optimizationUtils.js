"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Optimization Utilities (Enhanced)
//
// Description:
// This module contains functions to optimize AI operations in NIKI, including
// hyperparameter tuning, resource allocation, and task prioritization. It
// supports shard prediction, tamper detection, and task scheduling models.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - TensorFlow.js: For model optimization.
// - os: For system resource monitoring.
// - lodash: For advanced data manipulation.
//
// Features:
// - Dynamic hyperparameter tuning using grid search or random search.
// - Resource optimization to ensure efficient use of compute power.
// - Task scheduling algorithms to prioritize critical AI tasks.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node"); // TensorFlow.js for AI operations
const os = require("os"); // System resource monitoring
const _ = require("lodash"); // Utility library for data operations

/**
 * Perform hyperparameter tuning using grid search.
 * @param {Object} model - TensorFlow.js model to optimize.
 * @param {Array<Object>} paramGrid - Array of hyperparameter combinations.
 * @param {Object} trainData - Training data (features and labels).
 * @param {Object} valData - Validation data (features and labels).
 * @returns {Object} - Best hyperparameters and corresponding validation score.
 */
async function gridSearch(model, paramGrid, trainData, valData) {
    console.log("Starting grid search for hyperparameter tuning...");
    let bestParams = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const params of paramGrid) {
        console.log(`Testing hyperparameters: ${JSON.stringify(params)}`);
        model.compile({
            optimizer: tf.train.adam(params.learningRate),
            loss: params.loss,
            metrics: ["accuracy"],
        });

        await model.fit(trainData.features, trainData.labels, {
            epochs: params.epochs,
            batchSize: params.batchSize,
            validationData: [valData.features, valData.labels],
        });

        const [loss, accuracy] = model
            .evaluate(valData.features, valData.labels)
            .map((res) => res.dataSync());
        console.log(`Validation Accuracy: ${accuracy}, Loss: ${loss}`);

        if (accuracy > bestScore) {
            bestScore = accuracy;
            bestParams = params;
        }
    }

    console.log("Best Hyperparameters:", bestParams);
    return { bestParams, bestScore };
}

/**
 * Perform resource-aware optimization for task execution.
 * @param {Array<Object>} tasks - List of tasks to execute.
 * @param {Object} resourceLimits - Available system resources (CPU, memory).
 * @returns {Array<Object>} - Optimized task execution order.
 */
function optimizeTaskScheduling(tasks, resourceLimits) {
    console.log("Optimizing task scheduling...");
    const prioritizedTasks = _.orderBy(
        tasks,
        ["priority", "estimatedTime"],
        ["desc", "asc"]
    );

    const availableResources = {
        cpu: os.cpus().length,
        memory: os.freemem() / 1024 / 1024, // Convert to MB
    };

    const scheduledTasks = [];
    let currentResources = { ...availableResources };

    for (const task of prioritizedTasks) {
        if (
            task.requiredCPU <= currentResources.cpu &&
            task.requiredMemory <= currentResources.memory &&
            task.estimatedTime <= resourceLimits.maxExecutionTime
        ) {
            scheduledTasks.push(task);
            currentResources.cpu -= task.requiredCPU;
            currentResources.memory -= task.requiredMemory;
        } else {
            console.warn(`Task "${task.name}" skipped due to resource constraints.`);
        }
    }

    console.log("Optimized Task Schedule:", scheduledTasks.map((task) => task.name));
    return scheduledTasks;
}

/**
 * Perform random search for hyperparameter tuning.
 * @param {Object} model - TensorFlow.js model to optimize.
 * @param {Array<Object>} paramSpace - Search space for hyperparameters.
 * @param {Object} trainData - Training data (features and labels).
 * @param {Object} valData - Validation data (features and labels).
 * @param {number} iterations - Number of random samples to evaluate.
 * @returns {Object} - Best hyperparameters and corresponding validation score.
 */
async function randomSearch(model, paramSpace, trainData, valData, iterations) {
    console.log("Starting random search for hyperparameter tuning...");
    let bestParams = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < iterations; i++) {
        const params = _.mapValues(paramSpace, (values) => _.sample(values));
        console.log(`Testing random hyperparameters: ${JSON.stringify(params)}`);

        model.compile({
            optimizer: tf.train.adam(params.learningRate),
            loss: params.loss,
            metrics: ["accuracy"],
        });

        await model.fit(trainData.features, trainData.labels, {
            epochs: params.epochs,
            batchSize: params.batchSize,
            validationData: [valData.features, valData.labels],
        });

        const [loss, accuracy] = model
            .evaluate(valData.features, valData.labels)
            .map((res) => res.dataSync());
        console.log(`Validation Accuracy: ${accuracy}, Loss: ${loss}`);

        if (accuracy > bestScore) {
            bestScore = accuracy;
            bestParams = params;
        }
    }

    console.log("Best Hyperparameters:", bestParams);
    return { bestParams, bestScore };
}

/**
 * Optimize resource allocation for NIKI’s shard operations.
 * @param {Array<Object>} nodes - List of nodes and their available resources.
 * @param {Object} taskRequirements - Required resources for a task.
 * @returns {Object|null} - Selected node for the task, or null if no suitable node is found.
 */
function allocateResources(nodes, taskRequirements) {
    console.log("Allocating resources for task execution...");
    const suitableNodes = nodes.filter(
        (node) =>
            node.cpu >= taskRequirements.cpu &&
            node.memory >= taskRequirements.memory &&
            node.latency <= taskRequirements.maxLatency
    );

    if (suitableNodes.length === 0) {
        console.warn("No suitable nodes found for task execution.");
        return null;
    }

    const selectedNode = _.minBy(suitableNodes, "latency");
    console.log("Selected Node for Task:", selectedNode);
    return selectedNode;
}

module.exports = {
    gridSearch,
    optimizeTaskScheduling,
    randomSearch,
    allocateResources,
};