# Feature Tasks: http-jwt-interceptor (NEX-21)

## Objective
Implement an Angular HTTP interceptor (`HttpInterceptorFn`) that automatically attaches the `Authorization: Bearer <token>` header to outgoing HTTP requests without code repetition across services.

## Scope
- `AuthTokenService` (`auth-token.service.ts` and `auth-token.service.spec.ts`) to manage JWT token in application state
- `jwtInterceptor` functional interceptor (`jwt.interceptor.ts` and `jwt.interceptor.spec.ts`)
- Configuration in `src/app/app.config.ts` via `provideHttpClient(withInterceptors([jwtInterceptor]))`
- Full test suite passing with Vitest (`npx ng test --no-watch`)

## Constraints
- Angular 21 functional interceptor (`HttpInterceptorFn`)
- Strict TDD mode active
- Zoneless Angular compatibility
- Conventional Commits only; no Co-Authored-By tags

## Tasks
- [x] **TASK-1**: Implement `AuthTokenService` (`auth-token.service.ts` and `auth-token.service.spec.ts`)
- [x] **TASK-2**: Implement `jwtInterceptor` (`jwt.interceptor.ts`)
- [x] **TASK-3**: Wire `provideHttpClient(withInterceptors([jwtInterceptor]))` into `src/app/app.config.ts`
- [x] **TASK-4**: Create comprehensive tests (`jwt.interceptor.spec.ts`) with `HttpTestingController`
- [x] **TASK-5**: Run verification (`npx ng test --no-watch`: 176/176 passed) and commit work unit

## Progress & Next Step
- Status: Completed
- Mirror: Pending
- Next Step: Transition SCRUM-25 (NEX-21) to En revisión in Jira
