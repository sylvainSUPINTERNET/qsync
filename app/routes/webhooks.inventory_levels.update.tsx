import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  // admin is undefined if the app was uninstalled (no session left).
  if (!admin) return new Response();

  const response = await admin.graphql(
    `#graphql
    query inventoryItemSku($id: ID!) {
      inventoryItem(id: $id) {
        sku
        variant {
          id
          title
          product {
            id
            title
          }
        }
      }
    }`,
    {
      variables: {
        id: `gid://shopify/InventoryItem/${payload.inventory_item_id}`,
      },
    },
  );
  const { data } = await response.json();
  const item = data?.inventoryItem;

  console.log(`Received ${topic} webhook for ${shop}`, {
    sku: item?.sku,
    variantId: item?.variant?.id,
    productId: item?.variant?.product?.id,
    productTitle: item?.variant?.product?.title,
    locationId: payload.location_id,
    available: payload.available,
    updatedAt: payload.updated_at,
  });

  // Respond fast (< 5s); do heavy work asynchronously.
  return new Response();
};
