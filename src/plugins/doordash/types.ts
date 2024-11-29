import { CustomOrderFields } from '@vendure/core/dist/entity/custom-entity-fields';

/**
 * @description
 * The plugin can be configured using the following options:
 */
export interface PluginInitOptions {
    exampleOption?: string;
}

export type DoordashConfigState = undefined | null | 'new' | 'saved';

export type DoordashConfigStatus = 'default'| 'checking'| 'failed'| 'success';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomOrderFields {
        fees: number;
        trackingUrl: string;
        externalDeliveryId: string;
        deliveryFees: number;
    }
}

