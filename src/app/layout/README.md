# `layout/`

Shell and chrome **around** the routed content.

A layout component owns nothing that a route can own. If it renders the
page's own content rather than wrapping it, it belongs in `features/`.

No files live here yet. The split shell (identity panel + form panel) is
real and needed by both auth pages; it is deferred, not unwanted.
