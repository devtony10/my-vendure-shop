import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

import { DoordashConfigState, DoordashConfigStatus } from '../types';

@Entity("doordash_config")
export class DoordashConfig extends VendureEntity {
    constructor(input?: DeepPartial<DoordashConfig>) {
        super(input);
    }

    @Column({ default: true })
    sandbox: boolean

    @Column({ default: true })
    enabled: boolean

    @Column({ type: "text" })
    apiEndpoint!: string;

    @Column({ unique: true, type: "text" })
    developerId!: string

    @Column({ type: "text" })
    keyId!: string

    @Column({ type: "text" })
    signingSecret!: string

    @Column({ type: 'varchar', default: 'new'})
    state: DoordashConfigState;

    @Column({ type: 'varchar'})
    status: DoordashConfigStatus;
}