export interface StudiosInterface{
    rsgStudios: StudioInterface[];
    fitnessFirstStudios: StudioInterface[];
    fitxStudios: StudioInterface[];
}

export interface StudioInterface {
    id: number;
    name: string;
    checked?: boolean;
}
