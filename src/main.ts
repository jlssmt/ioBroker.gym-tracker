/*
 * Created with @iobroker/create-adapter v1.34.1
 */
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';

class Mcfit extends utils.Adapter {

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
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
    private async onReady(): Promise<void> {
        this.log.debug('start');

        for (const studio of this.config.checkedStudios || []) {
            axios.get(`https://www.mcfit.com/de/auslastung/antwort/request.json?tx_brastudioprofilesmcfitcom_brastudioprofiles%5BstudioId%5D=${studio.id}`)
                .then(response => response.data.items)
                .then(result => {
                    this.createAdapterChannel(studio.id.toString(), studio.name);
                    console.log(result);
                    return result;
                })
                .then(result => {
                    for (const hour of result) {
                        this.createAdapterFolder(`${studio.id}.${hour.startTime.slice(0, 2)}`, hour.startTime);
                        for (const key of Object.keys(hour)) {
                            this.createAdapterState(`${studio.id}.${hour.startTime.slice(0, 2)}.${key}`, key, typeof hour[key] === 'number' ? 'number' : 'string');
                            this.setState(`${studio.id}.${hour.startTime.slice(0, 2)}.${key}`, hour[key], true);
                        }
                    }
                })
                .catch(error => this.log.error(error));
        }

        this.log.debug('end');
        this.terminate();
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

    createAdapterState(id: string, name: string, type: ioBroker.CommonType): ioBroker.SetObjectPromise {
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

    createAdapterChannel(id: string, name: string): void {
        this.extendObject(id, {
            type: 'channel',
            common: {
                name: name,
            },
            native: {},
        });
    }

    createAdapterFolder(id: string, name: string): void {
        this.extendObject(id, {
            type: 'folder',
            common: {
                name: name,
            },
            native: {},
        });
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Mcfit(options);
} else {
    // otherwise start the instance directly
    (() => new Mcfit())();
}
