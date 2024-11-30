const express = require('express');
const { classifyData } = require('../script/classifierLogic');

const app = express();
app.use(express.json());

// Endpoint to classify data
app.post('/classify', (req, res) => {
    const { data } = req.body;

    if (!data) {
        return res.status(400).send('No data provided.');
    }

    const classification = classifyData(data);
    res.json({ classification });
});

module.exports = app;
