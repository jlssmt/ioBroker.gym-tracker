"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Created with @iobroker/create-adapter v1.34.1
 */
const utils = __importStar(require("@iobroker/adapter-core"));
const axios_1 = __importDefault(require("axios"));
class Mcfit extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'mcfit',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        this.log.debug('start');
        for (const studio of this.config.checkedStudios || []) {
            axios_1.default.get(`https://www.mcfit.com/de/auslastung/antwort/request.json?tx_brastudioprofilesmcfitcom_brastudioprofiles%5BstudioId%5D=${studio.id}`)
                .then(response => response.data.items)
                .then(result => {
                return this.extendAdapterObjectAsync(studio.id.toString(), studio.name, 'channel')
                    .then(() => {
                    for (const hour of result) {
                        this.extendAdapterObjectAsync(`${studio.id}.${hour.startTime.slice(0, 2)}`, hour.startTime, 'folder')
                            .then(() => {
                            for (const key of Object.keys(hour)) {
                                this.createAdapterStateIfNotExistsAsync(`${studio.id}.${hour.startTime.slice(0, 2)}.${key}`, key, typeof hour[key] === 'number' ? 'number' : 'string');
                                this.setState(`${studio.id}.${hour.startTime.slice(0, 2)}.${key}`, hour[key], true);
                            }
                        });
                    }
                });
            })
                .catch(error => this.log.error(error));
        }
        this.log.debug('end');
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);
            callback();
        }
        catch (e) {
            callback();
        }
    }
    createAdapterStateIfNotExistsAsync(id, name, type) {
        return this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: {
                name: name,
                type: type,
                role: 'state',
                read: true,
                write: false,
            },
            native: {},
        });
    }
    extendAdapterObjectAsync(id, name, type) {
        return this.extendObjectAsync(id, {
            type: type,
            common: {
                name: name,
            },
            native: {},
        });
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Mcfit(options);
}
else {
    // otherwise start the instance directly
    (() => new Mcfit())();
}
//# sourceMappingURL=main.js.map