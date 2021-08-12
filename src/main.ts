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

        for (const studioId of this.config.checkedStudios || []) {
            axios.get(`https://www.mcfit.com/de/auslastung/antwort/request.json?tx_brastudioprofilesmcfitcom_brastudioprofiles%5BstudioId%5D=${studioId}`)
                .then(response => response.data.items)
                .catch(error => this.log.error(error));
        }

        this.log.debug('end');
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
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Mcfit(options);
} else {
    // otherwise start the instance directly
    (() => new Mcfit())();
}
