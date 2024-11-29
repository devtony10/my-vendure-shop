import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import {
  Allow,
  Ctx,
  ListQueryBuilder,
  patchEntity,
  Permission,
  RequestContext,
  Transaction,
  TransactionalConnection,
} from "@vendure/core";

import { DoordashConfig } from "../../entities/doordash-config.entity";
import {
  MutationSubmitDoordashConfigArgs,
  MutationUpsertDoordashConfigArgs,
  QueryDoordashConfigArgs,
  QueryDoordashConfigsArgs,
  QueryIsDoordashConfigValidArgs,
} from "../../generated-admin-types";
import {
  DeliveryResponse,
  DoorDashClient,
  DoorDashResponse,
} from "@doordash/sdk";

import { v4 as uuidv4 } from "uuid";

@Resolver()
export class DoordashConfigAdminResolver {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder
  ) {}

  @Query()
  async doordashConfigs(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryDoordashConfigsArgs
  ) {
    return this.listQueryBuilder
      .build(DoordashConfig, args.options || undefined, { ctx })
      .getManyAndCount()
      .then(([items, totalItems]) => ({
        items,
        totalItems,
      }));
  }

  @Query()
  async doordashConfig(
    @Ctx() ctx: RequestContext,
    @Args() args: QueryDoordashConfigArgs
  ) {
    return this.connection.getRepository(ctx, DoordashConfig).findOne({
      where: { id: args.id },
    });
  }

  @Transaction()
  @Mutation()
  async submitDoordashConfig(
    @Ctx() ctx: RequestContext,
    @Args() { input }: MutationSubmitDoordashConfigArgs
  ) {
    const config = new DoordashConfig(input);
    config.state = "saved";
    config.status = "default";
    console.log(config.id);

    return this.connection.getRepository(ctx, DoordashConfig).save(config);
  }

  @Query()
  async isDoordashConfigValid(
    @Ctx() ctx: RequestContext,
    @Args() { input }: QueryIsDoordashConfigValidArgs
  ) {
    const config = input.id
      ? await this.connection.getEntityOrThrow(ctx, DoordashConfig, input.id)
      : null;

    const accessKey = {
      developer_id: input.developerId,
      key_id: input.keyId,
      signing_secret: input.signingSecret,
    };

    const client = new DoorDashClient(accessKey);

    await client
      .deliveryQuote({
        external_delivery_id: uuidv4(),
        pickup_address: "901 Market Street 6th Floor San Francisco, CA 94103",
        pickup_phone_number: "+16505555555",
        dropoff_address: "901 Market Street 6th Floor San Francisco, CA 94103",
        dropoff_phone_number: "+16505555555",
      })
      .then(async (response: DoorDashResponse<DeliveryResponse>) => {
        console.log(response.data);
        if (config) {
          config.status = "success";
          await this.connection.getRepository(ctx, DoordashConfig).save(config);
        }
        return true;
      })
      .catch(async (err: any) => {
        console.log(err);
        if (config) {
          config.status = "failed";
          await this.connection.getRepository(ctx, DoordashConfig).save(config);
        }
        throw new Error(
          "Failed to validate DoorDash configuration. Check your credentials or make sure you have internet."
        );
      });
  }

  @Transaction()
  @Mutation()
  async upsertDoordashConfig(
    @Ctx() ctx: RequestContext,
    @Args() { input }: MutationUpsertDoordashConfigArgs
  ) {
    const repository = this.connection.getRepository(ctx, DoordashConfig);

    // Fetch the configuration to update
    const config = await this.connection.getEntityOrThrow(
      ctx,
      DoordashConfig,
      input.id
    );

    // Update the configuration with the new values
    const updatedConfig = patchEntity(config, input);
    updatedConfig.state = "saved";
    updatedConfig.status = "default";

    // If `enabled` is true, find the currently enabled config and disable it
    if (input.enabled) {
      const currentlyEnabledConfig = await repository.findOne({
        where: { enabled: true },
      });

      if (
        currentlyEnabledConfig &&
        currentlyEnabledConfig.id !== updatedConfig.id
      ) {
        currentlyEnabledConfig.enabled = false;
        await repository.save(currentlyEnabledConfig);
      }
    }

    // Save the updated configuration
    return repository.save(updatedConfig);
  }
}
