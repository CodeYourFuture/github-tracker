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

const { values } = parseArgs({
	options: {
		credentials: { default: false, short: "c", type: "boolean" },
		file: { short: "f", type: "string" },
	},
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const credentialsFile = join(__dirname, values.file ?? "credentials.json");
const sheetTitle = "E2E Template";

try {
	if (values.credentials) {
		const credentials = await getCredentials(
			credentialsFile,
			"https://www.googleapis.com/auth/spreadsheets",
		);
		console.log("Use the following environment variable:");
		console.log(`GOOGLE_CREDENTIALS=${JSON.stringify(credentials)}`);
		process.exit(0);
	}

	const credentials = await getCredentials(credentialsFile, "https://www.googleapis.com/auth/drive.file");
	const client = createAuthenticatedClient(credentials);
	const sheet = await createSheet(client, "CYF GitHub Tracker E2E Testing", sheetTitle);
	const { properties: { sheetId } = {} } = getSheet(sheet.sheets ?? [], sheetTitle);
	await populateSheet(client, sheet.spreadsheetId ?? "", sheetTitle);
	console.log("Add the following to your .env file:");
	console.log("====================");
	console.log(`E2E_TEMPLATE=${sheetId}`);
	console.log(`GOOGLE_CREDENTIALS=${JSON.stringify(credentials)}`);
	console.log(`SPREADSHEET_ID=${sheet.spreadsheetId}`);
	console.log("====================");
	console.log("Spreadsheet URL:", sheet.spreadsheetUrl);
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
 * @param {string} sheetTitle
 * @returns {Promise<Spreadsheet>}
 */
async function createSheet(client, title, sheetTitle) {
	const { data: sheet } = await client.spreadsheets.create({
		requestBody: {
			properties: {
				title,
			},
			sheets: [
				{
					properties: {
						title: sheetTitle,
					},
				},
			],
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

/**
 * @param {Sheet[]} sheets
 * @param {string} sheetTitle
 * @returns {Sheet}
 */
function getSheet(sheets, sheetTitle) {
	const sheet = sheets.find(({ properties }) => properties?.title === sheetTitle);
	if (!sheet) {
		throw new Error(`Sheet ${sheetTitle} not created`);
	}
	return sheet;
}

/**
 * @param {Sheets} client
 * @param {string} spreadsheetId
 * @param {string} sheetTitle
 * @returns {Promise<void>}
 */
async function populateSheet(client, spreadsheetId, sheetTitle) {
	await client.spreadsheets.values.update({
		spreadsheetId: spreadsheetId,
		range: `${sheetTitle}!A:B`,
		requestBody: {
			values: [
				["GitHub ID", "Commits last week"],
				["textbook"],
				["haroon-ali-dev"],
				["definitely-does-not-exist-as-a-user-1"],
				["definitely-does-not-exist-as-a-user-2"],
				["momahboobian"],
				["LorenaCapraru"],
			],
		},
		valueInputOption: "USER_ENTERED",
	});
}
