# `shared/`

Presentational, used by **2+ features**. Not presentational, not `shared/`.

The `nx-*` primitives (field, button, alert, inline error, divider, bar,
spinner and their parts) qualify here, because both auth forms use them.
They are implemented as **global CSS classes in `src/styles.css`**, not as
`shared/` components — that is what keeps them off the `anyComponentStyle`
budget. Use the classes; do not re-declare their visual style in a
component stylesheet.

The primitive vocabulary is closed at 15 base class names. There is **no
`.nx-badge`** and there never will be: the circular icon elements are
`.nx-alert-icon` and `.nx-inline-error-icon`.

No files live here yet.
