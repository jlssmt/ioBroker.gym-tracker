// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig

import { StudioInterface } from '../types/studio.interface';

declare global {
    namespace ioBroker {
        interface AdapterConfig {
            checkedStudios: StudioInterface[];
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
