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
   * @param {{ commitRange: string, spreadsheetId: string, userRange: string, worksheetName: string }} config
	 * @param {(message?: any, ...args: any[]) => void} log
   * @returns {Promise<{ lastWeekCommits: number, username: string }[]>}
   */
	async process({ commitRange, spreadsheetId, userRange, worksheetName }, log = console.log) {
		const oneWeekAgo = this._daysAgo(7);
		const today = this._today();

		const users = await this.googleSheets.getUsernames(spreadsheetId, worksheetName, userRange);
		/** @type {number[]} */
		const lastWeekCommits = [];

		for (let index = 0; index < users.length; index++) {
			const username = users[index];
			log("Processing %d / %d", index + 1, users.length);
			if (!await this.github.validUsername(username)) {
				lastWeekCommits.push(NaN);
			} else {
				lastWeekCommits.push(await this.github.commitsBetween(username, oneWeekAgo, today));
			}
		}

		await this.googleSheets.updateCommits(spreadsheetId, worksheetName, commitRange, lastWeekCommits);

		return users.map((username, index) => ({ username, lastWeekCommits: lastWeekCommits[index] }));
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
