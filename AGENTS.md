# AGENTS: PROJECT WORKSPACE GUIDELINES

This document defines the mandatory architecture, workflow, security requirements, coding standards, and quality controls for all AI coding agents working in this repository.

These instructions apply to every AI coding agent, including Antigravity, Claude Code, Codex, and other compatible coding agents.

All agents must read and follow this document before performing any repository-level task.

---

# 1. CORE DIRECTIVES

## 1.1 Instruction Priority

All agents must follow these instructions in the following order:

1. Explicit user requirements for the current task.
2. Security, data integrity, and application correctness.
3. This `AGENTS.md` workspace guidelines.
4. Root `DESIGN.md` for all visual and UI requirements.
5. Existing project architecture and established conventions.
6. General coding preferences.

Never ignore explicit requirements or silently change established architecture.

If instructions conflict, identify the conflict and explain the impact before making significant architectural changes.

## 1.2 Design System Compliance

For any UI, frontend, styling, or interface-related task:

1. Read the root `DESIGN.md` before implementation.
2. Treat `DESIGN.md` as the single source of truth for Omni's visual identity and design system.
3. Follow its typography, color tokens, spacing, layout, component specifications, and responsive rules.
4. Do not invent a different visual direction.
5. Do not introduce arbitrary design tokens.
6. Preserve Omni branding, logo, product naming, and existing functionality.
7. Validate significant UI changes against the defined design standards.

Primary visual reference:

https://antislop.ai.id/install

The reference must be inspected when establishing or revising the Omni design system. Refer to `DESIGN.md` for the actual extracted specifications.

`AGENTS.md` defines how agents work. `DESIGN.md` defines how Omni looks.

Do not duplicate the full design system inside this document.

## 1.3 Anti-Slop Quality Enforcement

Anti-Slop is mandatory for all applicable implementation tasks.

Active mode: **DURING**.

Agents must continuously apply all applicable:

- Hard Gate rules.
- Purpose-Gate rules.
- Quality Lock rules.
- Code quality requirements.
- UI quality requirements.
- Writing quality requirements.

Anti-Slop must be applied during:

- Planning.
- Code generation.
- Implementation.
- Refactoring.
- UI development.
- Documentation.
- Code review.

Do not treat Anti-Slop as a final audit only.

If an implementation violates an applicable rule, correct it before continuing.

Do not claim Anti-Slop compliance without actually following the installed rules.

## 1.4 No Em Dashes

Strict adherence to Anti-Slop Rule R-02.

Never use the em dash character (`—`) in generated:

- Source code.
- Comments.
- Documentation.
- UI strings.
- Error messages.
- Logs.
- Commit messages.
- Generated text.

Use commas, colons, hyphens, or parentheses instead.

## 1.5 Environment Isolation

Never access `process.env.PORT` or `process.env.HOST` directly inside application entry files.

Every package must define and consume configuration through its centralized configuration module.

Accepted configuration locations:

- `src/config.ts`
- `src/config/env.ts`

Application entry points must consume exported configuration values.

Frontend applications must centralize Vite environment access through `src/config/env.ts`.

## 1.6 Architecture Preservation

Before modifying any code:

1. Inspect the affected package.
2. Understand its architecture and responsibilities.
3. Identify existing components, services, utilities, and configuration.
4. Reuse existing abstractions when appropriate.
5. Avoid unnecessary dependencies.
6. Avoid duplicated functionality.
7. Preserve existing interfaces unless changes are required.
8. Avoid unrelated modifications.
9. Maintain compatibility between packages.

Do not introduce a new framework, database, runtime, or architectural pattern without explicit user approval.

---

# 2. WORKSPACE ARCHITECTURE

The workspace consists of five independent packages and platforms.

