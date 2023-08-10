const readline = require('readline');
const dayjs = require("dayjs");
require('dotenv').config();

const today = dayjs().format("YYYY-MM-DD");
const weekAgo = dayjs().subtract(8, 'days').format("YYYY-MM-DD");

async function getCommitsSince(user, currentUser, totalUsers) {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    process.stdout.write(`Processing ${currentUser + 1}/${totalUsers} users...`);

    if (!await verifyUser(user)) return ['User does not exist.'];
    
    return ['User exists.'];
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

    if (res.ok) {
        const data = await res.json();
        return (data["total_count"] >= 1) ? true : false;
    }

    return false;
}

async function getWeekAgo() {
    const url = `https://api.github.com/search/commits?q=author:${user}+committer-date:${weekAgo}..${today}`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${process.env.gitHubToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    if (res.ok) {
        const data = await res.json();

        if (res.headers.get("x-ratelimit-remaining") === "0") {
            const secondsToWait = (+res.headers.get("x-ratelimit-reset") - dayjs().unix()) + 1;
            await new Promise(resolve => setTimeout(resolve, secondsToWait * 1000));
        }

        return [data["total_count"]];
    } else {
        const data = await res.json();
        console.log(data.message);
        process.exit(1);
    }
}

async function getMonthAgo() {

}

async function wait() {

}

module.exports.getCommitsSince = getCommitsSince;