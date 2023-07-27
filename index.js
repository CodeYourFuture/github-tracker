const { google } = require("googleapis");
const moment = require("moment");

const creds = require("./creds.json");

async function updateGitHub() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: creds.gcpKey,
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });
        const authClientObject = await auth.getClient();
        const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
        const spreadsheetId = "14_qFhVEdgBLXScjCHFySI6NFZMnT3l02bKDoGhxq4ZM";

        const readData = await googleSheetsInstance.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "GitHub!C2",
        })

        const username = readData.data.values[0][0];

        const today = moment().format("YYYY-MM-DD");
        const weekAgo = moment().subtract(8, 'days').format("YYYY-MM-DD");
        console.log(weekAgo);

        const res = await fetch(`https://api.github.com/search/commits?q=author:${username}+committer-date:>${weekAgo}`, {
            headers: {
                'Authorization': `Bearer ${creds.gitHubToken}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
        const data = await res.json();

        console.log(data["total_count"]);
    } catch (error) {
        console.log(error.message);
    }
}

updateGitHub();