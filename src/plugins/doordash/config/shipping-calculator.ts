import {
  LanguageCode,
  Order,
  Injector,
  ShippingCalculator,
  TransactionalConnection,
} from "@vendure/core";
import { DoordashConfig } from "../entities/doordash-config.entity";
import {
  DeliveryResponse,
  DoorDashClient,
  DoorDashResponse,
} from "@doordash/sdk";

import { v4 as uuidv4 } from "uuid";

let connection: TransactionalConnection;

export const doordashShippingCalculator = new ShippingCalculator({
  code: "doordash-shipping-calculator",
  description: [
    {
      languageCode: LanguageCode.en,
      value: "Ship orders with DoorDash",
    },
  ],
  args: {
    pickup_phone_number: {
      type: "string",
      ui: { component: "text-form-input" },
      label: [{ languageCode: LanguageCode.en, value: "Store Phone Number" }],
    },
    pickup_address: {
      type: "string",
      ui: { component: "text-form-input" },
      label: [{ languageCode: LanguageCode.en, value: "Store Address" }],
    },
    taxRate: {
      type: "int",
      ui: { component: "number-form-input", suffix: "%" },
      label: [{ languageCode: LanguageCode.en, value: "Tax rate" }],
    },
  },
  init(injector: Injector) {
    connection = injector.get(TransactionalConnection);
  },
  calculate: async (ctx, order, args) => {
    const config = await connection.getRepository(ctx, DoordashConfig).findOne({
      where: { enabled: true },
    });

    if (!config) {
      throw new Error("Please enable a configuration!");
    }

    const accessKey = {
      developer_id: config.developerId,
      key_id: config.keyId,
      signing_secret: config.signingSecret,
    };

    const client = new DoorDashClient(accessKey);

    const payload = {
      price: 0,
      priceIncludesTax: ctx.channel.pricesIncludeTax,
      taxRate: args.taxRate,
    };

    if (!order.customFields.externalDeliveryId) {
      await client
        .deliveryQuote({
          external_delivery_id: uuidv4(),
          pickup_address: "901 Market Street 6th Floor San Francisco, CA 94103",
          pickup_phone_number: "+16505555555",
          dropoff_address:
            "901 Market Street 6th Floor San Francisco, CA 94103",
          dropoff_phone_number: "+16505555555",
        })
        .then(async (response: DoorDashResponse<DeliveryResponse>) => {
          console.log(response.data);
          order.customFields.externalDeliveryId = response.data.external_delivery_id;
          order.customFields.deliveryFees = response.data.fee;
          await connection.getRepository(ctx, Order).save(order);
          payload.price = response.data.fee;
        })
        .catch((err: any) => {
          console.log(err);
          throw new Error(err);
        });
    } else {
      payload.price = order.customFields.deliveryFees;
    }

    return payload;
  },
});
