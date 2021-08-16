/*
 * Created with @iobroker/create-adapter v1.34.1
 */
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';
import { StudioInterface } from './types/studio.interface';
import fitx from './data/fitx.json';

class GymTracker extends utils.Adapter {

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
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
    private async onReady(): Promise<void> {

        this.log.debug(JSON.stringify(this.config.checkedStudios));

        for (const studio of this.config.checkedStudios || []) {
            switch (true) {
                case studio.name.includes('FitnessFirst'):
                    await axios.get(`https://www.fitnessfirst.de/club/api/checkins/${studio.id}`)
                        .then(response => response.data.data)
                        .then(data => Math.round(data.check_ins * 100 / data.allowed_people))
                        .then(data => {
                            return this.extendAdapterObjectAsync(studio.id.toString(), studio.name, 'channel')
                                .then(async () => {
                                    await this.createAdapterStateIfNotExistsAsync(`${studio.id}.utilization`, 'current utilization', 'number')
                                        .then(() => this.setStateAsync(`${studio.id}.utilization`, data, true));
                                });
                        })
                        .catch(error => this.log.error(error));
                    break;

                case studio.name.includes('FitX'):
                    await axios.get(`https://www.fitx.de/fitnessstudio/${studio.id}/workload`)
                        .then(response => response.data)
                        .then(data => JSON.parse(data).workload.percentage)
                        .then(data => {
                            return this.extendAdapterObjectAsync(studio.id.toString(), studio.name, 'channel')
                                .then(async () => {
                                    await this.createAdapterStateIfNotExistsAsync(`${studio.id}.utilization`, 'current utilization', 'number')
                                        .then(() => this.setStateAsync(`${studio.id}.utilization`, data, true));
                                });
                        })
                        .catch(error => this.log.error(error));
                    break;

                default:
                    await axios.get(`https://www.mcfit.com/de/auslastung/antwort/request.json?tx_brastudioprofilesmcfitcom_brastudioprofiles%5BstudioId%5D=${studio.id}`)
                        .then(response => response.data.items)
                        .then(data => data.find((hour: any) => hour.isCurrent).percentage)
                        .then(result => {
                            return this.extendAdapterObjectAsync(studio.id.toString(), studio.name, 'channel')
                                .then(async () => {
                                    await this.createAdapterStateIfNotExistsAsync(`${studio.id}.utilization`, 'current utilization', 'number')
                                        .then(() => this.setStateAsync(`${studio.id}.utilization`, result, true));
                                });
                        })
                        .catch(error => this.log.error(error));
            }
        }

        await this.createAdapterStateIfNotExistsAsync('data', 'data used in backend', 'boolean')
            .then(() => GymTracker.getFitnessFirstStudios())
            .then((allFitnessFirstStudios) => allFitnessFirstStudios.reduce((acc: StudioInterface[], studio) => [...acc, {
                ...studio,
                name: `FitnessFirst ${studio.name}`,
            }], []))
            .then(allFitnessFirstStudios => this.extendObjectAsync('data', { native: { allFitnessFirstStudios } }))
            .catch(error => this.log.error(error));

        await this.createAdapterStateIfNotExistsAsync('data', 'data used in backend', 'boolean')
            .then(() => GymTracker.getRsgStudios())
            .then(allRsgStudios => this.extendObjectAsync('data', { native: { allRsgStudios } }))
            .catch(error => this.log.error(error));

        await this.createAdapterStateIfNotExistsAsync('data', 'data used in backend', 'boolean')
            .then(() => fitx)
            .then((allFitnessFirstStudios) => allFitnessFirstStudios.reduce((acc: StudioInterface[], studio) => [...acc, {
                ...studio,
                name: `FitX ${studio.name}`,
            }], []))
            .then(allFitxStudios => this.extendObjectAsync('data', { native: { allFitxStudios } }))
            .catch(error => this.log.error(error));

        this.terminate ? this.terminate('All data handled, adapter stopped until next scheduled moment') : process.exit();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private onUnload(callback: () => void): void {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    private createAdapterStateIfNotExistsAsync(id: string, name: string, type: ioBroker.CommonType): ioBroker.SetObjectPromise {
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

    private extendAdapterObjectAsync(id: string, name: string, type: 'channel' | 'folder'): ioBroker.SetObjectPromise {
        return this.extendObjectAsync(id, {
            type: type,
            common: {
                name: name,
            },
            native: {},
        });
    }

    private static getRsgStudios(): Promise<StudioInterface[]> {
        return axios.get('https://rsg-group.api.magicline.com/connect/v1/studio?studioTags=AKTIV-391B8025C1714FB9B15BB02F2F8AC0B2')
            .then(response => response.data)
            .then(data => data.reduce((acc: StudioInterface[], studio: any) => [...acc, {
                'id': studio.id,
                'name': studio.studioName,
            }], []))
            .then((studios: StudioInterface[]) => studios.sort((a, b) => a.name > b.name ? 1 : -1));
    }

    private static getFitnessFirstStudios(): Promise<StudioInterface[]> {
        return axios.get(`https://www.fitnessfirst.de/api/v1/node/club_page?include=field_features,field_opening_times&filter[status][value]=1&page[limit]=40&sort=title`)
            .then(response => response.data.data.reduce((acc: StudioInterface[], studio: any) => [...acc, {
                id: studio.attributes.field_easy_solution_club_id,
                name: studio.attributes.title,
            }], []));
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new GymTracker(options);
} else {
    // otherwise start the instance directly
    (() => new GymTracker())();
}
