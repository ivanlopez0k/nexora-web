# Feature Tasks: auth-route-guard (NEX-22)

## Objective
Implement Angular route guard (`CanActivateFn`) to protect private routes when there is no active session, redirecting unauthenticated users to `/login`, with optional role-based route access restriction.

## Scope
- Role and claim decoding capabilities in `AuthTokenService` (`auth-token.service.ts` and `auth-token.service.spec.ts`)
- Functional `authGuard` in `src/app/shared/auth/auth.guard.ts`
- Unit tests in `src/app/shared/auth/auth.guard.spec.ts`
- Route integration and validation in `src/app/app.routes.ts` / `src/app/app.routes.spec.ts`
- Full test suite passing with Vitest (`npx ng test --no-watch`)

## Constraints
- Angular 21 functional guard (`CanActivateFn`)
- Strict TDD mode active
- Zoneless Angular compatibility
- Conventional Commits only; no Co-Authored-By tags

## Tasks
- [x] **TASK-1**: Extend `AuthTokenService` with roles and claims extraction (`auth-token.service.ts` & spec)
- [x] **TASK-2**: Implement `authGuard` functional guard (`auth.guard.ts`)
- [x] **TASK-3**: Write comprehensive unit tests for `authGuard` (`auth.guard.spec.ts`)
- [x] **TASK-4**: Configure guard on routes and update `app.routes.spec.ts`
- [x] **TASK-5**: Run full suite verification (`npx ng test --no-watch`: 182/182 passed) and commit work unit

## Progress & Next Step
- Status: Completed
- Mirror: Pending
- Next Step: Transition SCRUM-26 (NEX-22) to En revisión in Jira
