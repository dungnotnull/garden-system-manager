<p align="center">
  <img src="src-tauri/icons/icon.png" alt="System Garden" width="128" />
</p>

<h1 align="center">🌿 System Garden</h1>

<p align="center">
  <strong>Your system processes, reimagined as a living garden.</strong><br/>
  A magical desktop experience that transforms process management into a relaxing 3D world.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/built%20with-tauri%20v2-67d6b9?style=flat-square" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/3D-react%20three%20fiber-ff69b4?style=flat-square" alt="R3F" />
  <img src="https://img.shields.io/badge/rust-backend-orange?style=flat-square" alt="Rust" />
  <img src="https://img.shields.io/badge/tests-19%20passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
</p>

---

## ✨ Overview

**System Garden** transforms the cold, utilitarian world of process monitoring into something warm and alive. Every running process becomes a creature in a 3D garden — bouncing, wandering, and interacting with its world. High-CPU processes glow with energy. Non-responding processes freeze in place. And when you're ready, you can send them home with a satisfying poof.

Built as a native Tauri desktop app, it runs right on your machine with real process data — not simulations. The Rust backend polls system information every 2 seconds while the React Three Fiber frontend brings it all to life.

---

## 🎮 Features

### 🪴 Living Visualizations
- **20 top processes** by CPU usage each rendered as a unique 3D creature
- **Deterministic color assignment** — same app always the same color across sessions
- **Scale reflects RAM usage** — memory-hungry apps appear larger (sqrt-mapped for visual balance)
- **Animation speed maps to CPU** — busy processes bounce faster, idle ones sway gently
- **Frozen state** for non-responding processes — gray, still, hauntingly beautiful

### 🖱️ Interactive Garden
- **Click any creature** to select it — the camera smoothly pans to focus
- **Click the ground** to deselect and return to the overhead view
- **Creatures wander** around their home positions, avoid collisions, and even chat with speech bubbles
- **Exit animations** — creatures shrink away smoothly when they leave the top-20 list

### ⚡ Process Management
- **Send Home button** terminates processes with a delightful **particle poof effect**
- **System process protection** — critical processes flagged uncillable with a clear explanation
- **Optimistic UI** — creature vanishes instantly on kill, reconciles on next data push
- **Grouped processes** — multiple instances of the same app show as `Chrome`, `Chrome (2)`, etc. with expandable detail view

### 🎨 Visual Polish
- **Pastel Dream color palette** — soft mint, pink, lavender tones throughout
- **Bloom postprocessing** — high-CPU creatures emit a warm glow
- **Dynamic weather system** — cycles between sunny, rainy, stormy, and snowy conditions
- **Living surroundings** — animated ocean with waves, tropical islands with palm trees, dolphins, whales, fish schools, seagulls, and sailing boats
- **Glass-morphism HUD** overlay with animated stat bars and real-time process info

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Tauri Shell                      │
│  ┌──────────────┐          ┌──────────────────┐  │
│  │  Rust Backend│  ─emit→  │  React Frontend  │  │
│  │  (sysinfo)   │  event   │  (R3F + Zustand) │  │
│  │              │  ←invoke─│                  │  │
│  │  • Poll 2s   │          │  • 3D Scene      │  │
│  │  • Kill proc │          │  • HUD overlay   │  │
│  │  • Filter    │          │  • Effects       │  │
│  └──────────────┘          └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Tauri v2 | Native window, IPC bridge, build system |
| Backend | Rust + `sysinfo` 0.34 | Process monitoring thread, kill command |
| 3D Engine | React Three Fiber + drei | Garden scene, creatures, effects |
| Postprocessing | `@react-three/postprocessing` | Bloom glow on high-CPU processes |
| State | Zustand | Process data, selection, dying effects |
| Styling | TailwindCSS 3 | Glass-morphism HUD panels |
| Testing | Vitest (TS) + `cargo test` (Rust) | Utilities + process logic |

