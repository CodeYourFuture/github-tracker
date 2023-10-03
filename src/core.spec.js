import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import { Core } from "./core.js";

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

	it("gets 28 days' data if required", async () => {
		const commitsBetween = mock.fn(() => Promise.resolve(5));
		const updateCommits = mock.fn();
		const core = new Core({
			getUsernames: mock.fn(() => Promise.resolve(["foo"])),
			updateCommits,
		}, {
			commitsBetween,
			validUsername: mock.fn(() => Promise.resolve(true)),
		});

		await core.process(configStub({ averageRange: "averageRange" }));

		assert.equal(commitsBetween.mock.calls.length, 2);
		const ranges = commitsBetween.mock.calls.map(({ arguments: [, start, end] }) => end - start);
		assert.deepEqual(ranges, [daysInMs(7), daysInMs(28)]);
		assert.equal(updateCommits.mock.calls.length, 2);
		assert.deepEqual(updateCommits.mock.calls[0].arguments, ["spreadsheetId", "worksheetName", "commitRange", [5]]);
		assert.deepEqual(updateCommits.mock.calls[1].arguments, ["spreadsheetId", "worksheetName", "averageRange", [1.25]]);
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
			assert.equal(end.getTime(), new Date().setHours(12, 0, 0, 0));
			assert.equal(end - start, daysInMs(7));
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
			assert.equal(end - start, daysInMs(7));
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

const daysInMs = (days) => days * 24 * 60 * 60 * 1_000;
