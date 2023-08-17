#!/usr/bin/env node
import "dotenv/config";

import { GitHub } from "./github.js";
import { GoogleSheets } from "./googleSheets.js";
import { Core } from "./index.js";

const core = new Core(
	GoogleSheets.fromCredentials(JSON.parse(process.env.GOOGLE_CREDENTIALS ?? "{}")),
	GitHub.fromToken(process.env.GITHUB_TOKEN ?? ""),
);

const sheetsConfig = {
	spreadsheetId: process.env.SPREADSHEET_ID ?? "",
	userRange: process.env.USER_RANGE ?? "A:A",
	worksheetName: process.env.WORKSHEET_NAME ?? "GitHubData",
};

try {
	await core.process(sheetsConfig);
	console.log("process complete!");
	process.exit(0);
} catch (err) {
	console.error(err);
	process.exit(1);
}
