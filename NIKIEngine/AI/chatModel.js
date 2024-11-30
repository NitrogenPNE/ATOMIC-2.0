"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Chat Model
//
// Description:
// Implements the logic for conversational interactions in the NIKIEngine. 
// Processes user queries, connects with NIKI's AI models, and generates 
// contextual responses. Integrates with ATOMIC's HQ Node ecosystem for real-time 
// system insights and reporting.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - TensorFlow.js: For intent recognition and response generation.
// - lodash: For processing and transforming conversational data.
// - systemAnalyzer: Provides real-time data and system metrics.
//
// Usage:
// const { handleUserQuery } = require('./chatModel');
// const response = await handleUserQuery("What is my subscription limit?");
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const _ = require("lodash");
const systemAnalyzer = require("../Monitoring/systemActivityLogger");
const subscriptionManager = require("../NodeManagement/manageSubscriptions");

// **Constants**
const MODEL_PATH = "./models/chatModel"; // Path to the conversational AI model

// **Load AI Model**
let chatModel;

/**
 * Initializes the chat model.
 */
async function initializeChatModel() {
    if (!chatModel) {
        console.log("[NIKI] Loading chat model...");
        chatModel = await tf.loadLayersModel(`file://${MODEL_PATH}/model.json`);
        console.log("[NIKI] Chat model loaded successfully.");
    }
}

/**
 * Handles user queries by generating responses.
 * @param {string} userQuery - The query provided by the user.
 * @returns {Promise<string>} - The generated response.
 */
async function handleUserQuery(userQuery) {
    console.log(`[NIKI] Received user query: ${userQuery}`);

    // Ensure model is loaded
    await initializeChatModel();

    // Step 1: Preprocess user input
    const preprocessedInput = preprocessInput(userQuery);

    // Step 2: Generate AI response
    const aiResponse = await generateAIResponse(preprocessedInput);

    // Step 3: Contextual processing and system insights
    const contextualResponse = await generateContextualResponse(userQuery, aiResponse);

    console.log(`[NIKI] Generated response: ${contextualResponse}`);
    return contextualResponse;
}

/**
 * Preprocesses user input for model inference.
 * @param {string} userQuery - The user query.
 * @returns {Array<number>} - Processed input data.
 */
function preprocessInput(userQuery) {
    // Example: Tokenization or embedding preparation
    const tokens = _.words(userQuery.toLowerCase());
    return tokens.map((word) => word.length); // Placeholder preprocessing logic
}

/**
 * Generates AI response using the model.
 * @param {Array<number>} preprocessedInput - Preprocessed input for the model.
 * @returns {Promise<string>} - Raw AI-generated response.
 */
async function generateAIResponse(preprocessedInput) {
    const inputTensor = tf.tensor2d([preprocessedInput]);
    const outputTensor = chatModel.predict(inputTensor);
    const outputData = outputTensor.dataSync();

    // Convert model output to text (placeholder logic)
    const response = `AI Response Score: ${_.round(outputData[0], 2)}`;
    return response;
}

/**
 * Processes AI response with real-time system context.
 * @param {string} userQuery - The user query.
 * @param {string} aiResponse - The AI-generated response.
 * @returns {Promise<string>} - The contextual response.
 */
async function generateContextualResponse(userQuery, aiResponse) {
    if (userQuery.toLowerCase().includes("subscription limit")) {
        const subscriptionDetails = await subscriptionManager.getSubscriptionDetails();
        return `Your subscription allows ${subscriptionDetails.maxNodes} nodes. ${aiResponse}`;
    }

    if (userQuery.toLowerCase().includes("system health")) {
        const healthMetrics = await systemAnalyzer.getSystemMetrics();
        return `Current system health: CPU Load - ${healthMetrics.cpuLoad}%, Memory Usage - ${healthMetrics.memoryUsage}%. ${aiResponse}`;
    }

    // Default fallback
    return `I'm here to assist! ${aiResponse}`;
}

module.exports = {
    handleUserQuery,
    initializeChatModel,
};
