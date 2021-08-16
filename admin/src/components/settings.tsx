import Connection from '@iobroker/adapter-react/Connection';
import I18n from '@iobroker/adapter-react/i18n';
import { Grid } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import TextField from '@material-ui/core/TextField';
import React from 'react';
import { StudioInterface } from '../../../src/types/studio.interface';

const styles = (): Record<string, CreateCSSProperties> => ({
    input: {
        marginTop: 0,
        minWidth: 400,
    },
    button: {
        marginRight: 20,
    },
    card: {
        maxWidth: 345,
        textAlign: 'center',
    },
    media: {
        height: 180,
    },
    column: {
        display: 'inline-block',
        verticalAlign: 'top',
        marginRight: 20,
    },
    columnLogo: {
        width: 350,
        marginRight: 0,
    },
    columnSettings: {
        width: 'calc(100% - 370px)',
    },
    controlElement: {
        //background: "#d2d2d2",
        marginBottom: 5,
    },
});

interface SettingsProps {
    classes: Record<string, string>;
    native: ioBroker.AdapterConfig;
    context: {
        socket: Connection;
        instance: number;
    }

    onChange: (attr: string, value: StudioInterface[] | string) => void;
}

interface SettingsState {
    rsgStudios: StudioInterface[];
    fitnessFirstStudios: StudioInterface[];
    fitxStudios: StudioInterface[];
}

class Settings extends React.Component<SettingsProps, SettingsState> {
    private searchTimeout: NodeJS.Timeout = {} as NodeJS.Timeout;
    private allRsgStudios: StudioInterface[] = [];
    private allFitnessFirstStudios: StudioInterface[] = [];
    private allFitxStudios: StudioInterface[] = [];

    constructor(props: SettingsProps) {
        super(props);
        this.state = {
            rsgStudios: [],
            fitnessFirstStudios: [],
            fitxStudios: [],
        };

        this.fetchData();
    }

    private fetchData() {
        this.props.context.socket.getObject(`gym-tracker.${this.props.context.instance}.data`)
            .then(data => {
                if (!data) throw new Error(I18n.t('noDataProvided'));
                for (const company in data.native) {
                    data.native[company] = data.native[company].reduce((acc: StudioInterface[], studio: StudioInterface) => [...acc, {
                        ...studio,
                        checked: this.props.native.checkedStudios.some(checkedStudio => checkedStudio.id === studio.id),
                    }], [])
                }
                this.allRsgStudios = data.native.allRsgStudios;
                this.allFitnessFirstStudios = data.native.allFitnessFirstStudios;
                this.allFitxStudios = data.native.allFitxStudios;
                this.setState(state => ({
                    ...state,
                    rsgStudios: this.allRsgStudios,
                    fitnessFirstStudios: this.allFitnessFirstStudios,
                    fitxStudios: this.allFitxStudios,
                }));
            })
            .catch(error => console.log(error));
    }

    private handleSearch(value: string) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.setState(state => ({
                ...state,
                rsgStudios: this.allRsgStudios.filter(studio => studio.name.toLowerCase().includes(value.toLowerCase())),
                fitnessFirstStudios: this.allFitnessFirstStudios.filter(studio => studio.name.toLowerCase().includes(value.toLowerCase())),
                fitxStudios: this.allFitxStudios.filter(studio => studio.name.toLowerCase().includes(value.toLowerCase())),
            }));
        }, 300);
    }

    private handleCheckboxChange(studio: StudioInterface, value: boolean) {
        const previousStudios: StudioInterface[] = this.props.native.checkedStudios;
        if (value) {
            if (previousStudios.some(currentStudio => currentStudio.id === studio.id)) return;
            this.props.onChange('checkedStudios', '');
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
            this.props.onChange('checkedStudios', '');
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
        return (this.state.rsgStudios && this.state.rsgStudios.length > 0)
            || (this.state.fitnessFirstStudios && this.state.fitnessFirstStudios.length > 0)
            || (this.state.fitxStudios && this.state.fitxStudios.length > 0);
    }

    render() {
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
                        {this.state.rsgStudios.map(studio => this.renderStudioGridItem(studio))}
                        {this.state.fitnessFirstStudios.map(studio => this.renderStudioGridItem(studio))}
                        {this.state.fitxStudios.map(studio => this.renderStudioGridItem(studio))}
                    </Grid>
                </>
                }
            </div>
        );
    }
}

export default withStyles(styles)(Settings);
