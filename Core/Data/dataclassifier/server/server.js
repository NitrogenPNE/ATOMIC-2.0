const express = require('express');
const { main } = require('../index');

const app = express();
app.use(express.json());

app.post('/classify', (req, res) => {
    const data = req.body;
    const classifiedData = main(data);
    res.json(classifiedData);
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Data Classifier Server running on http://localhost:${PORT}`);
});
