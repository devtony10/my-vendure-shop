import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import {
  EventBus,
  ID,
  JobQueue,
  JobQueueService,
  Order,
  OrderPlacedEvent,
  OrderService,
  RequestContext,
  SerializedRequestContext,
  TransactionalConnection,
} from "@vendure/core";
import { filter } from 'rxjs/operators';
import { loggerCtx, DOORDASH_PLUGIN_OPTIONS } from "../../constants";
import { DoordashConfig } from "../../entities/doordash-config.entity";
import { DeliveryResponse, DoorDashClient, DoorDashResponse } from "@doordash/sdk";

interface PushOrderJob {
  action: "push-order";
  ctx: SerializedRequestContext;
  orderId: ID;
}

@Injectable()
export class DoordashService implements OnApplicationBootstrap {
  private jobQueue!: JobQueue<PushOrderJob>;

  constructor(
    private eventBus: EventBus,
    private orderService: OrderService,
    private jobQueueService: JobQueueService,
    private connection: TransactionalConnection
  ) {}

  async onApplicationBootstrap() {
    this.jobQueue = await this.jobQueueService.createQueue({
      name: "doordash",
      process: async ({ data }) => {
        const { action, ctx, orderId } = data;
        if (action === "push-order") {
          const deserializedCtx = RequestContext.deserialize(ctx);
          const order = await this.orderService.findOne(
            deserializedCtx,
            orderId
          );
          if (!order) {
            throw new Error(`Order with ID ${orderId} not found`);
          }
          await this.pushOrder(deserializedCtx, data.orderId);
        } else {
          throw new Error(`Unknown action: ${action}`);
        }
      },
    });
    this.eventBus
    .ofType(OrderPlacedEvent)
    .pipe(filter((event) => event instanceof OrderPlacedEvent))
    .subscribe(async (event) => {
      const { ctx, order } = event as OrderPlacedEvent;
      await this.addPushOrderJob(ctx, order);
    });
  }

  async addPushOrderJob(ctx: RequestContext, order: Order) {
    await this.jobQueue
      .add(
        {
          action: "push-order",
          ctx: ctx.serialize(),
          orderId: order.id,
        },
        { retries: 10 }
      )
      .catch((err) => {
        throw err;
      });
  }

  async pushOrder(ctx: RequestContext, orderId: ID) {
    const config = await this.connection
      .getRepository(ctx, DoordashConfig)
      .findOne({
        where: { enabled: true },
      });

    const order = await this.orderService.findOne(ctx, orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (config) {
      const accessKey = {
        developer_id: config.developerId,
        key_id: config.keyId,
        signing_secret: config.signingSecret,
      };

      const client = new DoorDashClient(accessKey);

      await client
        .deliveryQuoteAccept(order.customFields.externalDeliveryId, {
          tip: order.customFields.fees,
        })
        .then(async (response: DoorDashResponse<DeliveryResponse>) => {
          console.log(response.data);
          order.customFields.trackingUrl = response.data.tracking_url!;
          const repository = this.connection.getRepository(ctx, Order);
          await repository.save(order);
        })
        .catch((err) => {
          throw new Error(err);
        });
        
    } else {
      throw new Error("Please enable a configuration!");
    }
  }
}
