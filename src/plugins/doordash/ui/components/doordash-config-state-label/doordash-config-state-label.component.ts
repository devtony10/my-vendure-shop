import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { DoordashConfigState } from '../../common/ui-types';
import { SharedModule } from '@vendure/admin-ui/core';

@Component({
    selector: 'doordash-config-state-label',
    templateUrl: './doordash-config-state-label.component.html',
    styleUrls: ['./doordash-config-state-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SharedModule],
})
export class DoordashConfigStateLabelComponent {
    @Input() state: DoordashConfigState;

    getIcon(state: DoordashConfigState) {
        switch (state) {
            case 'new':
                return 'bubble-exclamation';
            case 'saved':
                return 'check-circle';
        }
    }
}