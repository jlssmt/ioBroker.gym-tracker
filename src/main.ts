/*
 * Created with @iobroker/create-adapter v1.34.1
 */
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';
import { StudioInterface } from './types/studio.interface';

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

        const studios: StudioInterface[] = await axios.get('https://rsg-group.api.magicline.com/connect/v1/studio?studioTags=AKTIV-391B8025C1714FB9B15BB02F2F8AC0B2')
            .then(response => response.data)
            .then(data => data.reduce((acc: StudioInterface[], studio: any) =>
                [...acc, { 'id': studio.id, 'name': studio.studioName }], [])
            )
            .catch(error => this.log.error(error));

        const id = studios.filter(studio => studio.name.includes('Bamberg'))[0].id;
        await axios.get(`https://www.mcfit.com/de/auslastung/antwort/request.json?tx_brastudioprofilesmcfitcom_brastudioprofiles%5BstudioId%5D=${id}`)
            .then(response => response.data.items)
            .then(response => console.log(response))
            .catch(error => this.log.error(error));

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
