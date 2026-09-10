#!/bin/bash
bun install
bun run typecheck > ts_errors.txt || true
