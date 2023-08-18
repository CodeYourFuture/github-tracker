import "dotenv/config";

import assert from "node:assert/strict";
import { exec } from "node:child_process";
import { after, describe, it } from "node:test";

import { auth, sheets } from "@googleapis/sheets";

const sheetsClient = authenticatedClient();
const spreadsheetId = process.env.SPREADSHEET_ID;

describe("GitHub Tracker", () => {
	const sheetsToDelete = [];

	after(async () => {
		if (sheetsToDelete.length > 0) {
			await sheetsClient.spreadsheets.batchUpdate({
				requestBody: {
					requests: sheetsToDelete.map((sheetId) => ({ deleteSheet: { sheetId } })),
				},
				spreadsheetId,
			});
		}
	});

	it("works with a real spreadsheet", async () => {
		const { data: { sheetId, title } } = await sheetsClient.spreadsheets.sheets.copyTo({
			requestBody: {
				destinationSpreadsheetId: spreadsheetId,
			},
			sheetId: process.env.E2E_TEMPLATE,
			spreadsheetId,
		});
		sheetsToDelete.push(sheetId);

		await new Promise((resolve, reject) => exec(
			"node cli.js",
			{ env: { ...process.env, WORKSHEET_NAME: title } },
			(err, stdout, stderr) => {
				if (err) {
					console.error(stderr);
					reject(err);
				} else {
					console.log(stdout);
					resolve();
				}
			},
		));

		const { data: { values } } = await sheetsClient.spreadsheets.values.get({
			range: `${title}!A2:B`,
			spreadsheetId,
		});
		const commitCounts = Object.fromEntries(values);
		Object.keys(commitCounts).forEach((name) => {
			if (name.startsWith("definitely-does-not-exist-")) {
				assert.ok(commitCounts[name] === "#N/A", "missing users should have #N/A counts");
			} else {
				assert.ok(parseInt(commitCounts[name], 10) >= 0, "real users should have positive integer counts");
			}
		});
	});
});

/**
 * @returns {import("@googleapis/sheets").sheets_v4.Sheets}
 */
function authenticatedClient() {
	/** @type {any} - for some reason this doesn't typecheck */
	const googleAuth = auth.fromJSON(JSON.parse(process.env.GOOGLE_CREDENTIALS ?? "{}"));
	return sheets({ auth: googleAuth, version: "v4" });
}
