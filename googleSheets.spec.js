import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it, mock } from "node:test";

import { setupServer } from "msw/node";
import { rest } from "msw";

import { GoogleSheets } from "./googleSheets.js";

const server = setupServer();

describe("GoogleSheets", () => {
  before(() => server.listen({ onUnhandledRequest: "error" }));

  beforeEach(() => server.resetHandlers());

  after(() => server.close());

  it("works in integration", async () => {
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

    const sheets = GoogleSheets.fromCredentials({
      client_id: "fake-client-id",
      client_secret: "fake-client-secret",
      refresh_token: "fake-refresh-token",
      type: "authorized_user",
    });
    const result = await sheets.getUsernames(spreadsheetId, worksheetName, userRange);

    assert.deepEqual(result, [username]);
    assert.deepEqual({ ...request.params }, { sheet: spreadsheetId, range: `${worksheetName}!${userRange}` });
  });
});
