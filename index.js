const { google } = require("googleapis");
const moment = require("moment");

const creds = require("./creds.json");

const auth = new google.auth.GoogleAuth({
    credentials: creds.gcpKey,
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});
const googleSheetsInstance = google.sheets({ version: "v4", auth });
const spreadsheetId = "14_qFhVEdgBLXScjCHFySI6NFZMnT3l02bKDoGhxq4ZM";

async function updateGitHub() {
    try {
        const readData = await googleSheetsInstance.spreadsheets.values.get({
            spreadsheetId,
            range: "GitHub!C2",
        })

        const username = readData.data.values[0][0];

        const today = moment().format("YYYY-MM-DD");
        const weekAgo = moment().subtract(8, 'days').format("YYYY-MM-DD");

        const res = await fetch(`https://api.github.com/search/commits?q=author:${username}+committer-date:${weekAgo}..${today}`, {
            headers: {
                'Authorization': `Bearer ${creds.gitHubToken}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
        const data = await res.json();

        const countWeek = data["total_count"];

        await googleSheetsInstance.spreadsheets.values.update({
            spreadsheetId,
            range: "GitHub!D2",
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [[countWeek]],
            }
        });

        console.log("Done.");
    } catch (error) {
        console.log(error.message);
    }
}

updateGitHub();