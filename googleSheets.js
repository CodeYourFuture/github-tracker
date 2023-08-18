import { auth, sheets } from "@googleapis/sheets";

export class GoogleSheets {
	/**
   * @param {object} credentials
   * @returns {GoogleSheets}
   */
	static fromCredentials(credentials) {
		/** @type {any} - for some reason this doesn't typecheck */
		const googleAuth = auth.fromJSON(credentials);
		return new GoogleSheets(sheets({ auth: googleAuth, version: "v4" }));
	}

	/**
   * @param {import("@googleapis/sheets").sheets_v4.Sheets} service
   */
	constructor(service) {
		this.service = service;
	}

	/**
   * @param {string} spreadsheetId
   * @param {string} worksheetName
   * @param {string} userRange
   * @returns {Promise<string[]>}
   */
	async getUsernames(spreadsheetId, worksheetName, userRange) {
		const { data } = await this.service.spreadsheets.values.get({
			range: `${worksheetName}!${userRange}`,
			spreadsheetId,
		});
		return data?.values?.map(([username]) => username) ?? [];
	}

	/**
	 * @param {string} spreadsheetId
	 * @param {string} worksheetName
	 * @param {string} commitRange
	 * @param {number[]} data
	 * @returns {Promise<void>}
	 */
	async updateCommits(spreadsheetId, worksheetName, commitRange, data) {
		await this.service.spreadsheets.values.update({
			range: `${worksheetName}!${commitRange}`,
			requestBody: { values: data.map((value) => [isNaN(value) ? "#N/A" : value]) },
			spreadsheetId,
			valueInputOption: "USER_ENTERED",
		});
	}
}
