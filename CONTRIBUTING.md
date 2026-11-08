# CONTRIBUTING TO OMNI FOUNDATION

Thank you for your interest in contributing to the Omni Foundation workspace. This document outlines the technical standards, development workflow, and contribution guidelines for all contributors and coding agents.

---

## 1. Project Mission & Architecture

Omni Foundation is a modular core architecture engineered for real-time, cross-platform applications. It connects native desktop environments, browser interfaces, WebSocket communication hubs, and high-performance CDN static storage.

### Monorepo Structure

```text
/working-space/
├── desktop-platform/    # Desktop App: Tauri v2 + React 19 + TypeScript + Vite
├── web-platform/        # Web App: React 19 + TypeScript + Vite
├── web-service/         # Real-time WebSocket Server: Node.js + TypeScript
├── web-storage/         # Dedicated CDN File Storage: Node.js + TypeScript
├── documents/           # Architectural specifications and protocol documentation
├── DESIGN.md            # Omni Design System visual tokens and principles
├── AGENTS.md            # Agent instructions and workspace guidelines
└── CONTRIBUTING.md      # Contribution standards and development workflow
```

---

## 2. Prerequisites & Setup

Ensure the following runtimes are installed on your machine:

- **Node.js:** v22.0.0 or higher (v24 LTS recommended)
- **npm:** v10.0.0 or higher
- **Rust & Cargo:** v1.80+ (required for desktop Tauri compilation)

### Initial Setup

Install dependencies across all active services:

```bash
# Setup web-service
cd web-service && npm install

# Setup web-storage
cd ../web-storage && npm install

# Setup desktop-platform
cd ../desktop-platform && npm install

# Setup web-platform
cd ../web-platform && npm install
```

---

## 3. Running Services Locally

Start the services in separate terminal windows:

### 1. Web Service (WebSocket Server, Port 8080)
```bash
cd web-service
npm run dev
```

### 2. Web Storage (CDN Service, Port 9000)
```bash
cd web-storage
npm run dev
```

### 3. Desktop Platform (Tauri Desktop App)
```bash
cd desktop-platform
npm run tauri dev   # Runs native desktop application
# or:
npm run dev         # Runs web preview at http://localhost:1420
```

### 4. Web Platform (Browser Client)
```bash
cd web-platform
npm run dev         # Runs web app at http://localhost:5173
```

---

## 4. Engineering & Code Standards

### 1. TypeScript Standards
- Enable strict mode in all packages. Avoid the `any` type whenever a concrete type or generic can be defined.
- To maintain compatibility with `erasableSyntaxOnly: true`, avoid TypeScript runtime enums. Prefer `const` object maps paired with type aliases:
  ```typescript
  export const ClientType = {
    DESKTOP: 'desktop-platform',
    WEB: 'web-platform',
    UNKNOWN: 'unknown',
  } as const;

  export type ClientType = (typeof ClientType)[keyof typeof ClientType];
  ```

### 2. Environment Configuration
- **No inline environment parsing:** Never access `process.env.PORT` or `process.env.HOST` directly inside `src/index.ts` or routing logic.
- All configuration must be defined inside each package's centralized configuration file:
  - `web-service`: [`src/config.ts`](file:///Users/muhammadimamrozali/Products/working-space/web-service/src/config.ts) exporting `ENV`.
  - `web-storage`: [`src/config.ts`](file:///Users/muhammadimamrozali/Products/working-space/web-storage/src/config.ts) exporting `ENV`.
  - `desktop-platform`: [`src/config/env.ts`](file:///Users/muhammadimamrozali/Products/working-space/desktop-platform/src/config/env.ts) exporting `ENV`.
  - `web-platform`: [`src/config/env.ts`](file:///Users/muhammadimamrozali/Products/working-space/web-platform/src/config/env.ts) exporting `ENV`.
- Always maintain an up-to-date `.env.example` in each directory.

### 3. Security & Pairing Protocols
- **Pairing Codes:** Must be cryptographically generated via `crypto.randomBytes`, combining uppercase alphanumeric characters with a challenge code (`ccode`), unique `slug`, and a 256-bit token.
- **Brute Force Defense:** Limit failed pairing attempts to 5 per code, enforce IP rate limits (10 attempts per minute), and enforce a 10-minute code expiry window.
- **Point-to-Point Routing:** Verify the `pairToken` before forwarding private messages between paired sockets.
- **Path Traversal Defense:** In `web-storage`, always sanitize file paths with `path.normalize` and verify that the target path begins with `STORAGE_PATH`.

---

## 5. UI, Copywriting & Anti-Slop Guidelines

For any user interface, styling, or copy work:
1. Consult [`DESIGN.md`](file:///Users/muhammadimamrozali/Products/working-space/DESIGN.md) for color tokens, typography scales, spacing rules, and component patterns.
2. Apply the Anti-Slop quality filter in active **DURING** mode:
   - **Rule R-02 (No Em Dashes):** Never use the em dash character in any text, UI string, or code comment. Use commas, colons, hyphens, or parentheses instead.
   - **Rule R-26 (Functional Completeness):** Every button and interactive control must perform a functional action. Never ship dead buttons.
   - **Rule R-27 (UI States):** Data displays must handle empty, loading, and error states gracefully.
   - **Rule R-31 (Articulated Reason):** Every major design and structural decision must have an articulable reason.
   - **Rule R-32 (Keyboard Accessibility):** All controls must be navigable via `Tab` and `Shift+Tab`, activatable via `Enter` or `Space`, and display a clear focus ring.
   - **Rule R-33 (No Patch Scripts):** Never write standalone string replacement scripts to patch CSS or HTML files in place. Build styles directly into component code.

### Code Comment Hygiene
- Do not write decorative divider banners like `// =================`.
- Do not write comments that merely restate what the code clearly says.
- Do not commit vague placeholders like `// TODO: fix this later`.

---

## 6. Pre-Commit Verification Checklist

Before opening a pull request or submitting code changes, verify all packages:

```bash
# Verify web-service
cd web-service && npm run build

# Verify web-storage
cd ../web-storage && npm run build

# Verify desktop-platform
cd ../desktop-platform && npm run build

# Verify web-platform
cd ../web-platform && npm run build
```

A contribution is accepted only when:
- [ ] All package builds succeed without TypeScript errors.
- [ ] No inline `process.env` calls exist in application entry files.
- [ ] Security rules (anti-brute force, token verification, path traversal checks) are maintained.
- [ ] UI changes align with the Omni Design System in [`DESIGN.md`](file:///Users/muhammadimamrozali/Products/working-space/DESIGN.md).
- [ ] Rule R-02 is strictly respected (zero em dashes in copy and comments).

