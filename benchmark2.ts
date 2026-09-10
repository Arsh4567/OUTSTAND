import { handleRoadmapAction } from "./supabase/functions/outstand-ai/roadmap-action.ts";

let queries = 0;
const mockClient = {
  from: (table: string) => {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              order: async () => {
                const tasks = [];
                for (let i = 0; i < 500; i++) {
                  tasks.push({ id: `task_${i}`, title: "old task name", day_number: 1, instructions: "do something", success_criteria: "done" });
                }
                return { data: tasks, error: null };
              }
            }),
            maybeSingle: async () => ({
              data: { id: "roadmap_1", title: "Test", start_date: "2023-10-01" },
              error: null
            })
          })
        })
      }),
      update: () => ({
        eq: () => ({
          eq: () => ({
            eq: async () => {
              queries++;
              // Simulate network delay
              await new Promise(r => setTimeout(r, 2));
              return { error: null };
            }
          })
        }),
        in: () => ({
          eq: () => ({
            eq: async () => {
              queries++;
              // Simulate network delay
              await new Promise(r => setTimeout(r, 2));
              return { error: null };
            }
          })
        })
      })
    };
  }
};

async function run() {
  const start = performance.now();
  await handleRoadmapAction(mockClient, "user_1", "smart_change", {
    roadmapId: "roadmap_1",
    request: "replace old with new"
  });
  const end = performance.now();
  console.log(`Time taken: ${end - start}ms, Queries: ${queries}`);
}

run();
