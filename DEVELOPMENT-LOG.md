# DEVELOPMENT-LOG.md - System Garden Progress Tracker

## Project: System Garden
**Start Date:** 2026-05-07
**Status:** Phase 8 Complete

---

## Phase 1: Project Scaffolding
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Initialize Tauri v2 monorepo | Done | Manual scaffold (space in dir name), React + TS + Vite |
| Configure Tauri v2 permissions | Done | capabilities/default.json -- core:default, event permissions |
| Configure Cargo.toml dependencies | Done | tauri 2, sysinfo 0.34, serde 1, serde_json 1 |
| Configure package.json dependencies | Done | three, R3F, drei, postprocessing, zustand, vitest, tailwindcss |
| TailwindCSS setup | Done | v3 with custom mint/pink/lavender/warmwhite colors |
| Generate app icons | Done | Placeholder mint-green icons via tauri icon |
| Verify `cargo tauri dev` launches | Done | Window launches, Vite on :1420, zero errors |

### Notes
- `framer-motion-3d` is deprecated -- will use `useFrame` + manual tweening as primary animation
- Windows parallel builds hit file locking (os error 32) -- use `CARGO_BUILD_JOBS=1` for initial builds
- Rust: rustc 1.95.0, cargo 1.95.0 (PATH: `/c/Users/DUNG/.cargo/bin/`)

---

## Phase 2: Rust Backend Core
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Define ProcessData struct | Done | 7 fields: pid, name, cpu_usage, memory_usage, is_responding, is_killable, started_at |
| Implement polling thread (2s interval) | Done | Dedicated std::thread with System::refresh_processes every 2s |
| Implement process-update event emit | Done | app.emit("process-update", &payload) via tauri::Emitter |
| Implement send_creature_home command | Done | Checks is_killable, uses process.kill(), returns Result<bool, String> |
| Verify sysinfo kill API | Done | sysinfo 0.34: process.kill() wraps kill_with(Signal::Kill), returns bool |
| Rust unit tests | Done | 4 tests pass: system process filtering, name matching, sort order, serialization |
| End-to-end verification | Done | Frontend receives process data via listen(), TypeScript compiles with zero errors |

### Notes
- sysinfo 0.34: `name()` returns `&OsStr` (not `&str`), uses `.to_string_lossy().into_owned()`
- sysinfo 0.34: `Pid::from_u32()` for PID construction
- `is_responding` defaults to `true` -- Windows "Not Responding" is a GUI concept not exposed by sysinfo
- System processes: PID <= 4 or matching 10 known system names (case-insensitive)
- CPU usage is 0% on first poll -- accurate readings start after the 2s initial delay

---

## Phase 3: 3D Garden Scene Foundation
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Canvas + camera setup | Done | Perspective cam at [0,14,20], fov 50, OrbitControls with damping |
| Environment map + lighting | Done | drei Environment preset="sunset", directional + ambient light, warm tones |
| ContactShadows | Done | Purple-tinted contact shadows on ground plane |
| Grass floor mesh | Done | Circular r=14, mint green, roughness 0.85, receives shadows |
| Color palette constants | Done | src/lib/palette.ts -- mint, pink, lavender, warmWhite, gray + 8 palette colors |
| Zustand store | Done | src/stores/gardenStore.ts -- processes, selection, isInitialLoad |
| useProcessStream hook | Done | src/hooks/useProcessStream.ts -- listens to process-update event |
| Loading state component | Done | GardenLoading.tsx -- pulsing animation, "Waking up the garden..." |
| App.tsx wiring | Done | Composes GardenScene + GardenLoading + process stream |

### Notes
- Environment preset loads from CDN at runtime; bundle locally in Phase 8 for offline support
- Camera polar angle clamped to prevent going below the floor
- Shadow map 1024x1024 with proper frustum bounds for the garden area

---

## Phase 4: Creature System
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Color assignment logic (color-assign.ts) | Done | DJB2 hash of name -> deterministic palette index |
| Scaling logic (scaling.ts) | Done | sqrt(memory / 500MB), clamped [0.3, 2.5] |
| Spiral placement (collision.ts) | Done | Deterministic spiral on XZ plane within floor radius |
| Frontend unit tests (vitest) | Done | 15/15 passing -- scaling, placement, color, edge cases |
| GardenCreature mesh + material | Done | Partial sphere (slime shape), pastel MeshStandardMaterial |
| Idle animation (useFrame) | Done | Bobbing + squish/stretch driven by animSpeed |
| RAM -> scale mapping | Done | memoryToScale() via useMemo, smooth entrance scale |
| CPU -> animation speed | Done | Low (<10%): 0.3x, Med (10-50%): 1-2x, High (>50%): 3-7x |
| CPU -> squish amplitude | Done | Low: 0.03, Med: 0.08, High: 0.15 |
| Frozen state (not responding) | Done | Gray material, animSpeed=0, no bobbing |
| Same-name process labeling | Done | Count per name -> "Chrome", "Chrome (2)", etc. |
| CreatureSpawner + composite keys | Done | pid+started_at key, spiral positions, label generation |
| Click selection | Done | onClick on creature -> selectCreature, click floor -> deselect |
| Selection glow | Done | Emissive pulse animation on selected creature |

