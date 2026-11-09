import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`, {
    id: payload.id,
    title: payload.title,
  });

  console.log("WEBHOOK product created :", payload);

  // Respond fast (< 5s); do heavy work asynchronously.
  return new Response();
};
