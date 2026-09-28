# `core/`

App-wide singletons with **no feature ownership**.

The rule is complete: if a feature would need to know this code's name, it
does not belong here. Anything a feature imports is feature code, and
anything two features import is `shared/`.

No files live here yet. The design-token layer belongs in `src/styles.css`,
not in `core/` — tokens are global CSS, not TypeScript.
