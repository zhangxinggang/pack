global.pack = {};
const { merge, mergeWithRules } = require("webpack-merge");
const portfinder = require("portfinder");
const path = require("path");
const defaultConf = require("../config");
const regAddI = (arr) => {
    arr = arr || [];
    arr.forEach((item) => {
        item["test"] = new RegExp(item["test"], "i");
    });
};
const beforeGenerateConf = () => {
    const portfinderFun = (initPort) => {
        return new Promise((resolve) => {
            portfinder.getPort(
                {
                    port: initPort,
                },
                (err, port) => {
                    if (err) {
                        return portfinderFun(initPort + 1);
                    } else {
                        !global.pack.analyzer && (global.pack.analyzer = []);
                        global.pack.analyzer.push({
                            port: port,
                            haveUse: false,
                        });
                        resolve();
                    }
                }
            );
        });
    };
    return new Promise((resolve) => {
        portfinderFun(8888).then(resolve);
    });
};
module.exports = (pcf, argv) => {
    const isPro = process.env.NODE_ENV === "production";
    return new Promise((resolve) => {
        pcf = pcf || {};
        const vsType = Object.prototype.toString.call(pcf);
        const configClone = JSON.parse(JSON.stringify(defaultConf));
        let config = { ...configClone };
        if (vsType === "[object Object]") {
            pcf.entry && delete config.entry;
            config = [merge(config, pcf)];
        }
        let generateConf = (one) => {
            !one.module && (one.module = {});
            !one.module.rules && (one.module.rules = []);
            const moduleFun = require("./webpack/module.conf");
            const outputFun = require("./webpack/output.conf");
            const pluginsFun = require("./webpack/plugins.conf");
            const devServer = require("./webpack/devServer.conf");
            const resolve = require("./webpack/resolve.conf");
            const optimization = require("./webpack/optimization.conf");
            const defaultModule = moduleFun();
            regAddI(defaultModule.rules);
            regAddI(one.module.rules);
            let { rules } = mergeWithRules({
                rules: {
                    test: "match",
                    exclude: "replace",
                    use: "replace",
                },
            })(defaultModule, one.module);
            delete defaultModule.rules;
            delete one.module.rules;
            let conf = merge(
                {
                    context: path.resolve(__dirname, "../"),
                    mode: process.env.NODE_ENV,
                    devtool: isPro ? false : "eval-source-map",
                    module: defaultModule,
                    devServer: devServer,
                    resolve: resolve,
                    plugins: pluginsFun(one),
                    optimization: optimization,
                    performance: {
                        maxAssetSize: 10000000,
                        maxEntrypointSize: 1024 * 800,
                        hints: "warning",
                    },
                    stats: {
                        errorDetails: true,
                    },
                },
                {
                    ...one,
                    module: { rules },
                    output: outputFun(one),
                }
            );
            return conf;
        };
        beforeGenerateConf().then(() => {
            const webpackConf = config.map((item) => {
                return generateConf(item);
            });
            resolve(webpackConf);
        });
    });
};
