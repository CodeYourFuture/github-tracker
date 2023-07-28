const googleSheets = require("./googleSheets");
const dayjs = require("dayjs");



const today = dayjs().format("YYYY-MM-DD");
const weekAgo = dayjs().subtract(8, 'days').format("YYYY-MM-DD");

async function run() {
    const users = await googleSheets.getUsers();

    console.log(users);
}

run();

// let users = [];
// let userCount = 0;
// let index = 0;
// let nextReset = 0;
// const today = moment().format("YYYY-MM-DD");
// const weekAgo = moment().subtract(8, 'days').format("YYYY-MM-DD");

// const auth = new google.auth.GoogleAuth({
//     credentials: creds.gcpKey,
//     scopes: "https://www.googleapis.com/auth/spreadsheets",
// });
// const service = google.sheets({ version: "v4", auth });
// const spreadsheetId = "14_qFhVEdgBLXScjCHFySI6NFZMnT3l02bKDoGhxq4ZM";

// async function updateGitHub() {
//     try {
//         const readData = await service.spreadsheets.values.get({
//             spreadsheetId,
//             range: "GitHub-2!C:C",
//         })

//         users = readData.data.values;
//         userCount = users.length - 1;
//         index = 1;

//         modifyUsers();
//     } catch (error) {
//         console.log(error.message);
//         process.exit(1);
//     }
// }

// updateGitHub();

// async function modifyUsers() {
//     let count = 0;
//     while (userCount > 0) {
//         if (count >= 30) break;

//         const username = users[index][0];

//         const res = await fetch(`https://api.github.com/search/commits?q=author:${username}+committer-date:${weekAgo}..${today}`, {
//             headers: {
//                 'Authorization': `Bearer ${creds.gitHubToken}`,
//                 'Accept': 'application/vnd.github+json',
//                 'X-GitHub-Api-Version': '2022-11-28'
//             }
//         });

//         if (res.ok) {
//             const data = await res.json();

//             const countWeek = data["total_count"];
//             users[index][0] = countWeek;
//             nextReset = res.headers.get("x-ratelimit-reset");

//             index++;
//             userCount--;
//             count++;

//             console.log(username, countWeek);
//         } else {
//             const data = await res.json();
//             console.log(data.message);
//             process.exit(1);
//         }
//     }

//     if (userCount > 0) {
//         const seconds = (nextReset - moment().unix()) + 1;
//         console.log(`Waiting for ${seconds} seconds till next reset...`)
//         setTimeout(() => {
//             modifyUsers();
//         }, seconds * 1000);
//     } else {
//         users[0][0] = "Github commits/week";
//         insertData();
//     }
// }

// async function insertData() {
//     try {
//         await service.spreadsheets.values.update({
//             spreadsheetId,
//             range: "GitHub-2!D:D",
//             valueInputOption: "USER_ENTERED",
//             resource: {
//                 values: users
//             },
//         });
    
//         console.log("All done!");
        
//     } catch (error) {
//         console.log(error.message);
//     }
// }