```text
/working-space/
├── desktop-platform/    # Desktop application (Tauri v2 + React 19)
├── mobile-platform/     # Mobile application (iOS & Android via Tauri v2 + React 19)
├── web-platform/        # Browser application (Vite + React 19)
├── web-service/         # WebSocket communication server
├── web-storage/         # CDN file storage service
├── documents/           # Specifications and documentation
├── DESIGN.md            # Omni Design System
└── AGENTS.md            # AI agent instructions
```

## 2.1 Desktop Platform

Location:

`/working-space/desktop-platform`

Technology stack:

- Tauri 2.12+
- React 19
- TypeScript
- Vite 8
- Rust 1.98+

Responsibilities:

- Run the local desktop application.
- Generate pairing offers using `PAIR-XXXX-YYYY`.
- Display challenge codes (`ccode`) and unique slugs.
- Connect to the centralized WebSocket server.
- Invoke native Rust IPC commands, including `greet`.
- Maintain desktop-side connection and pairing state.
- Participate in secure communication with the browser client.

Execution scripts:

- `npm run dev`: Starts local Vite frontend server on port 1420.
- `npm run tauri dev` or `npm run tauri:dev`: Runs full desktop app in development mode with native window and hot reloading.
- `npm run build`: Type-checks and compiles production frontend assets.
- `npm run tauri build` or `npm run tauri:build`: Packages release desktop binary and distribution bundles.

Rust native backend:

- Directory: `src-tauri`
- Commands check: `cargo check`
- Native compilation: `cargo build`

Configuration:

`src/config/env.ts`

Environment variables:

- `VITE_WS_URL`

All frontend environment access must be centralized.

## 2.2 Web Platform

Location:

`/working-space/web-platform`

Technology stack:

- React 19
- TypeScript
- Vite 8

Responsibilities:

- Run the browser client.
- Connect to the centralized WebSocket server.
- Accept pairing codes.
- Accept challenge codes.
- Submit pairing verification requests.
- Participate in authenticated communication.
- Maintain browser-side connection state.
- Handle incoming and outgoing messages.

Configuration:

`src/config/env.ts`

Environment variables:

- `VITE_WS_URL`

## 2.3 Mobile Platform

Location:

`/working-space/mobile-platform`

Technology stack:

- Tauri 2.12+ (iOS & Android targets)
- React 19
- TypeScript
- Vite 8
- Rust 1.98+

Responsibilities:

- Run the mobile application targeting iOS and Android.
- Support mobile viewport and safe-area insets (`env(safe-area-inset-*)`).
- Accept pairing codes using 8-digit segmented OTP input.
- Generate mobile host pairing offers (`PAIR-XXXX-YYYY`).
- Connect to the centralized WebSocket server.
- Invoke native Rust IPC commands: `greet`, `get_storage_stats`, and `get_mobile_device_info`.
- Support mobile touch interactions, ribbon carousel, and live stream.

Execution scripts:

- `npm run dev`: Starts local Vite frontend server on port 1421.
- `npm run build`: Type-checks and compiles production mobile assets.
- `npm run tauri:dev`: Runs mobile app in development mode.
- `npm run tauri:ios:init` / `npm run tauri:ios:dev`: Manages iOS mobile target.
- `npm run tauri:android:init` / `npm run tauri:android:dev`: Manages Android mobile target.

Configuration:

`src/config/env.ts`

Environment variables:

- `VITE_WS_URL`

All frontend environment access must be centralized.

## 2.4 Web Service

Location:

`/working-space/web-service`

Technology stack:

- Node.js 24+
- TypeScript 5+
- `ws` 8+

Default port:

`8080`

Responsibilities:

- Operate as the centralized WebSocket hub.
- Manage handshake initialization.
- Generate cryptographic pairing credentials.
- Manage pairing expiration.
- Enforce brute-force protection.
- Authenticate paired clients.
- Maintain session state.
- Route secure messages between paired clients.
- Manage WebSocket connection lifecycle.

Configuration:

`src/config.ts`

Exports:

`ENV`

