import { handleRoadmapAction } from "./supabase/functions/outstand-ai/roadmap-action.ts";
import * as fs from 'fs';

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
        in: () => ({
          eq: () => ({
            eq: async () => {
              queries++;
              await new Promise(r => setTimeout(r, 2)); // simulate DB roundtrip
              return { error: null };
            }
          })
        }),
        eq: () => ({
          eq: () => ({
            eq: async () => {
              queries++;
              await new Promise(r => setTimeout(r, 2));
              return { error: null };
            }
          })
        })
      })
    };
  }
};

// We will overwrite the function in memory or rewrite the file to benchmark both.
