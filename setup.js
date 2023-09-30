#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { authenticate } from "@google-cloud/local-auth";
import { auth, sheets } from "@googleapis/sheets";

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
const credentialsFile = join(__dirname, values.file ?? "credentials.json");

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

	const credentials = await getCredentials(credentialsFile, "https://www.googleapis.com/auth/drive.file");
	let spreadsheetId, spreadsheetUrl;
	if (options.refresh) {
		const client = createAuthenticatedClient(credentials);
		({ spreadsheetId, spreadsheetUrl } = await createSheet(client, "CYF GitHub Tracker E2E Testing"));
	}

	console.log("Add the following to your .env file:");
	console.log("====================");
	console.log(`GOOGLE_CREDENTIALS=${JSON.stringify(credentials)}`);
	if (options.refresh) {
		console.log(`SPREADSHEET_ID=${spreadsheetId}`);
	}
	console.log("====================");

	if (options.refresh) {
		console.log("Spreadsheet URL:", spreadsheetUrl);
	}
} catch (err) {
	console.error(err);
	process.exit(1);
}

/**
 * @param {any} credentials
 * @returns {Sheets}
 */
function createAuthenticatedClient(credentials) {
	/** @type {any} */
	const googleAuth = auth.fromJSON(credentials);
	return sheets({ auth: googleAuth, version: "v4" });
}

/**
 * @param {Sheets} client
 * @param {string} title
 * @returns {Promise<Spreadsheet>}
 */
async function createSheet(client, title) {
	const { data: sheet } = await client.spreadsheets.create({
		requestBody: {
			properties: {
				title,
			},
		},
	});
	return sheet;
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