All server configuration must be centralized.

## 2.5 Web Storage

Location:

`/working-space/web-storage`

Technology stack:

- Node.js 24+
- TypeScript 5+
- `mime-types`

Default port:

`9000`

Responsibilities:

- Operate as a standalone HTTP static CDN service.
- Serve files through `/cdn/:filename`.
- Accept uploads through `POST /cdn/upload`.
- Store files in an externally configured directory.
- Detect and return appropriate MIME types.
- Protect all file operations against path traversal.

Storage configuration:

- Environment variable: `CDN_FOLDER`
- Default directory: `cdn-global`

Configuration:

`src/config.ts`

Exports:

`ENV`

All storage operations must use centralized configuration.

---

# 3. PACKAGE BOUNDARIES AND RESPONSIBILITIES

Maintain clear separation between packages.

## 3.1 Desktop Platform Boundary

Desktop platform is responsible for local device operations and native integration.

It must not become the authority for centralized authentication or server-side pairing validation.

Security-sensitive decisions must remain on the server.

## 3.2 Web Platform Boundary

Web platform is responsible for browser-side interaction and communication.

It must not independently authorize its own pairing session.

All pairing verification must be validated by `web-service`.

## 3.3 Web Service Boundary

Web service is responsible for:

- Pairing authority.
- Credential generation.
- Authentication.
- Rate limiting.
- Session management.
- WebSocket routing.
- Secure communication.

Do not move these responsibilities into frontend packages.

## 3.4 Web Storage Boundary

Web storage is responsible for:

- File upload.
- Static file delivery.
- MIME type handling.
- Storage directory management.
- File path validation.

Do not mix WebSocket session management into the storage service.

Do not introduce unrelated business logic into the storage service.

---

# 4. SECURITY AND COMMUNICATION PROTOCOLS

All security-sensitive changes must preserve the following requirements.

## 4.1 Pairing Codes

Pairing credentials must:

1. Be generated using Node.js `crypto.randomBytes`.
2. Include random uppercase alphanumeric characters.
3. Include a challenge code (`ccode`).
4. Include a unique slug.
5. Include a 256-bit session token.
6. Expire within 10 minutes.

Expiration configuration:

`PAIR_CODE_EXPIRY_MS`

Security requirements:

- Never use predictable random number generation.
- Never trust client-generated credentials.
- Never expose session tokens in URLs.
- Never log sensitive pairing credentials.
- Never accept expired pairing codes.

## 4.2 Brute Force Protection

Enforce rate limiting per client IP address.

Requirements:

- Maximum 5 consecutive failed attempts per pairing code.
- Invalidate pairing codes after 5 incorrect attempts.
- Maximum 10 attempts per minute per IP address.
- Reset or expire counters according to the defined security policy.
- Prevent repeated attempts from bypassing the rate limit.
- Reject invalidated pairing codes.

Do not expose detailed authentication information that could help attackers enumerate valid pairing codes.

## 4.3 Secure Point-to-Point Messaging

Always route authenticated messages using the verified `pairToken`.

Requirements:

- Verify pairing sessions before routing messages.
- Associate paired clients with authenticated sessions.
- Route messages only to the intended paired client.
- Reject unauthorized message routing.
- Prevent unauthorized sockets from receiving paired messages.
- Validate message payloads.
- Handle disconnected or expired sessions.
- Never broadcast sensitive messages to unauthenticated sockets.

Client-provided pairing information must never replace server-side verification.

## 4.4 Path Traversal Protection

All file operations in `web-storage` must validate paths.

Requirements:

1. Normalize paths using `path.normalize`.
2. Resolve the final target path.
3. Verify the resolved target remains within `STORAGE_PATH`.
4. Reject traversal attempts.
5. Never trust filenames directly supplied by clients.
6. Prevent access outside the configured storage directory.

Do not rely only on string replacement or simple substring checks.

Use proper path resolution and containment validation.

