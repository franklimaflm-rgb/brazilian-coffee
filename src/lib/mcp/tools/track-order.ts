import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "track_order",
  title: "Track an order",
  description:
    "Look up a Brazilian Coffee order by its order number and the email used at checkout, returning status, items and total.",
  inputSchema: {
    order_number: z.string().trim().describe("Order number, e.g. BC123456."),
    email: z.string().trim().describe("Email address used when the order was placed."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_number, email }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("get_order_by_number", {
      _order_number: order_number,
      _email: email,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const order = Array.isArray(data) ? data[0] : data;
    if (!order) {
      return { content: [{ type: "text", text: "No order found for that order number and email." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(order) }],
      structuredContent: { order },
    };
  },
});
