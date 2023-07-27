const { google } = require("googleapis");

const creds = require("./creds.json");

async function updateGitHub() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: creds.gcpKey,
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });
        const authClientObject = await auth.getClient();
        const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
        const spreadsheetId = "14_qFhVEdgBLXScjCHFySI6NFZMnT3l02bKDoGhxq4ZM";
    
        const readData = await googleSheetsInstance.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "GitHub!C2",
        })
    
        const username = readData.data.values[0][0];
    
        console.log(username);
    } catch (error) {
        console.log(error.message);
    }
}

updateGitHub();