## 4.5 Sensitive Data Handling

Never expose:

- Session tokens.
- Authentication credentials.
- Private keys.
- Environment secrets.
- Internal security configuration.
- Sensitive user data.

Do not include sensitive information in application logs or error responses.

---

# 5. CODING STANDARDS

## 5.1 TypeScript Hygiene

Use strict TypeScript practices.

Requirements:

- Avoid `any` whenever explicit types or generics are possible.
- Prefer explicit types for important public interfaces.
- Avoid unsafe type assertions.
- Avoid unnecessary non-null assertions.
- Handle nullable values explicitly.
- Define proper API contracts.
- Keep types close to their domain.
- Avoid duplicated type definitions.
- Avoid unnecessary complexity.

For enum-like definitions, prefer:

```typescript
const STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
} as const

type Status = (typeof STATUS)[keyof typeof STATUS]
```

This pattern must remain compatible with:

`erasableSyntaxOnly: true`

## 5.2 React Standards

For `desktop-platform` and `web-platform`:

- Use React 19.
- Use TypeScript.
- Prefer functional components.
- Use hooks appropriately.
- Keep component responsibilities focused.
- Avoid unnecessary state.
- Avoid unnecessary re-renders.
- Keep side effects inside appropriate hooks.
- Clean up WebSocket listeners and subscriptions.
- Handle loading, error, empty, and success states.
- Maintain accessible interactive elements.
- Reuse established components.
- Follow the root `DESIGN.md`.

Do not introduce unnecessary state management libraries.

## 5.3 Code Organization

Requirements:

- Keep modules focused.
- Separate business logic from presentation.
- Separate configuration from application logic.
- Reuse utilities when appropriate.
- Avoid duplicated implementations.
- Maintain consistent naming.
- Keep package boundaries clear.
- Avoid oversized components.
- Avoid unnecessary abstractions.

Do not refactor unrelated files without a clear technical reason.

## 5.4 Comment Hygiene

Do not write decorative divider banners.

Avoid:

```typescript
// ===============================
// USER SERVICE
// ===============================
```

Do not write comments that merely restate the code.

Avoid vague placeholders:

```typescript
// TODO: fix this later
```

Comments must explain intent, constraints, or non-obvious behavior.

## 5.5 No External UI Patch Scripts

Never use standalone Python, Bash, or Node string-replacement scripts to patch CSS or HTML files in place.

This follows Anti-Slop Rule R-33.

Implement styling directly within project components, stylesheets, and design system files.

Do not use external patch scripts to bypass proper implementation.

---

# 6. CONFIGURATION MANAGEMENT

Every package must use centralized configuration.

## 6.1 Frontend Configuration

Packages:

- `desktop-platform`
- `web-platform`

Configuration location:

`src/config/env.ts`

Read Vite environment variables through this module.

Example:

```typescript
export const ENV = {
  WS_URL: import.meta.env.VITE_WS_URL,
} as const
```

Do not access `import.meta.env` directly throughout unrelated components.

Validate required values where appropriate.

## 6.2 Backend Configuration

Packages:

- `web-service`
- `web-storage`

Configuration locations:

- `web-service/src/config.ts`
- `web-storage/src/config.ts`

Export centralized configuration through `ENV`.

Example:

```typescript
export const ENV = {
  PORT: Number(process.env.PORT ?? 8080),
  HOST: process.env.HOST ?? '0.0.0.0',
} as const
```

Application entry points must consume exported values.

Do not duplicate environment access across modules.

## 6.3 Configuration Validation

Validate configuration at application startup.

Requirements:

- Detect missing required variables.
- Validate numeric configuration.
- Apply documented defaults.
- Fail early for invalid configuration.
- Avoid silently accepting invalid security settings.
- Never expose secret values in logs.

---

# 7. ERROR HANDLING AND LOGGING

All packages must implement predictable error handling.

Requirements:

