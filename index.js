const googleSheets = require("./googleSheets");
const gitHub = require("./gitHub");

async function fillSheet() {
    const users = await googleSheets.getUsers();

    const commits = [];
    for (let i = 0; i < users.length; i++) {
        commits.push(await gitHub.getCommitsSince(users[i][0], i, users.length));
    }

    await googleSheets.updateCommits(commits);
}

module.exports.fillSheet = fillSheet;