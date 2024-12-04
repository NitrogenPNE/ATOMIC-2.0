// Entry point for the classifier logic

const { classifyData } = require('./script/classifierLogic');
const express = require('express');
const config = require('./config/config');
const app = require('./server/server');

// Initialize server on the configured port
const PORT = config.port || 4000;

app.listen(PORT, () => {
    console.log(`Classifier Server running on http://localhost:${PORT}`);
});
