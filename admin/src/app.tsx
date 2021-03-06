import React from 'react';
import { Theme, withStyles } from '@material-ui/core/styles';

import GenericApp from '@iobroker/adapter-react/GenericApp';
import SettingsComponent from './components/settings.component';
import { GenericAppProps, GenericAppSettings } from '@iobroker/adapter-react/types';
import { StyleRules } from '@material-ui/core/styles';
import StudioService from './services/studio.service';

const styles = (_theme: Theme): StyleRules => ({
    root: {},
});

class App extends GenericApp {
    constructor(props: GenericAppProps) {
        const extendedProps: GenericAppSettings = {
            ...props,
            encryptedFields: [],
            translations: {
                'en': require('./i18n/en.json'),
                'de': require('./i18n/de.json'),
                'ru': require('./i18n/ru.json'),
                'pt': require('./i18n/pt.json'),
                'nl': require('./i18n/nl.json'),
                'fr': require('./i18n/fr.json'),
                'it': require('./i18n/it.json'),
                'es': require('./i18n/es.json'),
                'pl': require('./i18n/pl.json'),
                'zh-cn': require('./i18n/zh-cn.json'),
            },
        };
        super(props, extendedProps);
    }

    onConnectionReady(): void {
        // executed when connection is ready
    }

    render() {
        if (!this.state.loaded) {
            return super.render();
        }

        return (
            <div className="App">
                <SettingsComponent
                    native={this.state.native}
                    studioService={new StudioService(this.socket, this.instance)}
                    onChange={(attr, value) => this.updateNativeValue(attr, value)} />
                {this.renderError()}
                {this.renderToast()}
                {this.renderSaveCloseButtons()}
            </div>
        );
    }
}

export default withStyles(styles)(App);
