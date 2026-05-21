# PLAN.md - System Garden Implementation Plan

## Phase 1: Project Scaffolding

### 1.1 Initialize Tauri v2 Monorepo
- [ ] Create Tauri v2 project with `npm create tauri-app@latest`
- [ ] Select: React + TypeScript + Vite template
- [ ] Configure `src-tauri/tauri.conf.json` (window size, title, permissions)

### 1.2 Tauri v2 Permissions
- [ ] Create `src-tauri/capabilities/default.json`
- [ ] Allow shell:execute permissions
- [ ] Allow event:default for process-update emit
- [ ] Verify permissions are not overly broad (least privilege)

### 1.3 Rust Dependencies (Cargo.toml)
- [ ] Add `sysinfo` for process monitoring (pin version, verify API)
- [ ] Add `serde` + `serde_json` for serialization

### 1.4 Frontend Dependencies (package.json)
- [ ] `three`, `@react-three/fiber`, `@react-three/drei`
- [ ] `@react-three/postprocessing` (bloom, vignette for glow effects)
- [ ] `framer-motion-3d` (verify compatibility with pinned R3F version)
- [ ] `tailwindcss` + `postcss` + `autoprefixer`
- [ ] `zustand` (state management)
- [ ] `vitest` (test runner)
- [ ] Configure TailwindCSS in `tailwind.config.js`

**Verify:** `cargo tauri dev` launches a blank window with no errors.

---

## Phase 2: Rust Backend Core

### 2.1 Process Data Struct (main.rs)
- [ ] Define `ProcessData` struct with serde serialization
- [ ] Include fields: pid, name, cpu_usage, memory_usage, is_responding, is_killable, started_at
- [ ] `is_killable` -- exclude system-critical processes (PID <= 4, smss, csrss, wininit, services, lsass)
- [ ] `started_at` -- epoch timestamp to handle PID reuse on Windows

### 2.2 Process Monitor Thread (main.rs)
- [ ] Spawn a dedicated `std::thread` that polls `sysinfo::System` every 2s
- [ ] Refresh system info: `sys.refresh_processes()`
- [ ] Collect top 15-20 processes sorted by `memory_usage`
- [ ] Emit `process-update` event via `app.emit()` (Tauri v2 API)
- [ ] Handle thread cleanup on app exit
- [ ] Verify `sysinfo` kill API for pinned version (API changed: process.kill() vs System::kill_process())

### 2.3 Process Termination Command
- [ ] Implement `send_creature_home(pid: u32)` as `#[tauri::command]`
- [ ] Check `is_killable` before attempting kill -- return error for system processes
- [ ] Kill process using the correct sysinfo API for pinned version
- [ ] Return `Result<bool, String>` indicating success/failure
- [ ] Register command in `tauri::Builder`

### 2.4 Rust Unit Tests
- [ ] Test process sorting (top N by memory)
- [ ] Test system process filtering (is_killable flag)
- [ ] Test ProcessData serialization roundtrip

**Verify:** Rust backend emits process data every 2s. Frontend can listen and log to console. System processes are correctly flagged as unkillable.

---

## Phase 3: 3D Garden Scene Foundation

### 3.1 Scene Setup (GardenScene.tsx)
- [ ] Create `<Canvas>` with proper camera settings (fov, position)
- [ ] Add `<Environment>` preset (sunset or forest) -- bundle locally
- [ ] Add `<SoftShadows>` and `<ContactShadows>`
- [ ] Configure ambient + directional lighting for pastel atmosphere

### 3.2 Grass Floor (GrassFloor.tsx)
- [ ] Create a circular or hexagonal ground plane
- [ ] Apply a stylized green material (mint green base)
- [ ] Add subtle geometry variation (slight bumps or noise displacement)

### 3.3 Color Palette & Lighting
- [ ] Define Pastel Dream palette constants in `src/lib/palette.ts`
  - Mint Green: `#A8E6CF`
  - Soft Pink: `#FFB7B2`
  - Lavender: `#B5A8D5`
  - Warm White: `#FFF5E4`
- [ ] Configure environment lighting to complement palette

### 3.4 Loading State (GardenLoading.tsx)
- [ ] Create loading component: "Waking up the garden..." message
- [ ] Subtle breathing/pulse animation while waiting for first data
- [ ] Conditionally rendered when process list is empty

**Verify:** Scene renders with ground plane, soft shadows, and warm lighting. Camera orbits smoothly. Loading state shows before first data arrives.

---

## Phase 4: Creature System

### 4.1 Color Assignment (color-assign.ts)
- [ ] Implement `nameToColor(processName: string): string`
- [ ] Hash process name -> deterministic palette index
- [ ] Same process name always gets the same color across sessions
- [ ] Unit tests for hash consistency

### 4.2 Scaling Logic (scaling.ts)
- [ ] Implement `memoryToScale(memoryBytes: number): number`
- [ ] Use `sqrt` or `log` mapping to prevent giant creatures
- [ ] Clamp output to [0.3, 2.5] range
- [ ] Unit tests for edge cases (0 bytes, 10GB, etc.)

### 4.3 Collision Avoidance (collision.ts)
- [ ] Implement spiral placement algorithm
- [ ] Given creature count, compute evenly-spaced positions along a spiral on the ground plane
- [ ] Deterministic: same process list always produces same layout
- [ ] No overlap guaranteed by math, no retry loops needed
- [ ] Unit tests for position generation

