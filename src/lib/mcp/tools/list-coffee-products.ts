import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_coffee_products",
  title: "List coffee products",
  description: "List the coffees currently available on the Brazilian Coffee menu, with prices.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("coffee_products")
      .select("id, name, description, price, available")
      .eq("available", true)
      .eq("store_id", "00000000-0000-0000-0000-000000000001")
      .order("name");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
