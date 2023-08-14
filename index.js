const googleSheets = require("./googleSheets");

async function fillSheet() {
    const users = await googleSheets.getUsers();
    console.log(users);
}

module.exports.fillSheet = fillSheet;