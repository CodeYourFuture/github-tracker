const googleSheets = require("./googleSheets");

async function fillSheet() {
    const users = await googleSheets.getUsers();
}

module.exports.fillSheet = fillSheet;