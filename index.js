const path = require("path");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const generateConf = require("./lib/webpack.config.js");
let cmdArg = require("minimist")(process.argv.slice(2));
module.exports = (pcf, arg) => {
    let args = { mode: "production", ...arg, ...cmdArg };
    args.mode = args.mode.toLowerCase();
    process.env.NODE_ENV = args.mode;
    let isPro = args.mode === "production";
    let openServer = isPro ? eval(args.server) : true;
    let runPack = (cb) => {
        generateConf(pcf, args).then((webpackConf) => {
            const compiler = webpack(webpackConf);
            if (openServer) {
                if (webpackConf.length > 1) {
                    console.warn("devServer use first config in the webpack config.");
                }
                const server = new WebpackDevServer(webpackConf[0].devServer, compiler);
                server.start().then(() => {
                    cb(webpackConf);
                });
            } else {
                compiler.run((err, stats) => {
                    if (err || stats.hasErrors()) {
                        console.error(err);
                    } else {
                        cb(webpackConf);
                    }
                });
            }
        });
    };
    let tasks = (config) => {
        let startElectron = () => {
            const electron = require("electron");
            const { spawn } = require("child_process");
            let electronProcess = null;
            let conf = {
                mode: config.mode,
                isPro: isPro,
                devServer: config.devServer,
                output: config.output,
            };
            let args = [path.join(__dirname, "./src/electron/main.js"), `--config= ${JSON.stringify(conf)}`];
            electronProcess = spawn(electron, args);
            electronProcess.stdout.on("data", (data) => {
                console.log(data.toString());
            });
            electronProcess.stderr.on("data", (data) => {
                console.error(`stderr: ${data}`);
            });
            electronProcess.on("close", (code) => {
                console.log(`child process exited with code ${code}`);
                process.exit();
            });
        };
        if (args.target === "electron" || (!args.target && config.target === "electron")) {
            startElectron();
        }
    };
    runPack(tasks);
};
