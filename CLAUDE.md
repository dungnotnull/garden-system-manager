# CLAUDE.md - System Garden Project

## Project Overview

"System Garden" is a desktop application that visualizes OS processes as 3D creatures in a magical floating garden. Built with Tauri v2 (Rust backend) + React Three Fiber (frontend). The goal is to transform boring process management into a relaxing, god-simulator experience.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri v2 (Monorepo) |
| Backend | Rust + `sysinfo` crate |
| Frontend | Vite + React 18 (TypeScript) |
| 3D Engine | React Three Fiber (`@react-three/fiber`) |
| 3D Helpers | `@react-three/drei`, `@react-three/postprocessing` |
| Animation | `useFrame` + manual tweening (primary), `framer-motion-3d` (supplementary) |
| Styling | TailwindCSS (HUD only) |
| State | Zustand |

## Project Structure

```
garden-sys-manager/
├── src-tauri/                  # Rust backend
│   ├── Cargo.toml
│   ├── capabilities/
│   │   └── default.json        # Tauri v2 permissions (shell, etc.)
│   └── src/
│       └── main.rs             # Process monitor + Tauri commands
├── src/                        # React frontend
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Vite entry
│   ├── components/
│   │   ├── garden/
│   │   │   ├── GardenScene.tsx      # Main 3D scene + lighting + environment
│   │   │   ├── GardenCreature.tsx   # Single process creature (3D + animation)
│   │   │   ├── GrassFloor.tsx       # Stylized ground plane
│   │   │   └── CreatureSpawner.tsx  # Top N processes -> creatures mapping
│   │   ├── hud/
│   │   │   ├── OverlayHUD.tsx       # Glass-morphism stats panel
│   │   │   ├── StatBar.tsx          # Animated CPU/RAM progress bar
│   │   │   └── ActionBar.tsx        # "Send Home" button + controls
│   │   ├── effects/
│   │   │   ├── PoofEffect.tsx       # Death/exit particle effect
│   │   │   └── SparkleEffect.tsx    # High-CPU glow (postprocessing bloom)
│   │   └── loading/
│   │       └── GardenLoading.tsx    # Loading state while first poll completes
│   ├── hooks/
│   │   ├── useProcessStream.ts      # Subscribe to Tauri process events
│   │   └── useSelectedCreature.ts   # Track selected creature state
│   ├── lib/
│   │   ├── scaling.ts              # Non-linear RAM -> scale mapping
│   │   ├── collision.ts            # Spiral placement for spawn positions
│   │   ├── palette.ts              # Pastel Dream color constants
│   │   └── color-assign.ts         # Process name -> deterministic color
│   ├── stores/
│   │   └── gardenStore.ts          # Zustand store (processes, selection, camera)
│   ├── types/
│   │   └── process.ts              # ProcessData interface
│   └── styles/
│       └── index.css               # TailwindCSS base
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── CLAUDE.md
```

## Architecture Decisions

### Rust Backend (src-tauri/src/main.rs)
- Dedicated thread polls system data every 2 seconds using `sysinfo::System`
- Uses `app.emit("process-update", payload)` to push data to frontend
- No frontend polling -- backend streams automatically
- Single Tauri command `send_creature_home(pid)` for process termination
- System processes that cannot be killed are flagged via `is_killable` field
- Tauri v2 permissions must explicitly allow shell:execute in `capabilities/default.json`

### Process Data Payload
```typescript
interface ProcessData {
  pid: number;
  name: string;
  cpu_usage: number;      // 0-100 percentage
  memory_usage: number;   // bytes
  is_responding: boolean;
  is_killable: boolean;   // false for system-critical processes
  started_at: number;     // epoch seconds -- prevents PID reuse mismatch
}
```

### Composite Key for PID Reuse
Windows aggressively reuses PIDs. Use `pid + started_at` as the unique identifier. If the same PID appears with a different `started_at`, treat it as a new process (remove old creature, spawn new one).

### Creature Color Assignment
Colors are deterministic based on process name hash. This means Chrome is always the same color, VS Code is always the same color, etc. Use `hash(process_name) % palette.length` to pick from the Pastel Dream palette.

