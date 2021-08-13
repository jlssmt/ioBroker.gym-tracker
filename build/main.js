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
const fitx_json_1 = __importDefault(require("./data/fitx.json"));
class GymTracker extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'gym-tracker',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        for (const studio of this.config.checkedStudios || []) {
            switch (true) {
                case studio.name.includes('FitnessFirst'):
                    axios_1.default.get(`https://www.fitnessfirst.de/club/api/checkins/${studio.id}`)
                        .then(response => response.data.data)
                        .then(data => Math.round(data.check_ins * 100 / data.allowed_people))
                        .then(data => {
                        return this.extendAdapterObjectAsync(studio.id.toString(), studio.name, 'channel')
                            .then(() => {
                            this.createAdapterStateIfNotExistsAsync(`${studio.id}.utilization`, 'current utilization', 'number')
                                .then(() => this.setStateAsync(`${studio.id}.utilization`, data, true));
                        });
                    })
                        .catch(error => this.log.error(error));
                    break;
                case studio.name.includes('FitX'):
                    axios_1.default.get(`https://www.fitx.de/fitnessstudio/${studio.id}/workload`)
                        .then(response => response.data)
                        .then(data => JSON.parse(data).workload.percentage)
                        .then(data => {
                        return this.extendAdapterObjectAsync(studio.id.toString(), studio.name, 'channel')
                            .then(() => {
                            this.createAdapterStateIfNotExistsAsync(`${studio.id}.utilization`, 'current utilization', 'number')
                                .then(() => this.setStateAsync(`${studio.id}.utilization`, data, true));
                        });
                    })
                        .catch(error => this.log.error(error));
                    break;
                default:
                    axios_1.default.get(`https://www.mcfit.com/de/auslastung/antwort/request.json?tx_brastudioprofilesmcfitcom_brastudioprofiles%5BstudioId%5D=${studio.id}`)
                        .then(response => response.data.items)
                        .then(data => data.find((hour) => hour.isCurrent).percentage)
                        .then(result => {
                        return this.extendAdapterObjectAsync(studio.id.toString(), studio.name, 'channel')
                            .then(() => {
                            this.createAdapterStateIfNotExistsAsync(`${studio.id}.utilization`, 'current utilization', 'number')
                                .then(() => this.setStateAsync(`${studio.id}.utilization`, result, true));
                        });
                    })
                        .catch(error => this.log.error(error));
            }
        }
        this.createAdapterStateIfNotExistsAsync('data', 'data used in backend', 'boolean')
            .then(() => GymTracker.getFitnessFirstStudios())
            .then((allFitnessFirstStudios) => allFitnessFirstStudios.reduce((acc, studio) => [...acc, {
                ...studio,
                name: `FitnessFirst ${studio.name}`,
            }], []))
            .then(allFitnessFirstStudios => this.extendObjectAsync('data', { native: { allFitnessFirstStudios } }))
            .catch(error => this.log.error(error));
        this.createAdapterStateIfNotExistsAsync('data', 'data used in backend', 'boolean')
            .then(() => GymTracker.getRsgStudios())
            .then(allRsgStudios => this.extendObjectAsync('data', { native: { allRsgStudios } }))
            .catch(error => this.log.error(error));
        this.createAdapterStateIfNotExistsAsync('data', 'data used in backend', 'boolean')
            .then(() => fitx_json_1.default)
            .then((allFitnessFirstStudios) => allFitnessFirstStudios.reduce((acc, studio) => [...acc, {
                ...studio,
                name: `FitX ${studio.name}`,
            }], []))
            .then(allFitxStudios => this.extendObjectAsync('data', { native: { allFitxStudios } }))
            .catch(error => this.log.error(error));
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
    static getRsgStudios() {
        return axios_1.default.get('https://rsg-group.api.magicline.com/connect/v1/studio?studioTags=AKTIV-391B8025C1714FB9B15BB02F2F8AC0B2')
            .then(response => response.data)
            .then(data => data.reduce((acc, studio) => [...acc, {
                'id': studio.id,
                'name': studio.studioName,
            }], []))
            .then((studios) => studios.sort((a, b) => a.name > b.name ? 1 : -1));
    }
    static getFitnessFirstStudios() {
        return axios_1.default.get(`https://www.fitnessfirst.de/api/v1/node/club_page?include=field_features,field_opening_times&filter[status][value]=1&page[limit]=40&sort=title`)
            .then(response => response.data.data.reduce((acc, studio) => [...acc, {
                id: studio.attributes.field_easy_solution_club_id,
                name: studio.attributes.title,
            }], []));
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new GymTracker(options);
}
else {
    // otherwise start the instance directly
    (() => new GymTracker())();
}
//# sourceMappingURL=main.js.map