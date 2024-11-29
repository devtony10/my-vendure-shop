import { registerRouteComponent } from '@vendure/admin-ui/core';

import { AllDoordashConfigListComponent } from './components/all-doordash-config-list/all-doordash-config-list.component';
import { DoorDashConfigDetailComponent } from './components/doordash-config-detail/doordash-config-detail.component'
import { graphql } from './gql';

export const GET_CONFIG_DETAIL = graphql(`
    query GetDoordashConfig($id: ID!) {
        doordashConfig(id: $id) {
            ...DoordashConfig
        }
    }
`);

export default [
    registerRouteComponent({
        path: '',
        component: AllDoordashConfigListComponent,
        breadcrumb: [
            {
                label: 'Doordash configuration',
                link: ['/extensions', 'doordash-config'],
            },
        ],
    }),
    registerRouteComponent({
        path: ':id',
        component: DoorDashConfigDetailComponent,
        query: GET_CONFIG_DETAIL,
        entityKey: 'doordashConfig',
        getBreadcrumbs: entity => [
            {
                label: 'Doordash configuration',
                link: ['/extensions', 'doordash-config'],
            },
            {
                label: entity ? `#${entity?.id}`: 'Create doordash configuration',
                link: [],
            },
        ],
    }),
];
