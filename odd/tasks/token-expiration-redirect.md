# Feature Tasks: token-expiration-redirect (NEX-23)

## Objective
Detect 401 Unauthorized responses from the API, attempt transparent token refresh via `POST /api/auth/refresh`, and if refresh fails, clear the active session and redirect cleanly to `/login` without infinite loops.

## Scope
- Refresh token management in `AuthTokenService` (`auth-token.service.ts` & spec)
- 401 error interception, queueing, and refresh retry logic in `jwt.interceptor.ts`
- Loop prevention on auth endpoints (`/login`, `/register`, `/refresh`)
- Comprehensive tests in `jwt.interceptor.spec.ts`
- Full test suite passing with Vitest (`npx ng test --no-watch`)

## Constraints
- Angular 21 functional interceptor (`HttpInterceptorFn`)
- Avoid circular dependencies by using `HttpBackend` or dedicated refresh handling
- Concurrency-safe: queue parallel 401s during refresh
- Strict TDD mode active
- Conventional Commits only; no Co-Authored-By tags

## Tasks
- [x] **TASK-1**: Add refresh token state to `AuthTokenService` and update tests
- [x] **TASK-2**: Implement 401 handling, refresh retry, and loop protection in `jwtInterceptor`
- [x] **TASK-3**: Write comprehensive tests for 401 handling, refresh queuing, and logout redirect
- [x] **TASK-4**: Run full verification (`npx ng test --no-watch`), build (`npx ng build`), and commit work unit

## Progress & Next Step
- Status: Completed
- Mirror: Ready for PR / Review
- Next Step: Ready for next backlog task (NEX-24 / SCRUM-28)

