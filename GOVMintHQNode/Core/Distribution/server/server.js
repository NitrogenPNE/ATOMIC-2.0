const express = require('express');
const { initDistribution } = require('../index');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/distribute', (req, res) => {
    const { data, userPoolChoice } = req.body;
    try {
        const result = initDistribution(data, userPoolChoice);
        res.status(200).json({ success: true, message: "Data distributed successfully", result });
    } catch (error) {
        console.error("Error during distribution:", error);
        res.status(500).json({ success: false, message: "Distribution failed", error: error.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`bitAtomDistributor server running on http://localhost:${PORT}`);
});

module.exports = server; // Export the server instance