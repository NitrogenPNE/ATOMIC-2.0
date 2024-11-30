const { distributeBitAtoms } = require('./script/bitAtomDistributor');
const config = require('./config/config.json');

function initDistribution(data, userPoolChoice) {
    console.log("Initializing bit atom distribution...");

    const result = distributeBitAtoms(data, userPoolChoice);
    console.log("Distribution completed:", result);

    return result;
}

module.exports = { initDistribution };
