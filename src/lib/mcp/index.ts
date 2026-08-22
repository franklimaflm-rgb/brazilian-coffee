import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCoffeeProducts from "./tools/list-coffee-products";
import trackOrder from "./tools/track-order";
import listMyOrders from "./tools/list-my-orders";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "brazilian-coffee",
  title: "brazilian-coffee",
  version: "0.1.0",
  instructions:
    "Tools for the Brazilian Coffee delivery app. Use `list_coffee_products` for the current menu and prices, `track_order` to check an order by order number plus checkout email, and `list_my_orders` for the signed-in user's own orders.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCoffeeProducts, trackOrder, listMyOrders],
});
