import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SharedModule, TypedBaseListComponent } from "@vendure/admin-ui/core";
import gql from "graphql-tag";

import { DOORDASH_CONFIG_FRAGMENT } from "../../common/fragments.graphql";
import { GetAllConfigsDocument } from "../../gql/graphql";
import { DoordashConfigStatusLabelComponent } from "../doordash-config-status-label/doordash-config-status-label.component";
import { DoordashConfigStateLabelComponent } from "../doordash-config-state-label/doordash-config-state-label.component";

export const GET_ALL_CONFIGS = gql`
  query GetAllConfigs($options: DoordashConfigListOptions) {
    doordashConfigs(options: $options) {
      items {
        ...DoordashConfig
      }
      totalItems
    }
  }
  ${DOORDASH_CONFIG_FRAGMENT}
`;

@Component({
  selector: "all-doordash-config-list",
  templateUrl: "./all-doordash-config-list.component.html",
  styleUrls: ["./all-doordash-config-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SharedModule, DoordashConfigStatusLabelComponent, DoordashConfigStateLabelComponent],
})
export class AllDoordashConfigListComponent extends TypedBaseListComponent<
  typeof GetAllConfigsDocument,
  "doordashConfigs"
> {
  filteredState: string | null = "new";

  readonly filters = this.createFilterCollection()
    .addDateFilters()
    .addFilter({
      name: 'developerId',
      type: { kind: 'text' },
      label: 'Developer ID',
      filterField: 'developerId',
  })
    .addFilter({
      name: "enabled",
      type: { kind: "boolean" },
      label: "Enabled",
      filterField: "enabled",
    })
    .addFilter({
      name: "sandbox",
      type: { kind: "boolean" },
      label: "Sandbox",
      filterField: "sandbox",
    })
    .addFilter({
      name: "state",
      type: {
        kind: "select",
        options: [
          { value: "new", label: "New" },
          { value: "saved", label: "Saved" },
        ],
      },
      label: "State",
      filterField: "state",
    })
    .addFilter({
      name: "status",
      type: {
        kind: "select",
        options: [
          { value: "default", label: "Default" },
          { value: "checking", label: "Checking" },
          { value: "failed", label: "Failed" },
          { value: "success", label: "Success" },
        ],
      },
      label: "Status",
      filterField: "status",
    })
    .connectToRoute(this.route);

  readonly sorts = this.createSortCollection()
    .defaultSort("createdAt", "DESC")
    .addSort({ name: "createdAt" })
    .addSort({ name: "updatedAt" })
    .addSort({ name: "status" })
    .addSort({ name: "state" })
    .connectToRoute(this.route);

  constructor() {
    super();
    super.configure({
      document: GetAllConfigsDocument,
      getItems: (data) => data.doordashConfigs,
      setVariables: (skip, take) => ({
        options: {
          skip,
          take,
          filter: {
            developerId: {
              contains: this.searchTermControl.value ?? undefined,
            },
            ...this.filters.createFilterInput(),
          },
          sort: this.sorts.createSortInput(),
        },
      }),
      refreshListOnChanges: [
        this.filters.valueChanges,
        this.sorts.valueChanges,
      ],
    });
  }
}
