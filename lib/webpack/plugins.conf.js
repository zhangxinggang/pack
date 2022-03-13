const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const isPro = process.env.NODE_ENV === "production";
let cmdArg = require("minimist")(process.argv.slice(2));
function htmlTemplate(entry) {
    let htmlArr = [];
    let entrys = Object.keys(entry);
    entrys.forEach(async (item) => {
        let entryItem = entry[item];
        let entryType = Object.prototype.toString.call(entryItem);
        let template = "";
        let chunks = [item, "chunk-vendors", "chunk-common"];
        if (entryItem.dependOn) {
            let dependOnType = typeof entryItem.dependOn;
            if (dependOnType === "object") {
                chunks = chunks.concat(entryItem.dependOn);
            } else {
                chunks.unshift(entryItem.dependOn);
            }
        }
        let filename = `${item}.html`;
        if (entryType === "[object Array]") {
            template = path.resolve(entryItem[0], "../index.html");
        } else if (entryType === "[object Object]") {
            let entryHtml = entryItem["import"];
            let entryItemImportType = Object.prototype.toString.call(entryHtml);
            if (entryItemImportType === "[object Array]") {
                entryHtml = entryHtml[0];
            }
            template = entryItem.template || path.resolve(entryHtml, "../index.html");
            chunks = entryItem.chunks || chunks;
            delete entryItem.template;
        } else {
            template = path.resolve(entryItem, "../index.html");
        }
        let htmlPluginParams = null;
        try {
            fs.accessSync(template);
            htmlPluginParams = { chunks, filename, template };
        } catch (err) {
            template = path.resolve(process.cwd(), "public/index.html");
            try {
                fs.accessSync(template);
                htmlPluginParams = { chunks, filename, template };
            } catch (err) {}
        }
        htmlPluginParams && htmlArr.push(new HtmlWebpackPlugin(htmlPluginParams));
    });
    return htmlArr;
}
function dealEntry(conf) {
    let { entry } = conf;
    // 本地调试优先，往后执行的环境变量无法覆盖前面的
    let processEnv = {};
    let getEnv = (file) => {
        try {
            let env = dotenv.config({ path: path.join(process.cwd(), file) });
            processEnv = { ...processEnv, ...(env.parsed || {}) };
        } catch (e) {}
    };
    if (!isPro) {
        getEnv(`.env.local`);
        getEnv(`.env.${process.env.NODE_ENV}.local`);
    }
    getEnv(".env");
    getEnv(`.env.${process.env.NODE_ENV}`);
    let plugins = [
        new webpack.DefinePlugin({
            "process.env": JSON.stringify(processEnv),
        }),
        new webpack.ProgressPlugin(),
    ];
    if (eval(cmdArg.analyzer)) {
        let { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        let analyzer = global.pack.analyzer.find((item) => !item.haveUse);
        analyzer.haveUse = true;
        plugins.push(
            new BundleAnalyzerPlugin({
                openAnalyzer: false,
                analyzerPort: analyzer.port,
            })
        );
    }
    const entryPlugins = htmlTemplate(entry);
    if (entryPlugins.length) {
        plugins = plugins.concat([
            ...entryPlugins,
            new MiniCssExtractPlugin({
                filename: isPro ? "[name].[contenthash:8].css" : "[name].css",
                chunkFilename: isPro ? "public/css/[id].[hash].css" : "public/css/[id].css",
            }),
            new VueLoaderPlugin(),
        ]);
    }
    return plugins;
}
module.exports = dealEntry;
