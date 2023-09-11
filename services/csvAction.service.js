"use strict";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const Fs = require('fs');
const _ = require('lodash');
const path = require('path');
const { MoleculerError } = require("moleculer").Errors;

module.exports = {
    name: process.env.CSV_SERVICENAME,

    /**
     * Settings
     */
    settings: {
        csvReadFolder: process.env.CSV_READFOLDER || '',
        csvFilter: new RegExp(process.env.CSV_FILTERS || "^.*\.csv$"),
        serviceName: process.env.CSV_SERVICENAME || '',
        csvDelay: process.env.CSV_READDELAY || 3000,
    },


    /**
     * Dependencies
     */
    dependencies: [
    ],

    /**
     * Actions
     */
    actions: {
        getFilterList: {
            params: {
                limit: { type: 'number', optional: true, default: 100 }
            },
            async handler(ctx) {
                return this._getFilterList(ctx.params.limit)
            }
        },

        readDataFromFilteredFile: {
            params: {
                folder: { type: 'string' },
                filename: { type: 'string' },
            },
            async handler(ctx) {
                return this._readDataFromFilteredFile(ctx.params.folder, ctx.params.filename)
            }
        },

        removeFilteredFiles: {
            params: {
                rows: { type: 'number', optional: true, default: 0 },
                folder: { type: 'string', optional: true },
                data: { type: 'array', optional: true, default: [] },
            },
            async handler(ctx) {
                return this._removeFilteredFiles(ctx.params.folder, ctx.params.data)
            }
        }
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
        /**
        * *Get file list in a folder
        *
        * @param {number} limit
        * 
        * @return {Object}
        * 
        * @implements getFilterList
        * 
        */
        async _getFilterList(limit) {
            let _dirStack = [this.settings.csvReadFolder]
            let data = [];
            var folder

            while (_dirStack.length > 0 && data < limit) {
                let path = _dirStack.pop()
                await Fs.promises
                    .readdir(path, { withFileTypes: true })
                    .then(_fileList => {
                        _fileList.every(element => {
                            if (data.length == limit) return false;
                            if (element.isFile() && this.settings.csvFilter.test(element.name)) {
                                folder = path
                                data.push(element.name)
                                return true
                            }
                            if (element.isDirectory()) {
                                _dirStack.push(path + element.name)
                                console.log('pushing ' + path + element.name + ' to DirStack')
                                return true
                            }
                        })

                    }).catch(err => new MoleculerError(err.message, err.code, err.type, err.data))
            }

            return { status: 200, folder: folder, data: data, rows: data.length }
        },


        /**
        * *Read the file and return a stream
        *
        * @param {string} folder
        * @param {string} filename
        * 
        * @return {Stream} readStream
        * 
        * @implements readDataFromFilteredFile
        * 
        */
        async _readDataFromFilteredFile(folder, filename,) {
            var stats = Fs.statSync(path.join(folder, filename))
            if (stats.size > 0 || stats.atimeMs > stats.ctimeMs) {
                return Fs.promises
                    .access(path.join(folder, filename))
                    .then(async result => {
                        var reader = Fs.createReadStream(path.join(folder, filename))
                        if(reader == null){console.log('data is already read')}
                        reader.on('error', function (err) {
                            console.log(err)
                        })
                        return reader
                    })
                    .catch(err => new MoleculerError(err.message, err.code, err.type, err.data))
            }

        },

        /**
        * *Remove a list of file in a folder
        *
        * @param {number} rows
        * @param {string} folder
        * @param {array} data
        * 
        * @return {Object} Respone
        * 
        * @implements removeFilteredFiles
        * 
        */
        async _removeFilteredFiles(folder, data) {
            let messages = [];
            var count = 0;
            if (!folder.startsWith(this.settings.csvReadFolder)) return { status: 801, message: 'The folder is not belong to ' + this.settings.csvReadFolder }

            for (const _filename of data) {
                if (!this.settings.csvFilter.test(_filename)) { messages.push(_filename + ": failed, errcode : " + 802) }
                else {
                    await Fs.promises
                        .unlink(path.join(folder, _filename))
                        .then(result => {
                            this.logger.info('deleted', path.join(folder, _filename))
                            messages.push(_filename + " delete completed");
                        })
                        .catch(err => {
                            this.logger.info('something went wrong ?')
                            this.logger.info(err)
                            // messages.push(_filename + ": failed, errcode : " + err.code)
                        }
                        )
                }
                count++;
            }

            return { status: 200, messages: messages, filecount: count }
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
    },

    /**
     * Service started lifecycle event handler
     */
    async started() {
    },

    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {
    }
};
