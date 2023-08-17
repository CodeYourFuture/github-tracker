import "dotenv/config";

import { GoogleSheets } from "./googleSheets.js";
import { Core } from "./index.js";


const googleSheets = GoogleSheets.fromCredentials(JSON.parse(process.env.GOOGLE_CREDENTIALS ?? "{}"));
const sheetsConfig = {
  spreadsheetId: process.env.SPREADSHEET_ID ?? "",
  userRange: process.env.USER_RANGE ?? "A:A",
  worksheetName: process.env.WORKSHEET_NAME ?? "GitHubData",
};

const core = Core.create(googleSheets);

try {
  await core.process(sheetsConfig);
  console.log("process complete!")
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