### 4.4 Single Creature (GardenCreature.tsx)
- [ ] Create a stylized mesh (slime/mushroom shape using SphereGeometry + scaling)
- [ ] Apply pastel-colored material (MeshStandardMaterial) from `color-assign.ts`
- [ ] Implement idle animation with `useFrame` (gentle bobbing)
- [ ] Map `memory_usage` to creature scale via `useMemo` + non-linear function
- [ ] Map `cpu_usage` to animation speed:
  - Low (<10%): slow sway, half-closed eyes
  - Medium (10-50%): moderate bounce
  - High (>50%): rapid bounce + body squish

### 4.5 Frozen State
- [ ] When `is_responding === false`:
  - Switch material to gray (`#808080`)
  - Stop all animations
  - Optional: add frost/ice visual indicator

### 4.6 Same-Name Process Labeling
- [ ] Count processes with same name in current list
- [ ] Label as "Chrome", "Chrome (2)", "Chrome (3)", etc.
- [ ] Each gets its own creature with individual stats

### 4.7 Creature Spawner (CreatureSpawner.tsx)
- [ ] Map `ProcessData[]` to `<GardenCreature>` components
- [ ] Use `pid + started_at` as composite key (handles PID reuse)
- [ ] Compute positions via spiral placement
- [ ] Handle enter animations (scale from 0 to target on mount)
- [ ] Handle optimistic removal on kill (scale to 0, then remove)

### 4.8 Zustand Store (gardenStore.ts)
- [ ] `processes: ProcessData[]` -- current process list
- [ ] `selectedCreatureKey: string | null` -- selected creature composite key
- [ ] `isInitialLoad: boolean` -- true until first data arrives
- [ ] Actions: setProcesses, selectCreature, deselectCreature, removeCreatureLocally

**Verify:** Top processes appear as colored creatures on the garden floor. Scale reflects RAM, speed reflects CPU. Same-name processes labeled distinctly. Loading state shown before first data.

---

## Phase 5: Interaction & Camera

### 5.1 Click Selection
- [ ] Add `onClick` handler to each `<GardenCreature>`
- [ ] Track selected creature in Zustand store
- [ ] Highlight selected creature (outline glow or color shift)

### 5.2 Camera Lerping
- [ ] Use drei's `<CameraControls>` or custom lerp logic
- [ ] On selection: smoothly move camera to focus on clicked creature
- [ ] On deselection: return camera to default overview position
- [ ] Use `useFrame` with `THREE.Vector3.lerp()` for smooth transition

**Verify:** Clicking a creature zooms camera to it smoothly. Clicking elsewhere returns to overview.

---

## Phase 6: HUD & Management

### 6.1 Overlay HUD (OverlayHUD.tsx)
- [ ] Create glass-morphism panel (backdrop-blur, bg-opacity)
- [ ] Display: Process name, PID, CPU%, RAM usage
- [ ] Show animated progress bars for CPU and RAM (StatBar.tsx)
- [ ] Position overlay to not block the 3D view

### 6.2 Stat Bars (StatBar.tsx)
- [ ] Animated progress bar using CSS transitions or Framer Motion
- [ ] Color-coded: Green (low) -> Yellow (medium) -> Red (high)
- [ ] Show percentage label

### 6.3 Action Bar (ActionBar.tsx)
- [ ] "Send Home" button with confirmation dialog
- [ ] Disabled when `is_killable === false` (system processes) with tooltip explaining why
- [ ] Call `invoke("send_creature_home", { pid })` on confirm
- [ ] Optimistic removal: remove creature from UI immediately + play poof effect
- [ ] On next data push (2s later), reconcile -- if process still alive, re-add it
- [ ] Error handling if termination fails (permission denied, etc.)

**Verify:** Selecting a creature shows HUD with real-time stats. "Send Home" kills the process with immediate visual feedback. Button disabled for system processes.

---

## Phase 7: Visual Effects

### 7.1 Poof Effect (PoofEffect.tsx)
- [ ] Particle system that triggers on process termination
- [ ] Scale creature down to 0 + spawn expanding particle cloud
- [ ] Use instanced geometry or sprite-based particles
- [ ] Auto-cleanup after animation completes

### 7.2 Sparkle/Glow Effect (SparkleEffect.tsx)
- [ ] Use `@react-three/postprocessing` bloom for high-CPU glow
- [ ] Bloom intensity mapped to CPU percentage
- [ ] Selective bloom: only affect high-CPU creatures, not the whole scene
- [ ] Fallback to material emissive if postprocessing is too heavy

**Verify:** Killing a process shows poof animation. High-CPU processes glow with bloom effect.

---

## Phase 8: Polish & Optimization

### 8.1 Performance
- [ ] Profile with React DevTools + Chrome DevTools (GPU)
- [ ] Ensure `useMemo` wraps all geometries and materials
- [ ] Verify stable 60fps with 20 creatures
- [ ] Check for memory leaks on long-running sessions

### 8.2 UX Polish
- [ ] Smooth transitions when creatures enter/exit the top-20 list
- [ ] Responsive layout for different window sizes
- [ ] Error boundaries for 3D rendering failures

### 8.3 Final Checklist
- [ ] Window title: "System Garden"
- [ ] Application icon (garden-themed)
- [ ] Min window size constraint
- [ ] Build production bundle with `cargo tauri build`
- [ ] Test on Windows (primary target)
- [ ] Verify process killing works with and without admin privileges

---

## Dependency Graph

```
Phase 1 (Scaffolding + Permissions)
    |
    v
Phase 2 (Rust Backend) -----> Phase 3 (3D Scene)
    |                              |
    v                              v
    +--------- Phase 4 (Creatures) +
                    |
                    v
              Phase 5 (Interaction)
                    |
                    v
              Phase 6 (HUD)
                    |
                    v
              Phase 7 (Effects)
                    |
                    v
              Phase 8 (Polish)
```

Phases 2 and 3 can be developed in parallel. Phases 4-8 are sequential.
