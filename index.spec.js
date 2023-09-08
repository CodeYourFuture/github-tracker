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

		await core.process(configStub());

		assert.equal(updateCommits.mock.calls.length, 1);
		assert.deepEqual(updateCommits.mock.calls[0].arguments, [
			"spreadsheetId",
			"worksheetName",
			"commitRange",
			[5, NaN, 8],
		]);
	});

	describe("date range", () => {
		it("ends with today by default", async () => {
			const commitsBetween = mock.fn(() => 123);
			const core = new Core({
				getUsernames: mock.fn(() => ["foo"]),
				updateCommits: mock.fn(),
			}, {
				commitsBetween,
				validUsername: mock.fn(() => true),
			});

			await core.process(configStub());

			assert.equal(commitsBetween.mock.calls.length, 1);
			const { arguments: [username, start, end] } = commitsBetween.mock.calls.at(-1);
			assert.equal(username, "foo");
			assert.equal(end.getTime(), new Date().setHours(12, 0, 0, 0), "should end at midday today");
			assert.equal(end - start, 7 * 24 * 60 * 60 * 1_000, "should cover 7 days");
		});

		it("can be given an alternative end date", async () => {
			const commitsBetween = mock.fn(() => 123);
			const core = new Core({
				getUsernames: mock.fn(() => ["foo"]),
				updateCommits: mock.fn(),
			}, {
				commitsBetween,
				validUsername: mock.fn(() => true),
			});
			const endDate = new Date(2021, 2, 3, 4, 5, 6);

			await core.process(configStub({ end: endDate }));

			const { arguments: [, start, end] } = commitsBetween.mock.calls.at(-1);
			assert.equal(end.getTime(), endDate.getTime());
			assert.equal(end - start, 7 * 24 * 60 * 60 * 1_000);
		});
	});
});

const configStub = (overrides) => ({
	commitRange: "commitRange",
	spreadsheetId: "spreadsheetId",
	userRange: "userRange",
	worksheetName: "worksheetName",
	...overrides,
});
