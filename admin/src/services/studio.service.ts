import Connection from '@iobroker/adapter-react/Connection';
import I18n from '@iobroker/adapter-react/i18n';
import { StudioInterface, StudiosInterface } from '../../../src/types/studio.interface';

class StudioService {

    private socket: Connection;
    private instance: number;

    constructor(socket: Connection, instance: number) {
        this.socket = socket;
        this.instance = instance;
    }

    getStudiosFromBackend(checkedStudios: StudioInterface[]): Promise<StudiosInterface> {
        return this.socket.getObject(`gym-tracker.${this.instance}.data`)
            .then(data => {
                if (!data || !data.native || !data.native.allStudios) throw new Error(I18n.t('noDataProvided'));
                const result: StudiosInterface = {} as StudiosInterface;
                for (const company in data.native.allStudios) {
                    result[company] = data.native.allStudios[company].reduce((acc: StudioInterface[], studio: StudioInterface) => [...acc, {
                        ...studio,
                        checked: checkedStudios.some(checkedStudio => checkedStudio.id === studio.id),
                    }], []);
                }
                return result;
            });
    }

}

export default StudioService;
