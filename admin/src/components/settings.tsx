import { Grid } from '@material-ui/core';
import axios from 'axios';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import I18n from '@iobroker/adapter-react/i18n';
import { StudioInterface } from '../types/studio.interface';

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
    native: Record<string, any>;

    onChange: (attr: string, value: any) => void;
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
                    'checked': this.props.native.checkedStudios.indexOf(studio.id) !== -1,
                }], []),
            )
            .then(data=> data.sort((a, b) => a.name > b.name && 1 || -1))
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

    renderSelect(
        title: AdminWord,
        attr: string,
        options: { value: string; title: AdminWord }[],
        style?: React.CSSProperties,
    ) {
        return (
            <FormControl
                className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
                style={{
                    paddingTop: 5,
                    ...style,
                }}
            >
                <Select
                    value={this.props.native[attr] || '_'}
                    onChange={(e) => this.props.onChange(attr, e.target.value === '_' ? '' : e.target.value)}
                    input={<Input name={attr} id={attr + '-helper'} />}
                >
                    {options.map((item) => (
                        <MenuItem key={'key-' + item.value} value={item.value || '_'}>
                            {I18n.t(item.title)}
                        </MenuItem>
                    ))}
                </Select>
                <FormHelperText>{I18n.t(title)}</FormHelperText>
            </FormControl>
        );
    }

    renderCheckbox(title: AdminWord, attr: string, style?: React.CSSProperties) {
        return (
            <FormControlLabel
                key={attr}
                style={{
                    paddingTop: 5,
                    ...style,
                }}
                className={this.props.classes.controlElement}
                control={
                    <Checkbox
                        checked={this.props.native[attr]}
                        onChange={() => this.props.onChange(attr, !this.props.native[attr])}
                        color="primary"
                    />
                }
                label={I18n.t(title)}
            />
        );
    }

    handleCheckboxChange(id, value) {
        if (value) {
            if (this.props.native.checkedStudios.indexOf(id) !== -1) return;
            this.props.onChange('checkedStudios', [...this.props.native.checkedStudios, id]);
        } else {
            this.props.onChange('checkedStudios', this.props.native.checkedStudios.filter(currId => currId !== id));
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
                                    onChange={(e) => this.handleCheckboxChange(studio.id, e.target.checked)}
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
