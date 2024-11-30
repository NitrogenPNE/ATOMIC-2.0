// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Author: Shawn Blackmore
// Module: Enhanced Training Script for Intrusion Detection
// Description: Collects training data and trains the AI model for intrusion detection.
// ------------------------------------------------------------------------------

const fs = require('fs-extra'); // Use fs-extra for better file handling
const path = require('path');
const tf = require('@tensorflow/tfjs-node'); // Load TensorFlow.js for Node.js
const winston = require('winston');
const IntrusionDetection = require('../Models/IntrusionDetection');

// Update the MODEL_PATH to save in the specified directory
const MODEL_PATH = path.join(__dirname, '../Models/intrusionDetectionModel.tfmodel');
const LABEL = "isAnomalous";

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '../Models/error.log'), level: "error" }),
        new winston.transports.File({ filename: path.join(__dirname, '../Models/combined.log') }),
    ],
});

async function main() {
    const intrusionDetector = new IntrusionDetection();

    // Initialize the model
    await intrusionDetector.initModel();

    // Load existing training data
    const existingTrainingData = await loadTrainingData();
    if (existingTrainingData.length > 0) {
        for (const data of existingTrainingData) {
            intrusionDetector.addNetworkData(data);
        }
    }

    // Generate more simulated network data
    console.log("Generating additional simulated network data for training...");
    const simulatedData = generateSimulatedNetworkData();
    for (const data of simulatedData) {
        intrusionDetector.addNetworkData(data);
    }

    // Save the combined training data to a JSON file
    await saveTrainingData(intrusionDetector.trainingData);

    // Train the model, if enough data is available
    if (intrusionDetector.isTrained) {
        await trainModelAndLogPerformance(intrusionDetector);
    } else {
        console.log("Not enough data to train the model.");
    }
}

function generateSimulatedNetworkData() {
    const data = [];
    for (let i = 0; i < 200; i++) {
        const isAnomalous = Math.random() < 0.3; // 30% chance of being anomalous
        const requestRate = isAnomalous ? Math.floor(Math.random() * 200 + 50) : Math.floor(Math.random() * 50);
        const uniqueIPs = isAnomalous ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 10);

        data.push({
            timestamp: Date.now(),
            sourceIP: `192.168.1.${Math.floor(Math.random() * 100)}`,
            requestRate: requestRate,
            uniqueIPs: uniqueIPs,
            [LABEL]: isAnomalous // Add a label for supervised learning
        });
    }
    return data;
}

async function loadTrainingData() {
    const filePath = path.join(__dirname, './Training/intrusiveDetectiontraining.json');
    if (await fs.pathExists(filePath)) {
        return await fs.readJson(filePath);
    }
    return [];
}

async function saveTrainingData(trainingData) {
    const directoryPath = path.join(__dirname, './Training');
    await fs.ensureDir(directoryPath);
    const filePath = path.join(directoryPath, 'intrusiveDetectiontraining.json');
    await fs.writeJson(filePath, trainingData, { spaces: 4 });
    console.log("Training data saved to intrusiveDetectiontraining.json.");
}

async function trainModelAndLogPerformance(intrusionDetector) {
    const trainingStats = [];
    const epochs = 50;  // Increase epochs for better fitting
    const batchSize = 32;

    const { inputs, labels } = preprocessData(intrusionDetector.trainingData); // Preprocess the data

    const model = await loadOrBuildModel();

    const trainingOptions = {
        epochs: epochs,
        batchSize: batchSize,
        validationSplit: 0.2,
        callbacks: {
            onEpochEnd: async (epoch, logs) => {
                logger.info(`Epoch ${epoch + 1}: Loss - ${logs.loss}, Validation Loss - ${logs.val_loss}`);
                // Only save model if loss is valid
                if (!isNaN(logs.loss) && logs.val_loss < Infinity) {
                    try {
                        await model.save(`file://${MODEL_PATH}`);
                        logger.info("Model saved successfully.");
                    } catch (saveError) {
                        logger.error("Failed to save model:", saveError);
                    }
                }
            }
        }
    };

    await model.fit(inputs, labels, trainingOptions);
    logger.info("Training complete.");
}

function preprocessData(data) {
    const inputs = data.map(item => [
        (item.requestRate || 0) / 200, // Normalizing requestRate
        (item.uniqueIPs || 0) / 50, // Normalizing uniqueIPs
        (item.timestamp ? (Date.now() - item.timestamp) / 1000 : 0) // Normalizing timestamp as recent activity
    ]);

    const labels = data.map(item => item[LABEL]);
    const uniqueLabels = Array.from(new Set(labels));
    const labelTensor = tf.tensor2d(labels.map(label => {
        const oneHot = Array(uniqueLabels.length).fill(0);
        oneHot[uniqueLabels.indexOf(label)] = 1; // One-hot encoding
        return oneHot;
    }));

    return { inputs: tf.tensor2d(inputs), labels: labelTensor };
}

async function loadOrBuildModel() {
    if (await fs.pathExists(MODEL_PATH)) {
        logger.info("Loading existing model...");
        return await tf.loadLayersModel(`file://${MODEL_PATH}`);
    }

    logger.info("Building a new model...");
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: "relu", inputShape: [3] })); // Assuming 3 normalized features
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 2, activation: "softmax" })); // Change if your output has a different size

    model.compile({
        optimizer: tf.train.adam(0.001), // Learning rate adjustment for stability
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
    });

    logger.info("Model built and compiled.");
    return model;
}

// Execute the main function
main().catch(err => {
    console.error("Error occurred during training:", err);
});