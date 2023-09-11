/**
 * moleculer.config.js as default config
 * .env for default settings
 */

"use strict";
const fs = require('fs');
const _ = require('lodash');
const { Runner } = require("moleculer");
const path = require("path");
const runner = new Runner();
require('dotenv').config();

var inputArgs = process.argv;

var runArgs = [
				inputArgs[0], 
				__filename,
				"--config",
				path.join(__dirname, "moleculer.config.js"),
			];

var idx = _.indexOf(inputArgs, "--repl");
if (idx > 0) runArgs.push("--repl");

idx = _.indexOf(inputArgs, "--envfile");

if (idx > 0) {
	var envFile = path.join("./", inputArgs[idx+1]);
	if (fs.existsSync(envFile)) {
		runArgs.push("--envfile");
		runArgs.push(envFile);
	} else {
		console.log("envfile: "+ envFile + " does not existed!");
		process.exit(1);
	}
}

idx = _.indexOf(inputArgs, "--instances");
if (idx > 0) {
	var instances = parseInt(inputArgs[idx+1]);
	if (_.isNumber(instances)) {
		runArgs.push("--instances");
		runArgs.push(instances);
	} else {
		console.log("instances: error number of instances!");
		process.exit(1);
	}
}

runArgs.push(path.join(__dirname, "../services"));

console.log("Starting apps ...");

runner.start(runArgs).catch(err => {
	console.error(err);
	process.exit(1);
});
