import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import { Core } from "./index.js";

describe("Core", () => {
	it("orchestrates the services correctly", async () => {
		const updateCommits = mock.fn();
		const users = { foo: 5, bar: NaN, baz: 8 };
		const core = new Core({
			getUsernames: mock.fn(() => Promise.resolve(Object.keys(users))),
			updateCommits,
		}, {
			commitsBetween: mock.fn((name) => users[name]),
			validUsername: mock.fn((name) => Promise.resolve(!isNaN(users[name]))),
		});

		await core.process({
			commitRange: "commitRange",
			spreadsheetId: "spreadsheetId",
			userRange: "userRange",
			worksheetName: "worksheetName",
		});

		assert.equal(updateCommits.mock.calls.length, 1);
		assert.deepEqual(updateCommits.mock.calls[0].arguments, [
			"spreadsheetId",
			"worksheetName",
			"commitRange",
			[5, NaN, 8],
		]);
	});
});
