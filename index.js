const googleSheets = require("./googleSheets");
const gitHub = require("./gitHub");

async function fillSheet() {
    const users = await googleSheets.getUsers();

    const commits = [];
    for (let user of users) {
        commits.push(await gitHub.getCommitsSince(user[0]));
    }

    await googleSheets.updateCommits(commits);
}

module.exports.fillSheet = fillSheet;