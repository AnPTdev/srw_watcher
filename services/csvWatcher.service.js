"use strict";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const Fs = require('fs');
const _ = require('lodash');
const path = require('path');
const FsWatch = require('../libs/recursive-watch');
module.exports = {
	name: "csvWatcher",

	/**
	 * Settings
	 */
	settings: {
		csvReadFolder: process.env.CSV_READFOLDER || '',
		csvFilter: new RegExp(process.env.CSV_FILTERS || "^.*\.csv$"),
		$dependencyTimeout: 30000, // Default: 0 - no timeout,
		servicename: process.env.CSV_SERVICENAME || '',
		csvEvent: process.env.CSV_EVENT || '',
	},

	//Using for assign watch and to do unwatch after stopped()
	unWatch: null,


	/**
	 * Dependencies
	 */
	dependencies: [
	],

	/**
	 * Actions
	 */
	actions: {

	},

	/**
	 * Events
	 */
	events: {
	},

	/**
	 * Methods
	 */
	methods: {
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.watcher;
	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {
		//Start watching over the folder
		// this.watchFolder(this.broker);

		// Detect if tmpReadFolder existed
		var that = this;
		console.log("Preparing ... ");
		if (Fs.existsSync(that.settings.csvReadFolder)) {

			console.log("Ready to serve ... ");
			try {
				Fs.promises
					.open(that.settings.csvReadFolder, "r")
					.then((result) => {
						that.watcher = Fs.watch(that.settings.csvReadFolder, async function (event, filename) {
								let _path = path.join(that.settings.csvReadFolder, filename)
								if (Fs.existsSync(_path)) {
									var fstat = Fs.statSync(_path);
									if (fstat.size > 0) {
										that.logger.info('something changed with', filename);
										that.broker.emit(that.settings.csvEvent, {
											watcher: that.settings.servicename
										});
									}
								}
							

						})
					})
					.catch((err) => {
						return setTimeout(that._watchFolder, 3000);
					})
				// that.unWatch = FsWatch(that.settings.csvReadFolder, async function (filename) {

				// 	// Only send emit if the file existed

				// 	// console.log("match:" + filename + " --> " + filename.match(that.settings.tmpCsvFilter));

				// 	if (Fs.existsSync(filename) && filename.match(that.settings.csvFilter)) {
				// 		var fstat = Fs.statSync(filename);
				// 		if (fstat.size > 0) {
				// 			that.logger.info('something changed with', filename);
				// 			that.broker.emit(that.settings.csvEvent, {
				// 				watcher: that.settings.servicename
				// 			});
				// 		}
				// 	}

				// });
			} catch (error) {
				console.log(error)
			}
		} else {
			console.log("The folder: " + that.settings.csvReadFolder + " does not existed!");
			process.exit(1);
		}
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {
		// if (_.isFunction(this.unWatch)) this.unWatch();
		this.logger.info('watcher closed!')
		this.watcher.close()
	}
};
