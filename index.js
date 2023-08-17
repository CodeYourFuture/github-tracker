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
		const oneWeekAgo = this._daysAgo(7);
		const today = this._today();

		const users = await this.googleSheets.getUsernames(spreadsheetId, worksheetName, userRange);

		for (let index = 0; index < users.length; index++) {
			const username = users[index];
			const isUser = await this.github.validUsername(username);
			const lastWeekCommits = isUser
				? await this.github.commitsBetween(username, oneWeekAgo, today)
				: NaN;
			console.log(index + 1, username, isUser, lastWeekCommits);
		}
	}

	/**
	 * @param {number} days
	 * @returns {Date}
	 */
	_daysAgo(days) {
		const date = this._today();
		date.setDate(date.getDate() - days);
		return date;
	}

	/**
	 * @returns {Date}
	 */
	_today() {
		const today = new Date();
		today.setHours(12, 0, 0, 0);
		return today;
	}
}
