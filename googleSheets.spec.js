import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { setupServer } from "msw/node";
import { rest } from "msw";

import { GoogleSheets } from "./googleSheets.js";

const server = setupServer();

describe("GoogleSheets", () => {
	/** @type {GoogleSheets} */
	let sheets;

	before(() => server.listen({ onUnhandledRequest: "error" }));

	beforeEach(() => {
		server.resetHandlers();
		sheets = GoogleSheets.fromCredentials({
			client_id: "fake-client-id",
			client_secret: "fake-client-secret",
			refresh_token: "fake-refresh-token",
			type: "authorized_user",
		});
	});

	after(() => server.close());

	describe("getUsernames", () => {
		it("gets data from the Sheets API", async () => {
			/** @type {import("msw").RestRequest} */
			let request;
			const spreadsheetId = "abc123";
			const username = "textbook";
			const userRange = "A:A";
			const worksheetName = "FooBar";
			server.use(
				rest.post("https://oauth2.googleapis.com/token", (_, res, ctx) => res(ctx.json({ access_token: "fake-token" }))),
				rest.get("https://sheets.googleapis.com/v4/spreadsheets/:sheet/values/:range", (req, res, ctx) => {
					request = req;
					return res(ctx.json({ values: [[username]] }));
				}),
			);

			const result = await sheets.getUsernames(spreadsheetId, worksheetName, userRange);

			assert.equal(request.headers.get("Authorization"), "Bearer fake-token");
			assert.deepEqual(result, [username]);
			assert.deepEqual({ ...request.params }, { sheet: spreadsheetId, range: `${worksheetName}!${userRange}` });
		});
	});

	describe("updateCommits", () => {
		it("puts data to the sheets API", async () => {
			let request;
			const spreadsheetId = "abc123";
			const commitRange = "A:A";
			const worksheetName = "FooBar";
			server.use(
				rest.post("https://oauth2.googleapis.com/token", (_, res, ctx) => res(ctx.json({ access_token: "fake-token" }))),
				rest.put("https://sheets.googleapis.com/v4/spreadsheets/:sheet/values/:range", (req, res, ctx) => {
					request = req;
					return res(ctx.json({}));
				}),
			);

			await sheets.updateCommits(spreadsheetId, worksheetName, commitRange, [1, 2, NaN]);

			assert.equal(request.headers.get("Authorization"), "Bearer fake-token");
			assert.deepEqual({ ...request.params }, { range: `${worksheetName}!${commitRange}`, sheet: spreadsheetId });
			assert.deepEqual(await request.json(), { values: [[1], [2], ["#N/A"]] });
		});
	});
});
