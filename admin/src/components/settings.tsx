import I18n from '@iobroker/adapter-react/i18n';
import { Grid } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import TextField from '@material-ui/core/TextField';
import axios from 'axios';
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

    onChange: (attr: string, value: StudioInterface[] | string) => void;
}

interface SettingsState {
    studios: StudioInterface[];
}

class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);
        this.state = {
            studios: [],
        };

        axios.get('https://rsg-group.api.magicline.com/connect/v1/studio?studioTags=AKTIV-391B8025C1714FB9B15BB02F2F8AC0B2')
            .then(response => response.data)
            .then(data => data.reduce((acc: StudioInterface[], studio: any) =>
                [...acc, {
                    'id': studio.id,
                    'name': studio.studioName,
                    'checked': this.props.native.checkedStudios.some(currentStudio => currentStudio.id === studio.id),
                }], []),
            )
            .then(data => data.sort((a, b) => a.name > b.name ? 1 : -1))
            .then(result => this.setState(state => ({ ...state, studios: result })))
            .catch(error => console.log(error));
    }

    renderInput(title: AdminWord, attr: string, type: string) {
        return (
            <TextField
                label={I18n.t(title)}
                className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
                value={this.props.native[attr]}
                type={type || 'text'}
                onChange={(e) => this.props.onChange(attr, e.target.value)}
                margin="normal"
            />
        );
    }

    handleCheckboxChange(studio: StudioInterface, value: boolean) {
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

    render() {
        return (
            <Grid container style={{ height: '80%', overflow: 'scroll' }}>
                {this.state.studios.map(studio => (
                    <Grid item lg={2} md={3} sm={6} xs={12} key={`studio-checkbox-${studio.id}`}>
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
                ))}
            </Grid>
        );
    }
}

export default withStyles(styles)(Settings);
