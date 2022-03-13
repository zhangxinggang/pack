const path = require("path");
const isPro = process.env.NODE_ENV === "production";

module.exports = function (conf) {
    const { output } = conf;
    let outputObj = {
        path: path.join(process.cwd(), "dist"),
        filename: "[name].[chunkhash].js",
        chunkFilename: "[name].[contenthash].js",
        publicPath: isPro ? "./" : "/",
        clean: true,
    };
    if (typeof output == "object") {
        Object.assign(outputObj, output);
    } else if (typeof output == "string") {
        outputObj.path = output;
    }
    return outputObj;
};
