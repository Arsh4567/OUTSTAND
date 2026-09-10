import { performance } from "perf_hooks";

function originalReadableError(value: unknown, fallback: string) {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["message", "error", "detail"])
      if (typeof obj[key] === "string" && obj[key].trim()) return obj[key] as string;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function optimizedReadableError(value: unknown, fallback: string) {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const m = obj.message;
    if (typeof m === "string" && m.trim()) return m;
    const e = obj.error;
    if (typeof e === "string" && e.trim()) return e;
    const d = obj.detail;
    if (typeof d === "string" && d.trim()) return d;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

const ITERATIONS = 10000000;

const cases = [
  new Error("Some error"),
  "String error  ",
  { message: "Object message" },
  { error: "Object error" },
  { detail: "Object detail" },
  { other: "Other object" },
  null,
  undefined,
];

console.log("Warming up...");
for (let i = 0; i < 10000; i++) {
  for (const c of cases) {
    originalReadableError(c, "fallback");
    optimizedReadableError(c, "fallback");
  }
}

console.log(`Running benchmark with ${ITERATIONS} iterations per test case...`);

let origTime = 0;
let optTime = 0;

for (const c of cases) {
  const startOrig = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    originalReadableError(c, "fallback");
  }
  origTime += performance.now() - startOrig;

  const startOpt = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    optimizedReadableError(c, "fallback");
  }
  optTime += performance.now() - startOpt;
}

console.log(`Original time: ${origTime.toFixed(2)}ms`);
console.log(`Optimized time: ${optTime.toFixed(2)}ms`);
console.log(`Speedup: ${(origTime / optTime).toFixed(2)}x`);
