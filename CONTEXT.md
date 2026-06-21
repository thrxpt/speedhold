# SpeedHold

A browser extension that temporarily raises a video's playback rate while a key is held, then restores it on release. This file fixes the language the codebase uses for its own domain.

## Language

**Playback Override**:
The module that drives a video above 1× while a gesture is active and restores rate and pause state on release. Owns the rAF enforce loop, the resolved video, and the active/pause snapshot. Lives at `utils/playback-override.ts`.
_Avoid_: speed controller, speeder, rate manager.

**Speed-up Gesture**:
One hold — keydown (or equivalent) to keyup/blur — during which the Playback Override is active.
_Avoid_: hold, press, action.

**Enforce Loop**:
The rAF-driven loop inside the Playback Override that re-asserts `playbackRate` every frame, defeating sites that reset it.
_Avoid_: tick loop, watchdog.

**Resolve**:
Looking up the current `<video>` node on demand (re-resolved per enforce tick), so the override survives SPA node swaps.
_Avoid_: query, find, capture.

**Indicator**:
The overlay shown over the video while a gesture is active. Vue-owned; reads the override's active state. Lives at `entrypoints/content/App.vue`.
_Avoid_: badge, overlay, HUD.

**Settings**:
The live, persisted user config — speed, keybind, indicator visibility. Backed by WXT storage.
_Avoid_: config, options, preferences.
