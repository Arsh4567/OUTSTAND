import { jsonSchema, tool, type ToolSet } from "https://esm.sh/ai@5";

export function createProductivityTools(client: any, userId: string): ToolSet {
  const tools = {} as ToolSet;
  const list = async () => {
    const { data, error } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(4);
    if (error) throw error;
    return data || [];
  };
  const get = async (id: string) => {
    const { data, error } = await client.from("roadmaps").select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Roadmap not found.");
    return data;
  };
  const resolve = async (id?: string, title?: string) => {
    if (id) return get(id);
    const roadmaps = await list();
    if (title) {
      const matches = roadmaps.filter((r: any) => String(r.title || "").toLowerCase().includes(title.trim().toLowerCase()));
      if (matches.length === 1) return matches[0];
      if (matches.length > 1) throw new Error("Multiple roadmaps matched. Please specify the exact roadmap title.");
      throw new Error("No roadmap matched that title.");
    }
    if (roadmaps.length === 1) return roadmaps[0];
    throw new Error(roadmaps.length ? "Specify which roadmap you want to change by title." : "You do not have an active roadmap yet.");
  };

  tools.list_roadmaps = tool({
    description: "List the user's active or paused roadmaps.",
    inputSchema: jsonSchema({ type: "object", properties: {}, additionalProperties: false }),
    execute: async () => ({ roadmaps: await list(), verified: true }),
  });

  tools.change_roadmap = tool({
    description: "Apply a real user-requested roadmap change. Use roadmapId when known, otherwise roadmapTitle.",
    inputSchema: jsonSchema({ type: "object", properties: { roadmapId: { type: "string" }, roadmapTitle: { type: "string" }, request: { type: "string", minLength: 5, maxLength: 500 } }, required: ["request"], additionalProperties: false }),
    execute: async ({ roadmapId, roadmapTitle, request }: any) => {
      const roadmap = await resolve(roadmapId, roadmapTitle);
      if (/^(rename|name)\s+(?:the\s+)?roadmap\s+(?:to\s+)?/i.test(request)) {
        const title = request.replace(/^(rename|name)\s+(?:the\s+)?roadmap\s+(?:to\s+)?/i, "").trim().replace(/^['\"]|['\"]$/g, "");
        const { error } = await client.from("roadmaps").update({ title }).eq("id", roadmap.id).eq("user_id", userId);
        if (error) throw error;
        return { changed: true, roadmapId: roadmap.id, action: "rename_roadmap", verified: true };
      }
      const { error } = await client.from("roadmaps").update({ goal: request }).eq("id", roadmap.id).eq("user_id", userId);
      if (error) throw error;
      return { changed: true, roadmapId: roadmap.id, action: "update_goal", verified: true };
    },
  });

  tools.delete_roadmap = tool({
    description: "Delete one of the user's roadmaps after an explicit request.",
    inputSchema: jsonSchema({ type: "object", properties: { roadmapId: { type: "string" }, roadmapTitle: { type: "string" } }, additionalProperties: false }),
    execute: async ({ roadmapId, roadmapTitle }: any) => {
      const roadmap = await resolve(roadmapId, roadmapTitle);
      const { data, error } = await client.rpc("delete_roadmap", { p_roadmap_id: roadmap.id });
      if (error) throw error;
      if (data !== true) throw new Error("Roadmap deletion could not be verified.");
      return { deleted: true, roadmapId: roadmap.id, title: roadmap.title, verified: true };
    },
  });

  tools.create_roadmap = tool({
    description: "Create a canonical roadmap with a measurable goal and executable tasks. For Class 10 exam preparation, include subject-specific study tasks and verified marathon resources when available.",
    inputSchema: jsonSchema({ type: "object", properties: { category: { type: "string" }, goal: { type: "string", minLength: 5 }, title: { type: "string" }, durationDays: { type: "integer", minimum: 7, maximum: 180 }, answers: { type: "object", additionalProperties: true } }, required: ["goal"], additionalProperties: false }),
    execute: async (args: any) => {
      const answers = args.answers && typeof args.answers === "object" ? args.answers : {};
      const { data, error } = await client.from("roadmaps").insert({ user_id: userId, title: String(args.title || args.goal).trim().slice(0, 120), goal: String(args.goal).trim().slice(0, 2000), start_date: new Date().toISOString().slice(0, 10), duration_days: Math.max(7, Math.min(180, Number(args.durationDays) || Number(answers.durationDays) || 30)), target_date: null, status: "active", category: String(args.category || "custom") }).select("id,title,goal,start_date,target_date,duration_days,status,category,created_at,user_id").single();
      if (error) throw error;
      return { created: true, roadmapId: data.id, roadmap: data, verified: true };
    },
  });

  return tools;
}
