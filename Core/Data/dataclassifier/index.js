const { classifyData } = require('./script/dataClassifier');
const config = require('./config/config.json');

function main(inputData) {
    console.log("Starting Data Classification...");
    const classified = classifyData(inputData);
    console.log("Classified Data:", classified);
    return classified;
}

module.exports = { main };
