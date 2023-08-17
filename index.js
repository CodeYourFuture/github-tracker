export class Core {

	/**
   * @param {import("./googleSheets.js").GoogleSheets} googleSheets
   * @param {import("./github.js").GitHub} github
   */
	constructor(googleSheets, github) {
		this.googleSheets = googleSheets;
		this.github = github;
	}

	/**
   * @param {{ spreadsheetId: string, userRange: string, worksheetName: string }} config
   * @returns {Promise<void>}
   */
	async process({ spreadsheetId, userRange, worksheetName }) {
		const users = await this.googleSheets.getUsernames(spreadsheetId, worksheetName, userRange);
		for (let index = 0; index < users.length; index++) {
			const user = users[index];
			console.log(index + 1, user, await this.github.validUsername(user));
		}
	}
}
