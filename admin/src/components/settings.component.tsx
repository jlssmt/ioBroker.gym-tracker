import I18n from '@iobroker/adapter-react/i18n';
import { Grid } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import React, { ReactElement } from 'react';
import { StudioInterface, StudiosInterface } from '../../../src/types/studio.interface';
import StudioService from '../services/studio.service';

interface SettingsProps {
    native: ioBroker.AdapterConfig;
    studioService: StudioService;

    onChange: (attr: string, value: StudioInterface[] | string) => void;
}

interface SettingsState {
    studios: StudiosInterface;
}

class SettingsComponent extends React.Component<SettingsProps, SettingsState> {
    private searchTimeout: NodeJS.Timeout = {} as NodeJS.Timeout;
    private allStudios: StudiosInterface;

    constructor(props: SettingsProps) {
        super(props);
        this.allStudios = {
            fitxStudios: [],
            fitnessFirstStudios: [],
            rsgStudios: [],
        };

        this.state = {
            studios: this.allStudios,
        };

        this.fetchData();
    }

    private fetchData() {
        this.props.studioService.getStudiosFromBackend(this.props.native.checkedStudios)
            .then(data => {
                this.allStudios = data;
                this.setState(state => ({
                    ...state,
                    studios: this.allStudios,
                }));
            })
            .catch(error => console.log(error));
    }

    private handleSearch(value: string) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.setState(state => ({
                ...state,
                studios: {
                    rsgStudios: this.allStudios.rsgStudios.filter(studio => studio.name.toLowerCase().includes(value.toLowerCase())),
                    fitnessFirstStudios: this.allStudios.fitnessFirstStudios.filter(studio => studio.name.toLowerCase().includes(value.toLowerCase())),
                    fitxStudios: this.allStudios.fitxStudios.filter(studio => studio.name.toLowerCase().includes(value.toLowerCase())),
                },
            }));
        }, 300);
    }

    private handleCheckboxChange(studio: StudioInterface, value: boolean) {
        const previousStudios: StudioInterface[] = this.props.native.checkedStudios;
        if (value) {
            // already in checked studios
            if (previousStudios.some(currentStudio => currentStudio.id === studio.id)) return;

            this.props.onChange('checkedStudios', ''); // this is a workaround for deep change detection of onChange function
            this.props.onChange(
                'checkedStudios',
                [
                    ...previousStudios,
                    {
                        id: studio.id,
                        name: studio.name,
                    },
                ],
            );
        } else {
            this.props.onChange('checkedStudios', ''); // this is a workaround for deep change detection of onChange function
            this.props.onChange('checkedStudios', previousStudios.filter(currentStudio => currentStudio.id !== studio.id));
        }
    }

    private renderStudioGridItem(studio: StudioInterface) {
        return (
            <Grid
                item
                xl={2} lg={3} md={4} sm={6} xs={12}
                key={`studio-checkbox-${studio.id}`}>
                <FormControlLabel
                    control={
                        <Checkbox
                            color="primary"
                            defaultChecked={studio.checked}
                            onChange={(e) => this.handleCheckboxChange(studio, e.target.checked)}
                        />
                    }
                    label={studio.name}
                />
            </Grid>
        );
    }

    private dataAvailable() {
        return (this.state.studios.rsgStudios && this.state.studios.rsgStudios.length > 0)
            || (this.state.studios.fitnessFirstStudios && this.state.studios.fitnessFirstStudios.length > 0)
            || (this.state.studios.fitxStudios && this.state.studios.fitxStudios.length > 0);
    }

    render(): ReactElement {
        return (
            <div style={{ padding: 20, height: 'calc(100% - 50px)' }}>
                {!this.dataAvailable() &&
                <>
                    {setTimeout(() => this.fetchData(), 1000) && I18n.t('noDataProvided')}
                </>
                }
                {this.dataAvailable() &&
                <>
                    <TextField
                        label={I18n.t('searchStudio')}
                        type="search"
                        onChange={(e) => this.handleSearch(e.target.value)}
                        fullWidth
                    />
                    <Grid container style={{ height: 'calc(100% - 28px)', overflow: 'scroll' }}>
                        {this.state.studios.rsgStudios.map(studio => this.renderStudioGridItem(studio))}
                        {this.state.studios.fitnessFirstStudios.map(studio => this.renderStudioGridItem(studio))}
                        {this.state.studios.fitxStudios.map(studio => this.renderStudioGridItem(studio))}
                    </Grid>
                </>
                }
            </div>
        );
    }
}

export default SettingsComponent;
