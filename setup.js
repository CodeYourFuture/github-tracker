#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { authenticate } from "@google-cloud/local-auth";

import { GoogleSheets } from "./googleSheets.js";

/**
 *  @typedef {import("@googleapis/sheets").sheets_v4.Schema$Sheet} Sheet
 *  @typedef {import("@googleapis/sheets").sheets_v4.Sheets} Sheets
 *  @typedef {import("@googleapis/sheets").sheets_v4.Schema$Spreadsheet} Spreadsheet
 *  */

const { values: options } = parseArgs({
	options: {
		credentials: { default: false, short: "c", type: "boolean" },
		file: { short: "f", type: "string" },
		refresh: { default: false, short: "r", type: "boolean" },
	},
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const credentialsFile = join(__dirname, options.file ?? "credentials.json");

try {
	if (options.credentials) {
		const credentials = await getCredentials(
			credentialsFile,
			"https://www.googleapis.com/auth/spreadsheets",
		);
		console.log("Use the following environment variable:");
		console.log(`GOOGLE_CREDENTIALS=${JSON.stringify(credentials)}`);
		process.exit(0);
	}

	const credentials = await getCredentials(
		credentialsFile,
		"https://www.googleapis.com/auth/drive.file",
	);
	/** @type {Record<string, string | null | undefined>} */
	const environmentVariables = {
		GOOGLE_CREDENTIALS: JSON.stringify(credentials),
	};

	if (!options.refresh) {
		const client = GoogleSheets.fromCredentials(credentials);
		const { spreadsheetId, spreadsheetUrl } = await client.createSheet("CYF GitHub Tracker E2E Testing");
		environmentVariables.SPREADSHEET_ID = spreadsheetId;
		console.log("Spreadsheet URL:", spreadsheetUrl);
	}

	logEnvVars(environmentVariables);
} catch (err) {
	console.error(err);
	process.exit(1);
}

/**
 * @param {string} keyfilePath
 * @param {string} scope
 * @returns {Promise<object>}
 */
async function getCredentials(keyfilePath, scope) {
	const { installed: { client_id, client_secret } } = JSON.parse(await readFile(keyfilePath, "utf-8"));
	const { credentials: { refresh_token } } = await authenticate({ keyfilePath, scopes: [scope] });
	return { client_id, client_secret, refresh_token, type: "authorized_user" };
}

/**
 * @param {Object} vars
 */
function logEnvVars(vars) {
	console.log("Add the following to your .env file:");
	console.log("====================");
	Object.entries(vars).forEach(([key, value]) => {
		console.log(`${key}=${value}`);
	});
	console.log("====================");
}
