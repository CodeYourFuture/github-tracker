const index = require(".");

(async () => {
    try {
        await index.fillSheet();
        process.exit(0);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
})()