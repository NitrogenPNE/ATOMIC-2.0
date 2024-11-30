const fs = require("fs-extra");
const path = require("path");

// Constants for training data generation
const OUTPUT_PATH = path.join(__dirname, "../Training/trainingData.json");
const NUM_SAMPLES = 1000; // Number of training samples to generate
const NODE_COUNT = 10; // Number of available nodes

// Function to generate a random normal distributed number
function randomNormal(mean, stdDev) {
    return Math.max(1, Math.round(mean + stdDev * (Math.random() * 2 - 1))); // Ensure at least 1 byte
}

// Function to calculate bounce rate
function calculateBounceRate(frequency) {
    return frequency > 0 ? (1000 / frequency).toFixed(2) : 'Infinity';
}

// Function to generate synthetic training data
function generateTrainingData() {
    const trainingData = [];
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => `node_${i + 1}`); // Create node identifiers

    for (let i = 0; i < NUM_SAMPLES; i++) {
        const dataSize = randomNormal(5000, 1500); // Normal distribution for data size
        const frequency = Math.floor(Math.random() * 500) + 1; // Random frequency between 1 and 500
        const bounceRate = calculateBounceRate(frequency);
        const historicalLoad = Math.random(); // Random load between 0 and 1
        const nextNode = nodes[Math.floor(Math.random() * nodes.length)]; // Randomly select a node
        const userId = `user_${Math.floor(Math.random() * 100) + 1}`; // User ID generation
        const timestamp = new Date().toISOString(); // Current timestamp

        trainingData.push({
            dataSize,
            bounceRate: parseFloat(bounceRate), // Ensure it's a number for consistency
            historicalLoad,
            nextNode,
            userId,
            timestamp
        });
    }

    return trainingData;
}

// Main execution block
(async () => {
    const trainingData = generateTrainingData();

    await fs.outputJson(OUTPUT_PATH, trainingData, { spaces: 2 });
    console.log(`Training data generated and saved to: ${OUTPUT_PATH}`);
})();