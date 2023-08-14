const { GoogleAuth } = require("google-auth-library")
const { sheets } = require("@googleapis/sheets");
require('dotenv').config();

const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.gcpKey),
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});
const service = sheets({ version: "v4", auth });

async function getUsers() {
    const readData = await service.spreadsheets.values.get({
        spreadsheetId: process.env.spreadsheetId,
        range: "GitHub!C2:C",
    })

    return readData.data.values;
}

module.exports.getUsers = getUsers;