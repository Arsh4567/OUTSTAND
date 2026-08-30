import { getOwnedRoadmap, listOwnedRoadmaps, updateOwnedRoadmap, deleteOwnedRoadmap, createBasicRoadmap, smartChangeRoadmap } from "../../../api/roadmap-service.ts";
import { getAdaptiveSnapshot, setTaskProgress } from "../../../api/adaptive-roadmap.ts";

export async function handleRoadmapAction(client: any, userId: string, action: string, body: any) {
  if (action === "list_roadmaps") return { roadmaps: await listOwnedRoadmaps(client, userId), verified: true };

  if (action === "roadmap_questions") {
    const category = typeof body.category === "string" ? body.category : "skill_learning";
    const presets: Record<string, any[]> = {
      exam_preparation: [
        { id: "goal", question: "What result are you aiming for?", type: "multiline", required: true, placeholder: "Example: 90%+ in my half-yearly exam." },
        { id: "deadline", question: "When is the exam?", type: "text", required: true, placeholder: "Example: 20 September" },
        { id: "baseline", question: "What is your current level?", type: "multiline", required: true },
        { id: "time", question: "How much time can you study on a normal day?", type: "number", required: true },
      ],
      chess: [
        { id: "goal", question: "What chess result are you targeting?", type: "multiline", required: true, placeholder: "Example: reach 1500 rapid." },
        { id: "baseline", question: "What is your current rating and biggest weakness?", type: "multiline", required: true },
        { id: "time", question: "How many minutes can you train per day?", type: "number", required: true },
      ],
      academics: [
        { id: "goal", question: "What academic result do you want?", type: "multiline", required: true },
        { id: "deadline", question: "When is the deadline or exam?", type: "text", required: true },
        { id: "baseline", question: "Where are you starting from?", type: "multiline", required: true },
      ],
    };
    return { questions: presets[category] || [
      { id: "goal", question: "What result are you aiming for?", type: "multiline", required: true, placeholder: "Describe the destination in concrete terms." },
      { id: "deadline", question: "What deadline are you working toward?", type: "text", required: true },
      { id: "baseline", question: "What is your current starting point?", type: "multiline", required: true },
      { id: "time", question: "How much time can you commit most days?", type: "number", required: true },
    ] };
  }

  if (action === "update_roadmap") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    if (!roadmapId) throw new Error("roadmapId is required.");
    return await updateOwnedRoadmap(client, userId, roadmapId, { title: body.title, goal: body.goal });
  }

  if (action === "smart_change") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    const request = typeof body.request === "string" ? body.request : "";
    if (!roadmapId) throw new Error("roadmapId is required.");
    return await smartChangeRoadmap(client, userId, roadmapId, request);
  }

  if (action === "delete_roadmap") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    if (!roadmapId) throw new Error("roadmapId is required.");
    return await deleteOwnedRoadmap(client, userId, roadmapId);
  }

  if (action === "generate_roadmap") {
    const category = typeof body.category === "string" ? body.category : "skill_learning";
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    return await createBasicRoadmap(client, userId, category, answers);
  }

  if (action === "get_roadmap") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    if (!roadmapId) throw new Error("roadmapId is required.");
    return { roadmap: await getOwnedRoadmap(client, userId, roadmapId), verified: true };
  }

  if (action === "set_task_progress") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    const taskId = typeof body.taskId === "string" ? body.taskId : "";
    const status = typeof body.status === "string" ? body.status : "";
    if (!roadmapId || !taskId) throw new Error("roadmapId and taskId are required.");
    return await setTaskProgress(client, userId, roadmapId, taskId, status);
  }

  if (action === "refresh_today_tasks") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    if (!roadmapId) throw new Error("roadmapId is required.");
    const snapshot = await getAdaptiveSnapshot(client, userId, roadmapId);
    return { ...snapshot, mode: typeof body.mode === "string" ? body.mode : "custom" };
  }

  if (action === "insert_next_day_schedule") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    if (!roadmapId) throw new Error("roadmapId is required.");
    const snapshot = await getAdaptiveSnapshot(client, userId, roadmapId);
    return { roadmapId, nextDay: Number(body.nextDay) || snapshot.todayDay + 1, schedule: Array.isArray(body.schedule) ? body.schedule : [], adaptation: snapshot.adaptation, verified: true };
  }

  if (action === "save_nightly_review") {
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    if (!roadmapId) throw new Error("roadmapId is required.");
    const snapshot = await getAdaptiveSnapshot(client, userId, roadmapId);
    const reviewDate = new Date().toISOString().slice(0, 10);
    const payload = {
      user_id: userId,
      roadmap_id: roadmapId,
      roadmap_day: snapshot.todayDay,
      event_date: reviewDate,
      reflection: String(body.reflection || "").trim().slice(0, 2000),
      energy: Math.max(1, Math.min(5, Number(body.energy) || 1)),
      difficulty: Math.max(1, Math.min(5, Number(body.difficulty) || 1)),
      adaptation: snapshot.adaptation,
    };
    const { data, error } = await client.from("roadmap_adaptation_events").upsert(payload, { onConflict: "user_id,roadmap_id,event_date" }).select("id,roadmap_day,event_date,adaptation").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Nightly review could not be saved.");
    return { roadmapId, reviewDate, adaptation: snapshot.adaptation, review: data, verified: true };
  }

  throw new Error(`Unsupported roadmap action: ${action}`);
}
