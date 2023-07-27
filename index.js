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
    const today = moment().format("YYYY-MM-DD");
    const weekAgo = moment().subtract(8, 'days').format("YYYY-MM-DD");

    try {
        const readData = await googleSheetsInstance.spreadsheets.values.get({
            spreadsheetId,
            range: "GitHub-2!C:C",
        })

        const users = readData.data.values;

        let userCount = readData.data.values.length;
        let index = 1;

        for (let i = 0; i < readData.data.values.length; i++) {
            if (i >= 30) break;

            const username = readData.data.values[index][0];

            const res = await fetch(`https://api.github.com/search/commits?q=author:${username}+committer-date:${weekAgo}..${today}`, {
                headers: {
                    'Authorization': `Bearer ${creds.gitHubToken}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (res.ok) {
                const data = await res.json();
    
                const countWeek = data["total_count"];
    
                readData.data.values[index][0] = countWeek;
                
                index++;
                userCount--;

                console.log(username, countWeek);
            } else {
                const data = await res.json();
                console.log(data.message);
                process.exit(1);
            }
        }

        console.log(users);

        // const username = readData.data.values[0][0];

        // const today = moment().format("YYYY-MM-DD");
        // const weekAgo = moment().subtract(8, 'days').format("YYYY-MM-DD");

        // const res = await fetch(`https://api.github.com/search/commits?q=author:${username}+committer-date:${weekAgo}..${today}`, {
        //     headers: {
        //         'Authorization': `Bearer ${creds.gitHubToken}`,
        //         'Accept': 'application/vnd.github+json',
        //         'X-GitHub-Api-Version': '2022-11-28'
        //     }
        // });
        // const data = await res.json();

        // const countWeek = data["total_count"];

        // await googleSheetsInstance.spreadsheets.values.update({
        //     spreadsheetId,
        //     range: "GitHub!D2",
        //     valueInputOption: "USER_ENTERED",
        //     resource: {
        //         values: [[countWeek]],
        //     }
        // });

        // console.log("Done.");
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

updateGitHub();