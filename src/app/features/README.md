# `features/`

Route-scoped. **One directory per route.**

Nothing in `features/` may be imported by another feature. If two routes
need the same code, it is not feature code — it is `shared/`.

No files live here yet. The planned routes are `auth-login` and
`auth-register`.
