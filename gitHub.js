const dayjs = require("dayjs");
require('dotenv').config();

const today = dayjs().format("YYYY-MM-DD");
const weekAgo = dayjs().subtract(8, 'days').format("YYYY-MM-DD");

async function getCommitsSince(user, timeFrame) {
    let url;
    if (timeFrame === "one-week-ago") {
        url = `https://api.github.com/search/commits?q=author:${user}+committer-date:${weekAgo}..${today}`;
    }

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

module.exports.getCommitsSince = getCommitsSince;