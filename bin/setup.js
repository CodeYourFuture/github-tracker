#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import { authenticate } from "@google-cloud/local-auth";
import inquirer from "inquirer";
import inquirerFileTreeSelection from "inquirer-file-tree-selection-prompt";

import { GoogleSheets } from "../src/index.js";

const { values } = parseArgs({
	allowPositionals: false,
	options: {
		production: {
			default: false,
			type: "boolean",
		},
	},
	strict: true,
});

/**
 *  @typedef {{
 *   createSheet: boolean;
 *   credentialsFile: string;
 *   production: boolean;
 *   spreadsheetName: string;
 *   scope: string;
 *  }} Options
 *  */

inquirer.registerPrompt("file-tree-selection", inquirerFileTreeSelection);
/** @type {Options} */
const options = await inquirer.prompt([
	{
		type: "confirm",
		name: "production",
		message: "Are you generating production credentials?",
		default: false,
	},
	{
		type: "list",
		name: "scope",
		message: "Which scope should your Google credentials be for?",
		choices: [
			{
				name:
					"Dev - \"See, edit, create, and delete only the specific Google Drive files you use with this app\"",
				value: "https://www.googleapis.com/auth/drive.file",
			},
			{
				name: "Prod - \"See, edit, create, and delete all your Google Sheets spreadsheets\"",
				value: "https://www.googleapis.com/auth/spreadsheets",
			},
		],
		/**
		 * @param {Options} options
		 * @returns {string}
		 */
		default({ production }) {
			return production
				? "https://www.googleapis.com/auth/spreadsheets"
				: "https://www.googleapis.com/auth/drive.file";
		},
	},
	{
		type: "file-tree-selection",
		name: "credentialsFile",
		message: "Where is your credentials file?",
		enableGoUpperDirectory: true,
	},
	{
		type: "confirm",
		name: "createSheet",
		message: "Do you want to create a new spreadsheet?",
		/**
		 * @param {Options} options
		 * @returns {boolean}
		 */
		when({ scope }) {
			return scope === "https://www.googleapis.com/auth/drive.file";
		},
	},
	{
		type: "input",
		name: "spreadsheetName",
		message: "What name would you like the spreadsheet to have?",
		default: "CYF GitHub Tracker E2E Testing",
		/**
		 * @param {Options} options
		 * @returns {boolean}
		 */
		when({ createSheet }) {
			return createSheet;
		},
	},
], values);

try {
	const credentials = await getCredentials(options.credentialsFile, options.scope);
	/** @type {Record<string, string | null | undefined>} */
	const environmentVariables = {
		GOOGLE_CREDENTIALS: JSON.stringify(credentials),
	};

	if (options.createSheet) {
		const client = GoogleSheets.fromCredentials(credentials);
		const { spreadsheetId, spreadsheetUrl } = await client.createSheet(options.spreadsheetName);
		environmentVariables.SPREADSHEET_ID = spreadsheetId;
		console.log("Spreadsheet URL:", spreadsheetUrl);
	}

	logEnvVars(environmentVariables, options);
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
 * @param {Options} options
 */
function logEnvVars(vars, { production }) {
	console.log(`Add the following to your ${production ? "environment variables" : ".env file"}:`);
	console.log("====================");
	Object.entries(vars).forEach(([key, value]) => {
		console.log(`${key}=${value}`);
	});
	console.log("====================");
}
