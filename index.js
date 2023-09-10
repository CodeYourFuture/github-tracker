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
   * @param {{
	 *   averageRange: string | undefined;
	 *   commitRange: string;
	 *   end: Date | undefined;
	 *   spreadsheetId: string;
	 *   userRange: string;
	 *   worksheetName: string;
	 * }} config
	 * @param {(message?: any, ...args: any[]) => void} log
   * @returns {Promise<{ averageWeeklyCommits: number, lastWeekCommits: number, username: string }[]>}
   */
	async process({ averageRange, commitRange, end, spreadsheetId, userRange, worksheetName }, log = console.log) {
		const upTo = end ?? this._today();
		const oneWeekPrior = this._daysAgo(upTo, 7);
		const oneMonthPrior = this._daysAgo(upTo, 28);

		const users = await this.googleSheets.getUsernames(spreadsheetId, worksheetName, userRange);
		/** @type {number[]} */
		const lastWeekCommits = [];
		/** @type {number[]} */
		const averageWeeklyCommits = [];

		for (let index = 0; index < users.length; index++) {
			const username = users[index];
			log("Processing %d / %d", index + 1, users.length);
			const valid = username !== undefined && await this.github.validUsername(username);
			lastWeekCommits.push(valid ? await this.github.commitsBetween(username, oneWeekPrior, upTo) : NaN);
			if (averageRange) {
				averageWeeklyCommits.push(valid ? await this.github.commitsBetween(username, oneMonthPrior, upTo) / 4 : NaN);
			}
		}

		await this.googleSheets.updateCommits(spreadsheetId, worksheetName, commitRange, lastWeekCommits);
		if (averageRange) {
			await this.googleSheets.updateCommits(spreadsheetId, worksheetName, averageRange, averageWeeklyCommits);
		}

		return users.map((username, index) => ({
			averageWeeklyCommits: averageWeeklyCommits[index],
			lastWeekCommits: lastWeekCommits[index],
			username,
		}));
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