- Do not silently swallow errors.
- Return meaningful error messages.
- Do not expose internal stack traces to production clients.
- Avoid logging credentials or sensitive tokens.
- Use appropriate HTTP status codes.
- Handle WebSocket connection errors.
- Handle unexpected disconnections.
- Handle invalid message payloads.
- Handle invalid configuration.
- Handle storage failures.

Logs should provide enough context to diagnose problems without exposing sensitive information.

---

# 8. DEPENDENCY MANAGEMENT

Before adding a dependency:

1. Check whether the required functionality already exists.
2. Check whether an installed dependency can solve the problem.
3. Evaluate maintenance and compatibility.
4. Consider package size and runtime impact.
5. Avoid unnecessary overlapping libraries.
6. Confirm compatibility with the existing Node.js and frontend versions.

Do not introduce dependencies without a clear technical reason.

Do not upgrade major dependencies without explicit approval when the change could affect architecture or compatibility.

Preserve the existing package manager and lockfiles.

---

# 9. DOCUMENTATION STANDARDS

Keep project documentation accurate and maintainable.

Use the following separation:

| File | Responsibility |
|---|---|
| `AGENTS.md` | AI agent instructions and coding rules |
| `DESIGN.md` | Omni visual design system |
| `documents/architecture.md` | System architecture |
| `documents/specifications/` | Functional and technical specifications |

Rules:

- Do not duplicate design tokens inside `AGENTS.md`.
- Do not place AI workflow instructions inside `DESIGN.md`.
- Update architecture documentation when architecture changes.
- Update specifications when functional contracts change.
- Keep documentation consistent with actual implementation.
- Do not invent completed features or capabilities.

---

# 10. BUILD AND VERIFICATION COMMANDS

Before delivering changes, verify every affected package.

## 10.1 Web Service

```bash
cd /working-space/web-service
npm run build
```

## 10.2 Web Storage

```bash
cd /working-space/web-storage
npm run build
```

## 10.3 Desktop Platform

Frontend type-check and build:

```bash
cd /working-space/desktop-platform
npm run build
```

Native Rust backend verification:

```bash
cd /working-space/desktop-platform/src-tauri
cargo check
```

Desktop development runtime:

```bash
cd /working-space/desktop-platform
npm run tauri dev
# or: npm run tauri:dev
```

Desktop release bundle build:

```bash
cd /working-space/desktop-platform
npm run tauri build
# or: npm run tauri:build
```

## 10.4 Web Platform

```bash
cd /working-space/web-platform
npm run build
```

## 10.5 Mobile Platform

Frontend type-check and build:

```bash
cd /working-space/mobile-platform
npm run build
```

Native Rust backend verification:

```bash
cd /working-space/mobile-platform/src-tauri
cargo check
```

Mobile development commands:

```bash
cd /working-space/mobile-platform
npm run tauri:ios:init       # Initialize iOS project
npm run tauri:ios:dev        # Run iOS Simulator / Device
npm run tauri:android:init   # Initialize Android project
npm run tauri:android:dev    # Run Android Emulator / Device
```

## 10.6 Verification Requirements

For each affected package:

1. Run the relevant build command.
2. Resolve TypeScript errors.
3. Resolve build errors.
4. Run relevant tests.
5. Check affected functionality.
6. Check package integration.
7. Verify configuration changes.
8. Verify security-sensitive changes.
9. Perform visual validation for UI changes.

Do not claim a build succeeded if it was not executed.

Do not claim tests passed if they were not executed.

If a command cannot run because of missing dependencies, environment limitations, or unavailable services, report the exact limitation.

A task is complete only when all affected packages have been verified.

---

# 11. MANDATORY IMPLEMENTATION WORKFLOW

All coding agents must follow this workflow.

## Phase 1: Understand

- Read `AGENTS.md`.
- Understand the user request.
- Identify the task scope.
- Identify affected packages.
- Identify relevant constraints.

