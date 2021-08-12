/*
 * Created with @iobroker/create-adapter v1.34.1
 */
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';

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
        this.log.debug('start');

        for (const studio of this.config.checkedStudios || []) {
            axios.get(`https://www.mcfit.com/de/auslastung/antwort/request.json?tx_brastudioprofilesmcfitcom_brastudioprofiles%5BstudioId%5D=${studio.id}`)
                .then(response => response.data.items)
                .then(result => {
                    return this.extendAdapterObjectAsync(studio.id.toString(), studio.name, 'channel')
                        .then(() => {
                            this.createAdapterStateIfNotExistsAsync(`${studio.id}.utilization`, 'current utilization', 'number')
                                .then(() => this.setStateAsync(`${studio.id}.utilization`, result.find((hour: any) => hour.isCurrent).percentage));
                        });
                })
                .catch(error => this.log.error(error));
        }

        this.log.debug('end');
        this.terminate ? this.terminate('All data handled, adapter stopped until next scheduled moment.') : process.exit();
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

    createAdapterStateIfNotExistsAsync(id: string, name: string, type: ioBroker.CommonType): ioBroker.SetObjectPromise {
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

    extendAdapterObjectAsync(id: string, name: string, type: 'channel' | 'folder'): ioBroker.SetObjectPromise {
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
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new GymTracker(options);
} else {
    // otherwise start the instance directly
    (() => new GymTracker())();
}
