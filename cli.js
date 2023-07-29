const index = require(".");

(async () => {
    try {
        await index.fillSpreadsheet();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})()