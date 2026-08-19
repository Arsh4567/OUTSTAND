# Cinematic landing scene

OUTSTAND's landing hero now uses a procedural Three.js mountain-overlook composition inspired by a 15-second cinematic tracking shot:

- sunrise-style amber and violet lighting
- a glass overlook and minimal human silhouette
- layered mountain valley geometry with atmospheric fog
- a luminous golden roadmap path across the terrain
- a slow crane-like camera move from a closer viewpoint to a wider horizon reveal
- reduced-motion and visibility-aware rendering to limit unnecessary GPU work

The scene is intentionally procedural so OUTSTAND does not ship an 8K video binary in the main web bundle. The visual direction can later be replaced by a rendered 8K master without changing the landing-page integration point: `src/components/landing/CinematicScene.tsx`.