### Same-Name Process Handling
Multiple processes with the same name (e.g., Chrome renderer processes) are shown individually but labeled distinctly: "Chrome", "Chrome (2)", "Chrome (3)", etc. They each get a creature since they each consume resources independently.

### 3D Rendering Rules
- **Top 15-20 processes** by memory usage become creatures (system-critical processes excluded from killable actions)
- **RAM -> Scale**: Non-linear mapping (sqrt or log) so large processes don't dominate
- **CPU -> Animation Speed**: Frame-loop speed scales with CPU percentage
  - High CPU (>50%): Frantic bouncing + sparkle shader
  - Medium CPU (10-50%): Gentle bobbing
  - Low CPU (<10%): Slow swaying / sleeping animation
- **Frozen state**: `is_responding === false` -> gray material, no animation

### Visual Design
- **Palette**: Pastel Dream -- Mint Green, Soft Pink, Lavender
- **Lighting**: Soft shadows, contact shadows, environment map (sunset/forest)
- **Creatures**: Stylized bouncy slimes or mushrooms
- **HUD**: Glass-morphism overlay (backdrop-blur, semi-transparent)

### Performance Constraints
- `useMemo` for all 3D geometries -- prevent memory leaks on re-render
- Spiral placement for creature positions -- deterministic, no overlap, visually balanced
- Target 60fps with 20 creatures on mid-range hardware
- Process data updates every 2s -- do NOT update 3D scene more frequently than data arrives
- Optimistic UI: kill a creature immediately on "Send Home", reconcile on next data push

### Loading State
The scene will be empty for the first ~2 seconds while waiting for the first Rust emit. Show a "Waking up the garden..." message with a subtle animation during this period.

### Testing Strategy
- **Rust**: Unit tests for process sorting, filtering, and data serialization
- **TypeScript utilities**: Unit tests for `scaling.ts`, `collision.ts`, `color-assign.ts` (pure functions, easy to test)
- **Integration**: Manual testing with `cargo tauri dev` for the 3D scene (automated 3D testing is not cost-effective)
- Test runner: `vitest` for frontend, `cargo test` for Rust

## Naming Conventions

- Components: PascalCase (`GardenCreature.tsx`)
- Hooks: camelCase with `use` prefix (`useProcessStream.ts`)
- Utilities: camelCase (`scaling.ts`, `collision.ts`)
- Types: PascalCase interfaces in dedicated `types/` folder
- Rust functions: snake_case (`send_creature_home`)
- Tauri events: kebab-case (`process-update`)

## Key Dependencies

### Rust (Cargo.toml)
- `tauri` v2
- `sysinfo` -- process monitoring
- `serde` + `serde_json` -- serialization

### Frontend (package.json)
- `@tauri-apps/api` v2 -- Tauri JS bindings
- `@tauri-apps/plugin-shell` -- shell access
- `react`, `react-dom` v18+
- `three`, `@react-three/fiber`, `@react-three/drei`
- `@react-three/postprocessing` -- bloom, vignette for glow effects
- `framer-motion-3d` -- 3D animations (verify compatibility with R3F version)
- `tailwindcss` -- HUD styling
- `zustand` -- state management
- `vitest` -- test runner

## Development Workflow

1. Start Rust backend: `cargo tauri dev` (handles both frontend + backend)
2. Frontend-only: `npm run dev` (Vite hot reload, no Tauri features)
3. Build: `cargo tauri build`
4. Tests (frontend): `npm run test`
5. Tests (Rust): `cargo test`

## Important Rules

- Never mock `sysinfo` data in production builds -- use real process data
- Keep Rust polling thread lightweight -- no allocations inside the hot loop
- All 3D components must handle the case where `processData` array changes length
- "Send Home" must confirm with user before killing a process
- "Send Home" button must be disabled when `is_killable === false`
- No hardcoded colors -- use the Pastel Dream palette from `src/lib/palette.ts`
- Environment map must be bundled locally (no runtime fetch of external assets)
- Kill action is optimistic: remove creature from UI immediately, reconcile with next data push
- Verify `sysinfo` crate API for the pinned version -- the kill/process API has changed across versions
