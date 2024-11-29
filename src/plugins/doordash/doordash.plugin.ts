import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { DoordashConfig } from './entities/doordash-config.entity';
import { adminApiExtensions } from './api/api-extensions';
import { DoordashConfigAdminResolver } from './api/resolvers/doordash-admin.resolver';
import { doordashShippingCalculator } from './config/shipping-calculator';
import { DoordashService } from './api/services/doordash.service';

import { DOORDASH_PLUGIN_OPTIONS } from './constants';
import { PluginInitOptions } from './types';
import path from 'path';
import { AdminUiExtension } from '@vendure/ui-devkit/compiler';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [DoordashConfig],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [DoordashConfigAdminResolver],
    },
    providers: [
        {
            provide: DOORDASH_PLUGIN_OPTIONS, 
            useFactory: () => DoordashPlugin.options 
        },
        DoordashService,
    ],
    configuration: config => {
        config.shippingOptions.shippingCalculators.push(
            doordashShippingCalculator
        )
        return config;
    },
    compatibility: '^3.0.0',
})
export class DoordashPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<DoordashPlugin> {
        this.options = options;
        return DoordashPlugin;
    }

    static uiExtensions: AdminUiExtension = {
        extensionPath: path.join(__dirname, 'ui'),
        providers: ['providers.ts'],
        routes: [{route: 'doordash-config', filePath: 'routes.ts'}]
    };
}
