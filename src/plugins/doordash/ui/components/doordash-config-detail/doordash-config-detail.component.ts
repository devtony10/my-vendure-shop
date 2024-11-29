import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import {
  DataService,
  NotificationService,
  SharedModule,
  TypedBaseDetailComponent,
} from "@vendure/admin-ui/core";
import { Observable, of } from "rxjs";
import { filter, map } from "rxjs/operators";
import {
  DoordashConfigStatus,
  DoordashConfigState,
} from "../../common/ui-types";
import { DoordashConfigStatusLabelComponent } from "../doordash-config-status-label/doordash-config-status-label.component";
import {
  SubmitDoordashConfigInput,
  UpdateDoordashConfigInput,
} from "../../gql/graphql";
import {
  CREATE_CONFIG,
  TEST_CONFIG,
  UPSERT_CONFIG,
} from "./doordash-config-detail.graphql";
import { GetDoordashConfigQuery } from "../../gql/graphql";
import { GET_CONFIG_DETAIL } from "../../routes";

@Component({
  selector: "doordash-config-detail",
  templateUrl: "./doordash-config-detail.component.html",
  styleUrls: ["./doordash-config-detail.component.scss"],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [SharedModule, DoordashConfigStatusLabelComponent],
})
export class DoorDashConfigDetailComponent
  extends TypedBaseDetailComponent<typeof GET_CONFIG_DETAIL, "doordashConfig">
  implements OnInit, OnDestroy
{
  detailForm!: FormGroup;
  doordashConfigStatus$: Observable<DoordashConfigStatus>;
  doordashConfigState$: Observable<DoordashConfigState>;

  constructor(
    private formBuilder: FormBuilder,
    protected dataService: DataService,
    private changeDetector: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    super();
    this.detailForm = this.formBuilder.group({
      enabled: true,
      sandbox: true,
      apiUrl: ["", Validators.required],
      developerId: ["", Validators.required],
      keyId: ["", Validators.required],
      signingSecret: ["", Validators.required],
    });
  }
  // host comfyui on docker

  ngOnInit(): void {
    this.init();

    this.doordashConfigStatus$ = this.id
      ? this.entity$.pipe(
          map(doordashConfig => doordashConfig.status as DoordashConfigStatus)
        )
      : of("default" as DoordashConfigStatus);

    this.doordashConfigState$ = this.id
      ? this.entity$.pipe(
          map(doordashConfig => doordashConfig.state as DoordashConfigState)
        )
      : of("new" as DoordashConfigState);
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  create(): void {
    this.detailForm.markAsDirty();

    this.saveChanges()
      .pipe(filter((result) => !!result))
      .subscribe({
        next: () => {
          this.doordashConfigStatus$ = of("default");
          this.doordashConfigState$ = of("saved");

          this.detailForm.markAsPristine();
          this.changeDetector.markForCheck();
          this.notificationService.success("Configuration saved", {
            entity: "DoordashConfig",
          });
        },
        error: () => {
          this.doordashConfigStatus$ = of("default");
          this.doordashConfigState$ = of("new");

          this.notificationService.error("Error while creating configuration", {
            entity: "DoordashConfig",
          });
        },
      });
  }

  test(): void {
    this.detailForm.markAsDirty();

    this.testConfig()
      .pipe(filter((result) => !!result))
      .subscribe({
        next: () => {
          this.doordashConfigStatus$ = of("success" as DoordashConfigStatus);

          if (this.id) {
            this.doordashConfigState$ = of("saved" as DoordashConfigState);
            this.detailForm.markAsDirty();
          }

          this.changeDetector.markForCheck();
          this.notificationService.success("Configuration test was successful");
        },
        error: () => {
          this.doordashConfigStatus$ = of("failed" as DoordashConfigStatus);

          if (this.id)
            this.doordashConfigState$ = of("saved" as DoordashConfigState);

          this.changeDetector.markForCheck();
          this.notificationService.error(
            `An error occurred when attempting to test the configuration.`
          );
        },
      });
  }

  update(): void {
    this.detailForm.markAsDirty();

    this.saveChanges()
      .pipe(filter((result) => !!result))
      .subscribe({
        next: () => {
          this.doordashConfigStatus$ = of("default");
          this.detailForm.markAsPristine();
          this.changeDetector.markForCheck();
          this.notificationService.success(
            "Configuration update was successful",
            {
              entity: "DoordashConfig",
            }
          );
        },
        error: () => {
          this.notificationService.error(
            "An error occurred when attempting to update the configuration",
            {
              entity: "DoordashConfig",
            }
          );
        },
      });
  }

  private testConfig(): Observable<boolean> {
    if (this.detailForm.dirty) {
      const { enabled, sandbox, apiUrl, developerId, keyId, signingSecret } =
        this.detailForm.value;

      const input: SubmitDoordashConfigInput = {
        enabled: enabled,
        apiEndpoint: apiUrl,
        developerId: developerId,
        keyId: keyId,
        sandbox: sandbox,
        signingSecret: signingSecret,
      };

      const testInput = { ...input, ...(this.id && { id: this.id }) };

      this.doordashConfigStatus$ = of("checking" as DoordashConfigStatus);
      
      console.log("Testing config with input:", testInput);

      return this.dataService.mutate(TEST_CONFIG, { input: testInput }).pipe(
        map(() => {
          console.log("TEST_CONFIG mutation successful");
          return true;
        })
      );
    } else {
      console.log("Form is not dirty, skipping save.");
      return of(false);
    }
  }

  private saveChanges(): Observable<boolean> {
    if (this.detailForm.dirty) {
      const { sandbox, enabled, apiUrl, developerId, keyId, signingSecret } =
        this.detailForm.value;

      const input: SubmitDoordashConfigInput = {
        apiEndpoint: apiUrl,
        developerId: developerId,
        keyId: keyId,
        sandbox: sandbox,
        enabled: enabled,
        signingSecret: signingSecret,
      };

      if (!this.id) {
        console.log("No ID provided. Proceeding with CREATE_CONFIG:", input);

        return this.dataService.mutate(CREATE_CONFIG, { input }).pipe(
          map(() => {
            console.log("CREATE_CONFIG mutation successful");
            return true;
          })
        );
      } else {
        console.log("ID exists. Proceeding with UPSERT_CONFIG.");

        const updateInput: UpdateDoordashConfigInput = {
          id: this.id,
          apiEndpoint: apiUrl,
          developerId: developerId,
          keyId: keyId,
          enabled: enabled,
          sandbox: sandbox,
          signingSecret: signingSecret,
        };

        console.log("UPSERT_CONFIG input:", updateInput);

        return this.dataService
          .mutate(UPSERT_CONFIG, { input: updateInput })
          .pipe(
            map(() => {
              console.log("UPSERT_CONFIG mutation successful");
              return true;
            })
          );
      }
    } else {
      console.log("Form is not dirty, skipping save.");
      return of(false);
    }
  }

  protected setFormValues(entity: GetDoordashConfigQuery["doordashConfig"]): void {
    this.detailForm.patchValue({
      sandbox: entity?.sandbox,
      enabled: entity?.enabled,
      apiUrl: entity?.apiEndpoint,
      developerId: entity?.developerId,
      keyId: entity?.keyId,
      signingSecret: entity?.signingSecret,
    });
  }
}

// delete() {}
