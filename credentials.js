#!/usr/bin/env node

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { authenticate } from "@google-cloud/local-auth";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
	const auth = await authenticate({
		keyfilePath: join(__dirname, "credentials.json"),
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});
	console.log(auth.credentials);
} catch (err) {
	console.error(err);
	process.exit(1);
}
