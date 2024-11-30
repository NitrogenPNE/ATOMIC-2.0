// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Author: Shawn Blackmore
// Module: Intrusion Detection
// Description: Monitors network traffic and detects anomalies using an AI model.
// ------------------------------------------------------------------------------

"use strict";

const { EventEmitter } = require('events');
const tf = require('@tensorflow/tfjs'); // TensorFlow.js for ML
const { performance } = require('perf_hooks');

class IntrusionDetection extends EventEmitter {
    constructor() {
        super();
        this.model = null; // Initialize the machine learning model
        this.networkData = [];
        this.trainingData = []; // Placeholder for training data
        this.isTrained = false; // Flag to check if the model is trained
        this.isTraining = false; // Flag to check if the model is currently training
    }

    /**
     * Initializes the machine learning model.
     */
    async initModel() {
        this.model = tf.sequential();

        // Adding layers to the model
        this.model.add(tf.layers.dense({ units: 5, activation: 'relu', inputShape: [2] })); // Assuming 2 features
        this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Binary classification for anomaly detection

        this.model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy',
            metrics: ['accuracy'],
        });

        console.log("Machine learning model initialized.");
    }

    /**
     * Adds network data (e.g., packet information) for analysis.
     * @param {Object} data - The network packet data.
     */
    addNetworkData(data) {
        this.networkData.push(data);
        this.collectTrainingData(data); // Collect training data over time

        // Keep only the last 1000 entries
        if (this.networkData.length > 1000) {
            this.networkData.shift();
        }

        if (this.isTrained) {
            this.detectAnomalies();
        }
    }

    /**
     * Collects training data from recent network traffic.
     * This method should label data as 0 (normal) or 1 (anomalous) based on predefined criteria or heuristics.
     * @param {Object} data - The incoming network data.
     */
    collectTrainingData(data) {
        // Example features for training: request rate, unique IPs (You should prepare normalized features)
        const features = [
            data.requestRate, // Placeholder for request rate
            data.uniqueIPs // Placeholder for unique IP addresses
        ];

        const label = this.isAnomalous(data) ? 1 : 0; // Label data as anomalous or normal
        this.trainingData.push({ features, label });

        // Trigger training if enough data is collected
        if (this.trainingData.length >= 100 && !this.isTraining) {
            this.trainModel();
        }
    }

    /**
     * Trains the ML model on the collected training data.
     */
    async trainModel() {
        this.isTraining = true; // Mark the model as currently training
        const { features, labels } = this.prepareTrainingData();

        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(labels, [labels.length, 1]);

        try {
            await this.model.fit(xs, ys, {
                epochs: 50, // Adjust epochs based on performance
                batchSize: 10,
                shuffle: true,
            });
            this.isTrained = true; // Set trained flag only after successful training
            console.log("Model trained with recent training data.");
        } catch (error) {
            console.error("Error during model training:", error);
        } finally {
            this.isTraining = false; // Reset training status
        }
    }

    /**
     * Prepares training data for the model.
     */
    prepareTrainingData() {
        const features = this.trainingData.map(d => d.features);
        const labels = this.trainingData.map(d => d.label);
        return { features, labels };
    }

    /**
     * Detects anomalies based on input data using the trained ML model.
     */
    async detectAnomalies() {
        const stats = this.calculateStatistics();
        const inputData = tf.tensor2d([[stats.requestRate, stats.uniqueIPs]]);

        const prediction = await this.model.predict(inputData).array(); // Get prediction

        if (prediction[0][0] > 0.5) { // Assuming a threshold for classification
            console.warn(`Anomaly detected: High request rate of ${stats.requestRate} requests/s.`);
            this.emit('anomalyDetected', {
                type: 'highRequestRate',
                details: stats
            });
            this.respondToAnomaly({ type: 'highRequestRate', details: stats });
        }
    }

    /**
     * Determines whether the incoming data qualifies as anomalous.
     * This is a placeholder function and can contain heuristic rules.
     * @param {Object} data - Incoming data packet.
     * @returns {boolean} - True if anomalous, false otherwise.
     */
    isAnomalous(data) {
        // Simple rules to determine if the incoming data is anomalous
        return data.requestRate > 50; // Placeholder for anomaly detection logic
    }

    /**
     * Calculates statistics from the network data.
     * @returns {Object} - Calculated statistics.
     */
    calculateStatistics() {
        const currentTime = performance.now();
        let requestCount = 0;

        for (const data of this.networkData) {
            if (currentTime - data.timestamp < 1000) { // Last second
                requestCount++;
            }
        }

        return {
            requestRate: requestCount,
            uniqueIPs: [...new Set(this.networkData.map(data => data.sourceIP))].length, // Count unique IPs
        };
    }

    /**
     * Responds to detected anomalies.
     * @param {Object} anomaly - The detected anomaly details.
     */
    respondToAnomaly(anomaly) {
        console.log(`Response to ${anomaly.type}: Requires further investigation.`);
        // Implement specific responses based on anomaly type
    }
}

module.exports = IntrusionDetection;