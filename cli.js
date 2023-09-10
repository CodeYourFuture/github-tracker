#!/usr/bin/env node
import "dotenv/config";

import * as readline from "node:readline";
import { format } from "node:util";

import { GitHub } from "./github.js";
import { GoogleSheets } from "./googleSheets.js";
import { Core } from "./index.js";

validateEnv([
	"COMMIT_RANGE",
	"GITHUB_TOKEN",
	"GOOGLE_CREDENTIALS",
	"SPREADSHEET_ID",
	"USER_RANGE",
	"WORKSHEET_NAME",
]);

const core = new Core(
	GoogleSheets.fromCredentials(JSON.parse(process.env.GOOGLE_CREDENTIALS ?? "{}")),
	GitHub.fromToken(process.env.GITHUB_TOKEN ?? ""),
);

const debug = process.env.LOG_LEVEL?.toUpperCase() === "DEBUG";

const sheetsConfig = {
	commitRange: process.env.COMMIT_RANGE ?? "",
	end: process.env.END_DATE !== undefined ? new Date(process.env.END_DATE) : undefined,
	spreadsheetId: process.env.SPREADSHEET_ID ?? "",
	userRange: process.env.USER_RANGE ?? "",
	worksheetName: process.env.WORKSHEET_NAME ?? "",
};

try {
	const data = await core.process(sheetsConfig, log);
	console.log("\n\nprocess complete!");
	if (debug) {
		console.table(data);
	}
	process.exit(0);
} catch (err) {
	console.error(err);
	process.exit(1);
}

/**
 * @param {any=} message
 * @param  {...any} args
 */
function log(message, ...args) {
	readline.cursorTo(process.stdout, 0);
	readline.clearLine(process.stdout, 0);
	process.stdout.write(format(message, ...args));
}

/**
 * @param {string[]} requiredEnvVars
 */
function validateEnv(requiredEnvVars) {
	const missing = requiredEnvVars.filter((envVar) => process.env[envVar] === undefined);
	if (missing.length > 0) {
		console.error(`missing required env vars: ${missing.join(", ")}`);
		process.exit(1);
	}
}