### Notes
- Creatures start at scale 0.01 and lerp to 1.0 for smooth entrance
- Top sphere indicator scales with creature size for visual weight reference
- Floor click handler uses invisible plane geometry for deselection

---

## Phase 5: Interaction & Camera
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Click-to-select handler | Done | onClick on creature -> selectCreature in Zustand (built in Phase 4) |
| Camera lerp to selected | Done | CameraRig.tsx -- lerps camera position + orbit target toward creature |
| Deselect / return camera | Done | Click floor -> selectCreature(null) -> camera lerps to default overview |
| Selection highlight | Done | Emissive pulse on selected creature (built in Phase 4) |

### Notes
- CameraRig wraps OrbitControls and manipulates target + camera position via lerp
- Uses exponential decay lerp: `1 - Math.exp(-speed * delta)` for framerate-independent smoothing
- Focus position computed from selectedKey + spiralPositions (no extra state needed)
- If selected creature leaves top-20 list, camera returns to overview automatically

---

## Phase 6: HUD & Management
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Glass-morphism overlay panel | Done | OverlayHUD.tsx -- backdrop-blur-xl, bg-black/30, border-white/15 |
| StatBar (CPU + RAM progress bars) | Done | Animated, color-coded (green/yellow/red by ratio) |
| Process info display | Done | Name, PID, CPU bar, RAM bar in detail section |
| "Send Home" button + confirmation | Done | ActionBar.tsx -- window.confirm + invoke("send_creature_home") |
| Disable button for system processes | Done | is_killable === false -> disabled + tooltip |
| Optimistic removal on kill | Done | removeCreatureLocally(pid) then invoke(), reconcile on next push |
| Error handling for termination | Done | Permission denied, process not found, kill failure |

### Notes
- OverlayHUD shows two modes: summary (total CPU/RAM, creature count) and detail (selected creature stats + Send Home)
- HUD replaces the in-scene Html detail panel from Phase 4 -- cleaner separation of concerns
- Fixed bug: removeCreatureLocally now uses startsWith(pid) to match composite keys correctly
- HUD appears after initial load completes (replaces GardenLoading)

---

## Phase 7: Visual Effects
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Poof particle effect | Done | PoofEffect.tsx -- 16 instanced spheres burst outward, fade over 0.8s |
| Bloom glow for high CPU | Done | EffectComposer + Bloom in GardenScene, threshold 0.6, mipmapBlur |
| Fallback if postprocessing too heavy | Done | High-CPU emissive glow works without bloom (pulsing emissive 0.3-0.7) |
| Auto-cleanup after effects | Done | PoofEffect calls removeDyingEffect(id) when animation completes |

### Notes
- Store now tracks `dyingEffects` array with position + color for poof rendering
- `addDyingEffect(pid)` computes spiral position from process index, adds effect, removes from processes -- single atomic update
- High-CPU creatures (>50%) get pulsing emissive glow that triggers bloom (and works as fallback without bloom)
- Selection emissive preserved for non-high-CPU creatures
- ActionBar updated to use `addDyingEffect` instead of `removeCreatureLocally`

---

## Phase 8: Polish & Optimization
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Performance profiling (60fps target) | Done | All 3D values use useMemo, GrassFloor geometry memoized, event listener cleaned up |
| Memory leak check | Done | useProcessStream unsubscribes correctly, PoofEffect has useEffect cleanup |
| Creature enter/exit transitions | Done | Entrance: scale 0->1 lerp (Phase 4). Exit: new isExiting prop lerps 1->0, CreatureSpawner caches departing creatures |
| Window config (title, icon, min-size) | Done | tauri.conf.json: title "System Garden", 1200x800, min 800x600, center:true |
| Production build | Done | `CARGO_TARGET_DIR` to space-free path needed due to Windows os error 32 |
| Admin vs non-admin kill behavior | Done | Non-admin cannot kill system processes (is_killable=false), regular processes killable |

---

## Blockers / Known Issues

- **Windows file locking (os error 32):** Production build fails when `target/` is inside a path with spaces. Workaround: `CARGO_TARGET_DIR=C:/garden-build-target CARGO_BUILD_JOBS=1 npx tauri build`
- **Bundle identifier warning:** `com.systemgarden.app` ends with `.app` (conflicts with macOS bundle extension). Non-blocking for Windows builds.
- **Environment preset loads from CDN:** Requires internet on first launch. Bundle locally for offline support if needed.

