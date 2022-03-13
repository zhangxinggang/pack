const path = require("path");
module.exports = {
    output: path.resolve(process.cwd(), "dist"),
    entry: {
        index: path.resolve(__dirname, "./src/pages/index.js"),
    },
};