## Phase 2: Inspect

- Inspect existing source code.
- Inspect package configuration.
- Inspect existing architecture.
- Identify reusable components.
- Identify integration points.

For UI tasks:

- Read root `DESIGN.md`.
- Inspect relevant design specifications.
- Inspect the reference website when establishing or revising visual design.

For backend tasks:

- Inspect configuration.
- Inspect communication contracts.
- Inspect security requirements.
- Inspect affected services.

## Phase 3: Plan

Before implementation:

- Identify affected files.
- Define required changes.
- Identify potential regressions.
- Preserve package boundaries.
- Reuse existing abstractions.
- Identify required tests.

Keep the implementation plan proportional to the task.

Do not over-engineer simple changes.

## Phase 4: Implement

- Follow this document.
- Apply Anti-Slop DURING.
- Follow centralized configuration.
- Preserve existing behavior.
- Follow `DESIGN.md` for UI changes.
- Maintain security requirements.
- Avoid unrelated modifications.

## Phase 5: Verify

- Run relevant builds.
- Run relevant tests.
- Verify affected functionality.
- Validate security-sensitive behavior.
- Compare screenshots for significant UI changes.
- Fix detected issues.

## Phase 6: Report

Provide a concise implementation report containing:

1. Summary of changes.
2. Affected packages.
3. Important files modified.
4. Build results.
5. Test results.
6. Security verification, when applicable.
7. Visual comparison results, when applicable.
8. Remaining issues and limitations.

Clearly distinguish verified results from assumptions.

---

# 12. FINAL QUALITY GATES

Evaluate all applicable quality gates before marking a task complete.

## 12.1 Architecture Gate

- [ ] Correct package boundaries maintained.
- [ ] Existing architecture preserved.
- [ ] No unnecessary dependencies introduced.
- [ ] Configuration centralized.
- [ ] No unrelated modifications.

## 12.2 Code Quality Gate

- [ ] TypeScript hygiene maintained.
- [ ] No avoidable `any` types.
- [ ] No decorative comment banners.
- [ ] No meaningless comments.
- [ ] No external UI patch scripts.
- [ ] Anti-Slop rules followed.

## 12.3 Security Gate

- [ ] Pairing credentials generated securely.
- [ ] Pairing expiration enforced.
- [ ] Brute-force protection maintained.
- [ ] Authenticated routing enforced.
- [ ] Sensitive messages protected.
- [ ] Storage path traversal prevented.
- [ ] Secrets excluded from logs and responses.

## 12.4 Design Gate

Applicable to UI tasks:

- [ ] Root `DESIGN.md` inspected.
- [ ] Design tokens consistently applied.
- [ ] Omni brand identity preserved.
- [ ] Existing component patterns reused.
- [ ] Responsive behavior checked.
- [ ] Visual comparison performed when tooling is available.
- [ ] Existing functionality preserved.

## 12.5 Build Gate

- [ ] All affected packages build successfully.
- [ ] No TypeScript errors.
- [ ] Relevant tests pass.
- [ ] Functional behavior verified.
- [ ] Limitations reported honestly.

---

# 13. FINAL AGENT RESPONSIBILITY

Every AI coding agent is responsible for maintaining the quality, security, consistency, and maintainability of the Omni workspace.

The expected outcome is:

- Secure implementation.
- Clean and maintainable code.
- Consistent package architecture.
- Predictable configuration.
- Reliable communication.
- Protected file operations.
- Consistent visual implementation.
- Verified functionality.
- Honest implementation reports.

Never sacrifice security, architecture, or functional correctness for implementation speed.

Never ignore design requirements simply because a generic implementation is easier.

Do not fabricate test results, build results, visual comparisons, or implementation status.

**Understand first. Inspect before changing. Follow the architecture. Apply Anti-Slop DURING. Implement carefully. Verify everything affected. Report honestly.**
