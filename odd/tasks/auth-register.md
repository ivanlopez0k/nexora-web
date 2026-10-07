# Feature Tasks: auth-register (NEX-20)

## Objective
Implement the Register screen in Angular (Standalone, Reactive Forms) adhering faithfully to the `Nexora Register.html` design prototype, the existing design tokens, and the 9 UI presets.

## Scope
- Presentational component `RegisterForm` in `src/app/shared/auth-forms/register-form/`
- Container page component `AuthRegister` in `src/app/features/auth-register/`
- Route configuration `/register` in `src/app/app.routes.ts`
- Comprehensive unit tests covering the 9 presets and registration flow
- Full test suite passing with Vitest (`npx ng test --no-watch`)

## Constraints
- Strict TDD mode active
- Zero hardcoded colors; use `--nx-*` design tokens exclusively
- Maintain reactive forms separation: form group passed as input/model, pure validation via `auth-validation.ts`
- Use exact copy strings from `src/app/shared/i18n/copy.ts`
- No polyfill or Zone.js dependencies (app is zoneless)
- Conventional Commits only; no Co-Authored-By tags

## Tasks
- [x] **TASK-1**: Create `RegisterForm` presentational component (`register-form.ts`, `register-form.html`, `register-form.css`)
- [x] **TASK-2**: Create `RegisterForm` unit tests (`register-form.spec.ts`) covering all 9 presets (`default`, `focus`, `validation`, `weak`, `mismatch`, `capsLock`, `loading`, `error`, `success`)
- [x] **TASK-3**: Create `AuthRegister` container component and tests (`auth-register.ts`, `auth-register.html`, `auth-register.spec.ts`)
- [x] **TASK-4**: Configure `/register` route in `app.routes.ts` and update `app.routes.spec.ts`
- [x] **TASK-5**: Run full suite verification (`npx ng test --no-watch`: 170/170 passed) and build (`npx ng build`)

## Progress & Next Step
- Status: Completed
- Mirror: Pending (Engram MCP unavailable in session)
- Next Step: Commit changes and transition Jira NEX-20 as needed
