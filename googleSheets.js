const { GoogleAuth } = require("google-auth-library")
const { sheets } = require("@googleapis/sheets");
require('dotenv').config();

const creds = require("./creds.json");

const auth = new GoogleAuth({
    credentials: creds.gcpKey,
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});
const service = sheets({ version: "v4", auth });
const spreadsheetId = "14_qFhVEdgBLXScjCHFySI6NFZMnT3l02bKDoGhxq4ZM";

async function getUsers() {
    const readData = await service.spreadsheets.values.get({
        spreadsheetId,
        range: "GitHub!C2:C",
    })

    return readData.data.values;
}

async function updateCommits(commits) {
    await service.spreadsheets.values.update({
        spreadsheetId,
        range: "GitHub!D:D",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: commits
        },
    });
}

module.exports.getUsers = getUsers;
module.exports.updateCommits = updateCommits;