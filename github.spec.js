import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { rest } from "msw";
import { setupServer } from "msw/node";

import { GitHub } from "./github.js";

const server = setupServer();

describe("GitHub", () => {
	const github = GitHub.fromToken("fake-token");

	before(() => server.listen({ onUnhandledRequest: "error" }));

	beforeEach(() => server.resetHandlers());

	after(() => server.close());

	describe("validUsername", () => {
		it("makes authenticated request with correct query", async () => {
			let headers, query;
			server.use(
				rest.get("https://api.github.com/search/users", (req, res, ctx) => {
					headers = Object.fromEntries(req.headers.entries());
					query = Object.fromEntries(req.url.searchParams.entries());
					return res(ctx.json({ total_count: 0, incomplete_results: false, items: [] }));
				}),
			);

			await github.validUsername("textbook");

			assert.equal(query.q, "user:textbook");
			assert.equal(headers.authorization, "token fake-token");
		});

		it("resolves true if username is found in search", async () => {
			server.use(
				rest.get("https://api.github.com/search/users", (req, res, ctx) => {
					return res(ctx.json({
						total_count: 1,
						incomplete_results: false,
						items: [
							{ id: 123, login: "textbook" },
						],
					}));
				}),
			);

			assert.equal(await github.validUsername("textbook"), true);
		});

		it("resolves false if username is not found in search", async () => {
			server.use(
				rest.get("https://api.github.com/search/users", (req, res, ctx) => {
					return res(ctx.json({
						total_count: 1,
						incomplete_results: false,
						items: [
							{ id: 123, login: "foo" },
							{ id: 456, login: "bar" },
							{ id: 789, login: "baz" },
						],
					}));
				}),
			);

			assert.equal(await github.validUsername("textbook"), false);
		});

		it("resolves false if search responds 422", async () => {
			server.use(
				rest.get("https://api.github.com/search/users", (req, res, ctx) => {
					return res(ctx.status(422), ctx.json({ message: "Validation Failed" }));
				}),
			);

			assert.equal(await github.validUsername("textbook"), false);
		});

		it("rejects if something else goes wrong", async () => {
			server.use(rest.get("https://api.github.com/search/users", (req, res, ctx) => res(ctx.status(403))));
			assert.rejects(() => github.validUsername("textbook"));
		});
	});
});
