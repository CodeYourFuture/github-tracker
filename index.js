const { google } = require("googleapis");
const moment = require("moment");

const creds = require("./creds.json");

let users = [];
let userCount = 0;
let index = 0
const today = moment().format("YYYY-MM-DD");
const weekAgo = moment().subtract(8, 'days').format("YYYY-MM-DD");

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
            range: "GitHub-2!C:C",
        })

        users = readData.data.values;
        userCount = users.length - 1;
        index = 1;

        modifyUsers();

        let myInterval = setInterval(() => {
            modifyUsers();

            if (userCount <= 0) {
                console.log(users);
                clearInterval(myInterval);
            }
        }, 2000);
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

updateGitHub();

async function modifyUsers() {
    let count = 0;
    while (userCount > 0) {
        if (count >= 30) break;

        const username = users[index][0];

        users[index][0] = 5;

        index++;
        userCount--;
        count++;

        console.log(username, 5, index);
    }
}





// INSIDE THE FOR LOOP
// const username = readData.data.values[index][0];

//             const res = await fetch(`https://api.github.com/search/commits?q=author:${username}+committer-date:${weekAgo}..${today}`, {
//                 headers: {
//                     'Authorization': `Bearer ${creds.gitHubToken}`,
//                     'Accept': 'application/vnd.github+json',
//                     'X-GitHub-Api-Version': '2022-11-28'
//                 }
//             });

//             if (res.ok) {
//                 const data = await res.json();

//                 const countWeek = data["total_count"];

//                 readData.data.values[index][0] = countWeek;

//                 index++;
//                 userCount--;

//                 console.log(username, countWeek);
//             } else {
//                 const data = await res.json();
//                 console.log(data.message);
//                 process.exit(1);
//             }











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