const readline = require('readline');
const dayjs = require("dayjs");
require('dotenv').config();

const today = dayjs().format("YYYY-MM-DD");
const weekAgo = dayjs().subtract(8, 'days').format("YYYY-MM-DD");

async function getCommitsSince(user, currentUser, totalUsers) {
    consoleOutput(`Processing ${currentUser + 1}/${totalUsers} users...`);

    if (!await verifyUser(user)) return ['User does not exist.'];

    return [await getWeekAgo(user)];
}

async function verifyUser(user) {
    if (!user) return false;

    const res = await fetch(`https://api.github.com/search/users?q=${user}`, {
        headers: {
            'Authorization': `Bearer ${process.env.gitHubToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    const data = await res.json();

    if (res.ok) {
        return (data["total_count"] >= 1) ? true : false;
    } else if (res.status === 403) {
        await wait(+res.headers.get("x-ratelimit-reset"));

        return verifyUser(user);
    } else {
        console.log("GitHub API error.");
        process.exit(1);
    }
}

async function getWeekAgo(user) {
    const res = await fetch(`https://api.github.com/search/commits?q=author:${user}+committer-date:${weekAgo}..${today}`, {
        headers: {
            'Authorization': `Bearer ${process.env.gitHubToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    const data = await res.json();

    if (res.ok) {
        return data["total_count"];
    } else if (res.status === 403) {
        await wait(+res.headers.get("x-ratelimit-reset"));

        return getWeekAgo(user);
    } else {
        console.log("GitHub API error.");
        process.exit(1);
    }
}

async function getMonthAgo() {

}

async function wait(limitReset) {
    const secondsToWait = (limitReset - dayjs().unix()) + 1;
    consoleOutput(`Waiting ${secondsToWait} seconds...`);

    return new Promise(resolve => setTimeout(resolve, secondsToWait * 1000));
}

function consoleOutput(text) {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    process.stdout.write(text);
}

module.exports.getCommitsSince = getCommitsSince;