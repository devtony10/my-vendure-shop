import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { DoordashConfigStatus } from '../../common/ui-types';
import { SharedModule } from '@vendure/admin-ui/core';

@Component({
    selector: 'doordash-config-status-label',
    templateUrl: './doordash-config-status-label.component.html',
    styleUrls: ['./doordash-config-status-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SharedModule],
})
export class DoordashConfigStatusLabelComponent {
    @Input() status: DoordashConfigStatus;

    getIcon(status: DoordashConfigStatus) {
        switch (status) {
            case 'default':
                return 'bubble-exclamation';
            case 'checking':
                return 'hourglass';
            case 'failed':
                return 'times-circle';
            case 'success':
                return 'check-circle';
        }
    }
}