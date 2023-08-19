import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { graphql, rest } from "msw";
import { setupServer } from "msw/node";

import { GitHub } from "./github.js";

const server = setupServer();

describe("GitHub", () => {
	const github = GitHub.fromToken("fake-token", false);

	before(() => server.listen({ onUnhandledRequest: "error" }));

	beforeEach(() => server.resetHandlers());

	after(() => server.close());

	describe("commitsBetween", () => {
		it("makes authenticated request with correct query", async () => {
			let headers, query;
			server.use(
				rest.get("https://api.github.com/search/commits", (req, res, ctx) => {
					headers = Object.fromEntries(req.headers.entries());
					query = Object.fromEntries(req.url.searchParams.entries());
					return res(ctx.json(envelope([])));
				}),
			);

			await github.commitsBetween("textbook", new Date(2023, 4, 5, 12), new Date(2023, 4, 12, 12));

			assert.equal(query.q, "author:textbook author-date:2023-05-05..2023-05-12");
			assert.equal(headers.authorization, "token fake-token");
		});

		it("resolves to the total count", async () => {
			server.use(
				rest.get("https://api.github.com/search/commits", (req, res, ctx) => {
					return res(ctx.json({ total_count: 123, incomplete_results: false, items: [] }));
				}),
			);

			assert.equal(await github.commitsBetween("textbook", new Date(), new Date()), 123);
		});
	});

	describe("validUsername", () => {
		it("makes authenticated request with correct query", async () => {
			let headers, query;
			server.use(
				graphql.query("GetUsers", (req, res, ctx) => {
					headers = Object.fromEntries(req.headers.entries());
					query = req.variables;
					return res(ctx.data({ search: { nodes: [] } }));
				}),
			);

			await github.validUsername("textbook");

			assert.equal(query.q, "user:textbook");
			assert.equal(headers.authorization, "token fake-token");
		});

		it("resolves true if username is found in search", async () => {
			server.use(
				graphql.query("GetUsers", (req, res, ctx) => {
					return res(ctx.data({ search: { nodes: [{ login: "textbook" }] } }));
				}),
			);

			assert.equal(await github.validUsername("textbook"), true);
		});

		it("resolves false if username is not found in search", async () => {
			server.use(
				graphql.query("GetUsers", (req, res, ctx) => {
					return res(ctx.data({ search: { nodes: [{ login: "foo" }, { login: "bar" }, { login: "baz" }] } }));
				}),
			);

			assert.equal(await github.validUsername("textbook"), false);
		});

		it("accepts case-insensitive matches", async () => {
			server.use(
				graphql.query("GetUsers", (req, res, ctx) => {
					return res(ctx.data({ search: { nodes: [{ login: "tExTbOoK" }] } }));
				}),
			);

			assert.equal(await github.validUsername("textbook"), true);
		});

		it("rejects if something else goes wrong", async () => {
			server.use(
				rest.post("https://api.github.com/graphql", (req, res, ctx) => {
					return res(ctx.status(401), ctx.json({ message: "This endpoint requires you to be authenticated." }));
				}),
			);
			await assert.rejects(() => github.validUsername("textbook"));
		});
	});

	describe("throttling", () => {
		const throttled = GitHub.fromToken("fake-token", true);

		it("retries requests if rate limit is hit", async () => {
			const responses = [
				{ json: { message: "API rate limit exceeded for user ID 123456" }, remaining: 0, status: 403 },
				{ json: envelope([{}, {}, {}]), remaining: 100, status: 200 },
			];
			server.use(
				rest.get("https://api.github.com/search/commits", (req, res, ctx) => {
					/** @type {any} */
					const { json, remaining, status } = responses.shift();
					return res(
						ctx.status(status),
						ctx.json(json),
						ctx.set("x-ratelimit-remaining", `${remaining}`),
						ctx.set("x-ratelimit-reset", `${Math.floor(new Date().getTime() / 1_000) + 1}`),
						ctx.set("x-ratelimit-used", `${30 - remaining}`),
					);
				}),
			);

			assert.equal(await throttled.commitsBetween("textbook", new Date(), new Date()), 3);
		});

		it("gives up after three attempts", async () => {
			let count = 0;
			server.use(
				rest.get("https://api.github.com/search/commits", (req, res, ctx) => {
					count++;
					return res(
						ctx.status(403),
						ctx.json({ message: "API rate limit exceeded for user ID 123456" }),
						ctx.set("x-ratelimit-remaining", "0"),
						ctx.set("x-ratelimit-reset", `${Math.floor(new Date().getTime() / 1_000) + 1}`),
						ctx.set("x-ratelimit-used", "30"),
					);
				}),
			);
			await assert.rejects(() => throttled.commitsBetween("textbook", new Date(), new Date()));
			assert.equal(count, 3);
		});

		it("applies to GraphQL queries", async () => {
			let count = 0;
			const responses = [
				{ type: "RATE_LIMITED" },
				{ search: { nodes: [{ login: "textbook" }] } },
			];
			server.use(
				graphql.query("GetUsers", (req, res, ctx) => {
					count++;
					const response = responses.shift();
					if (response.type) {
						return res(ctx.errors([response]), ctx.set("x-ratelimit-remaining", "0"));
					}
					return res(ctx.data(response));
				}),
			);

			assert.equal(await throttled.validUsername("textbook"), true);
			assert.equal(count, 2);
		});
	});

	function envelope(items) {
		return {
			items,
			total_count: items.length,
			incomplete_results: false,
		};
	}
});