### Process Data Flow

```
System::refresh_processes() → collect_top_processes()
    → emit("process-update", ProcessData[])
        → useProcessStream() hook → gardenStore.setProcesses()
            → CreatureSpawner → GardenCreature[] rendered in scene
```

### Composite Keys

Windows aggressively reuses PIDs. Each creature uses `name` as its key since processes are grouped, preventing stale data from appearing under recycled PIDs.

---

## 📦 Installation

### Prerequisites

- **Rust** (rustc ≥ 1.95, cargo ≥ 1.95) — [rustup.rs](https://rustup.rs)
- **Node.js** ≥ 18 — [nodejs.org](https://nodejs.org)
- **Windows** (primary target), macOS, or Linux

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/system-garden.git
cd "system-garden"

# Install frontend dependencies
npm install

# Start in development mode
cargo tauri dev
```

The dev window opens at `http://localhost:1420` and automatically launches the Tauri shell.

---

## 🔧 Development

```bash
# Frontend-only dev (no Rust backend)
npm run dev

# TypeScript type-check
npx tsc --noEmit

# Frontend tests
npm run test

# Rust tests
cd src-tauri && cargo test

# Production build
cargo tauri build
```

> **Windows note:** If the production build fails with `os error 32`, use:
> ```bash
> CARGO_TARGET_DIR=C:/garden-build-target CARGO_BUILD_JOBS=1 npx tauri build
> ```

---

## 📁 Project Structure

```
system-garden/
├── src/                            # React frontend
│   ├── main.tsx                    # Vite entry point
│   ├── App.tsx                     # Root component — scene + HUD + loading
│   ├── components/
│   │   ├── garden/
│   │   │   ├── GardenScene.tsx     # Canvas, lighting, bloom, camera rig
│   │   │   ├── GardenCreature.tsx  # Single creature (sphere body, face, animations)
│   │   │   ├── CreatureSpawner.tsx # Maps process groups → creature instances
│   │   │   ├── GrassFloor.tsx      # Stylized ground with trees, animals, birds
│   │   │   └── CameraRig.tsx       # Orbit controls + lerp to selected creature
│   │   ├── hud/
│   │   │   ├── OverlayHUD.tsx      # Glass-morphism stats panel
│   │   │   ├── StatBar.tsx         # Animated CPU/RAM progress bars
│   │   │   └── ActionBar.tsx       # Send Home button + confirmation
│   │   ├── effects/
│   │   │   ├── PoofEffect.tsx      # Particle burst on process termination
│   │   │   └── WeatherSystem.tsx   # Dynamic weather + rain + lightning
│   │   ├── surroundings/
│   │   │   ├── Surroundings.tsx    # Ocean + islands + sea creatures wrapper
│   │   │   ├── Ocean.tsx           # Animated water with wave displacement
│   │   │   ├── Islands.tsx         # Tropical islands with vegetation
│   │   │   ├── PalmTree.tsx        # Procedural palm trees
│   │   │   ├── SeaCreatures.tsx    # Dolphins, whales, fish schools
│   │   │   └── OceanEntities.tsx   # Seagulls, sailing boats
│   │   └── loading/
│   │       └── GardenLoading.tsx   # "Waking up the garden..." screen
│   ├── hooks/
│   │   └── useProcessStream.ts     # Tauri event listener for process-update
│   ├── lib/
│   │   ├── palette.ts              # Pastel Dream color constants
│   │   ├── scaling.ts              # RAM → creature scale mapping
│   │   ├── collision.ts            # Spiral placement algorithm
│   │   └── color-assign.ts         # Process name → deterministic color hash
│   ├── stores/
│   │   └── gardenStore.ts          # Zustand — processes, selection, effects
│   ├── types/
│   │   └── process.ts              # ProcessData + CreatureData interfaces
│   └── __tests__/
│       └── utilities.test.ts       # 15 tests (scaling, placement, color)
│
├── src-tauri/                      # Rust backend
│   ├── src/
│   │   ├── main.rs                 # Entry point → delegates to lib.rs
│   │   ├── lib.rs                  # Tauri builder, polling thread, commands
│   │   └── process.rs              # ProcessData struct, collect/sort/kill logic
│   ├── capabilities/
│   │   └── default.json            # Tauri v2 permissions (core:event)
│   ├── icons/                      # Application icons
│   ├── Cargo.toml                  # Rust dependencies
│   └── tauri.conf.json             # Window config, build settings
│
├── index.html                      # Vite HTML entry
├── package.json                    # Frontend dependencies + scripts
├── vite.config.ts                  # Vite config (port 1420)
├── tailwind.config.js              # Custom mint/pink/lavender colors
├── tsconfig.json                   # Strict TypeScript config
├── CLAUDE.md                       # Project conventions + architecture notes
├── PLAN.md                         # Original 8-phase implementation plan
└── DEVELOPMENT-LOG.md              # Detailed progress tracking
```

---

## 🧪 Testing

### Frontend Tests (15/15 passing)

```bash
npm run test
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| `memoryToScale` | 6 | Zero/negative clamp, sqrt mapping, monotonic increase |
| `spiralPositions` | 5 | Empty count, correct length, radius bounds, determinism |
| `nameToColor` | 4 | Valid palette, deterministic, different names, empty string |

### Rust Tests (4/4 passing)

```bash
cd src-tauri && cargo test
```

| Test | Purpose |
|------|---------|
| `test_is_system_process_low_pid` | PID ≤ 4 marked as system |
| `test_is_system_process_by_name` | Known system names flagged, regular apps not |
| `test_collect_top_processes_returns_sorted` | Descending memory order, max 20 |
| `test_process_data_serialization` | JSON roundtrip preserves all 7 fields |

---

## 🎨 Color Palette

| Swatch | Name | Hex | Use |
|--------|------|-----|-----|
| 🟢 | Mint Green | `#A8E6CF` | Grass floor, stat bars (low) |
| 🩷 | Soft Pink | `#FFB7B2` | Creature colors, highlights |
| 🟣 | Lavender | `#B5A8D5` | Creature colors, atmosphere |
| 🟡 | Warm White | `#FFF5E4` | Ambient light, base tone |
| ⚪ | Gray | `#808080` | Frozen/not-responding creatures |

---

## 📋 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Zustand over React Context | Context causes unnecessary re-renders in the 3D scene tree |
| Spiral placement over grid/random | Deterministic, zero overlap by math, no retry loops |
| Name-hash color assignment | Same app always same color — consistent UX across sessions |
| `useFrame` + manual tweening over framer-motion-3d | More stable with R3F updates; no dependency churn |
| Optimistic removal on kill | Instant visual feedback instead of 2-second delay |
| `@react-three/postprocessing` over custom shaders | Bloom is standard; maintainability over novelty |
| Grouped processes by name | Chrome's 12 renderer processes become one grouped creature instead of cluttering the garden |
| Pinned `sysinfo` 0.34 | Kill API changed across versions; explicit pin prevents breakage |

---

## ⚠️ Known Issues

- **Windows file locking (os error 32):** Production builds targeting a path containing spaces can fail. Use `CARGO_TARGET_DIR` to a space-free path as workaround.
- **Bundle identifier warning:** `com.systemgarden.app` ends in `.app` which conflicts with macOS bundle extensions. Non-blocking for Windows builds.
- **Environment HDR loads from CDN:** The sunset environment preset fetches from a CDN on first launch. Requires internet connectivity for the initial load.
- **`is_responding` always `true`:** The `sysinfo` crate does not expose the Windows "Not Responding" GUI concept. This field is reserved for future platform-specific implementations.

---

## 📄 License

MIT © 2026

---

<p align="center">
  <sub>Built with ❤️ and a lot of CPU cycles</sub>
</p>