---

## Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-07 | Zustand over React Context | Shared state across 3D scene and HUD layers; Context causes unnecessary re-renders in scene tree |
| 2026-05-07 | Spiral placement over grid/random-retry | Deterministic, no overlap by math, visually balanced, no retry loops |
| 2026-05-07 | Name-hash color assignment | Same app always same color across sessions -- consistent UX |
| 2026-05-07 | pid + started_at composite key | Windows reuses PIDs aggressively; prevents showing wrong process under old PID |
| 2026-05-07 | Optimistic removal on kill | Avoids 2-second delay between clicking "Send Home" and creature disappearing |
| 2026-05-07 | @react-three/postprocessing over custom shaders | Bloom/glow is standard; custom shaders are harder to maintain |
| 2026-05-07 | useFrame + manual tweening as primary animation | framer-motion-3d has historically lagged behind R3F updates; useFrame is more stable |

---

## Changelog

### 2026-05-08 (Phase 8)
- Phase 8 polish and optimization complete
- Creature exit transitions: creatures scale down smoothly when leaving top-20 (isExiting prop + cache-based tracking)
- CreatureSpawner caches previous creature data for exit animations
- PoofEffect: added useEffect cleanup for safety on unmount
- Window: added center:true to tauri.conf.json
- Production build verified: requires CARGO_TARGET_DIR on space-free path due to Windows file locking
- Performance review: all useMemo verified, event listener cleanup correct, no memory leaks

### 2026-05-08 (Phase 7)
- Phase 7 visual effects complete
- PoofEffect.tsx: instanced mesh particle burst (16 particles, 0.8s, ease-out)
- Bloom postprocessing added to GardenScene (luminance threshold 0.6, intensity 0.6)
- High-CPU creatures (>50%) get pulsing emissive glow (works with and without bloom)
- Emissive handling moved from static props to useFrame for combined high-CPU + selection logic
- Store extended with dyingEffects tracking for poof animation lifecycle
- ActionBar uses addDyingEffect for optimistic kill with poof effect

### 2026-05-08 (Phase 6)
- Phase 6 HUD and management complete
- OverlayHUD.tsx: glass-morphism panel with summary and detail modes
- Summary mode: creature count, total CPU/RAM stat bars
- Detail mode: process name, PID, CPU/RAM bars, Send Home button
- Fixed removeCreatureLocally key comparison bug (startsWith vs strict equality)
- Removed in-scene Html detail panel from GardenCreature (redundant with HUD)
- HUD appears after initial load, replacing GardenLoading

### 2026-05-07 (Phase 5)
- Phase 5 interaction and camera complete
- CameraRig component with exponential decay lerp for smooth zoom to creature
- Camera returns to overview on deselection or when creature leaves list
- Click selection and emissive glow were already working from Phase 4

### 2026-05-07 (Phase 4)
- Phase 4 creature system complete
- 15 frontend unit tests passing (scaling, placement, color assignment)
- GardenCreature with useFrame animation: CPU -> speed, RAM -> scale, frozen state
- CreatureSpawner with spiral placement and same-name labeling
- Click selection with emissive glow on selected creature
- Floor click for deselection

### 2026-05-07 (Phase 3)
- Phase 3 3D garden scene complete
- Full R3F Canvas with sunset environment, directional + ambient lighting
- Mint green circular ground plane with contact shadows
- Zustand store and useProcessStream hook wired up
- Loading state shown before first process data arrives
- Environment HDR loaded from CDN (needs local bundling for offline)

### 2026-05-07 (Phase 2)
- Phase 2 Rust backend complete
- Process monitoring thread emits top 20 processes every 2 seconds
- send_creature_home command with system process protection
- 4 unit tests passing (filtering, sorting, serialization)
- Frontend verified receiving data via Tauri event system
- Known: is_responding always true (sysinfo limitation on Windows)

### 2026-05-07 (Phase 1)
- Phase 1 scaffolding complete
- All dependencies installed and verified
- `cargo tauri dev` launches successfully
- Known: framer-motion-3d deprecated, Windows file locking with parallel cargo builds

### 2026-05-07
- Project initialized
- CLAUDE.md created with project conventions and architecture
- PLAN.md created with 8-phase implementation plan
- DEVELOPMENT-LOG.md created for progress tracking
- Incorporated review feedback: PID reuse mitigation, Tauri v2 permissions, unkillable processes, optimistic UI, loading state, testing strategy, creature color assignment, spiral placement, same-name handling, postprocessing for effects
