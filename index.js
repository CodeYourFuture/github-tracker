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
   * @param {{ commitRange: string, end?: Date, spreadsheetId: string, userRange: string, worksheetName: string }} config
	 * @param {(message?: any, ...args: any[]) => void} log
   * @returns {Promise<{ lastWeekCommits: number, username: string }[]>}
   */
	async process({ commitRange, end, spreadsheetId, userRange, worksheetName }, log = console.log) {
		const upTo = end ?? this._today();
		const oneWeekPrior = this._daysAgo(upTo, 7);

		const users = await this.googleSheets.getUsernames(spreadsheetId, worksheetName, userRange);
		/** @type {number[]} */
		const lastWeekCommits = [];

		for (let index = 0; index < users.length; index++) {
			const username = users[index];
			log("Processing %d / %d", index + 1, users.length);
			if (username && await this.github.validUsername(username)) {
				lastWeekCommits.push(await this.github.commitsBetween(username, oneWeekPrior, upTo));
			} else {
				lastWeekCommits.push(NaN);
			}
		}

		await this.googleSheets.updateCommits(spreadsheetId, worksheetName, commitRange, lastWeekCommits);

		return users.map((username, index) => ({ username, lastWeekCommits: lastWeekCommits[index] }));
	}

	/**
	 * @param {Date} from
	 * @param {number} days
	 * @returns {Date}
	 */
	_daysAgo(from, days) {
		const date = new Date(from);
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
