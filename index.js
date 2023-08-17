/**
 * @typedef {import("./googleSheets.js").GoogleSheets} GoogleSheets
 */

export class Core {

	/**
   * @param {GoogleSheets} googleSheets
   */
	constructor(googleSheets) {
		this.googleSheets = googleSheets;
	}

	/**
   * @param {{ spreadsheetId: string, userRange: string, worksheetName: string }} config
   * @returns {Promise<void>}
   */
	async process({ spreadsheetId, userRange, worksheetName }) {
		const users = await this.googleSheets.getUsernames(spreadsheetId, worksheetName, userRange);
		users.forEach((username, index) => {
			console.log(index + 1, username);
		});
	}
}
