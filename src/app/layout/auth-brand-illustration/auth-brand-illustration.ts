import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The brand illustration, and ONLY the `network` variant.
 *
 * The design exposes three visual variants behind a `visual` prop — `network`,
 * `routes` and `rings` — but its own page caption calls the other two
 * "Visual alternativo en Tweaks", i.e. design-tool experiments rather than
 * spec. So there is no `visual` input here: one component, one svg, and a
 * `visual` prop would be a public API for a decision nobody made.
 *
 * NO stylesheet, by design: every colour resolves through the eight
 * `--nx-*` tokens in the markup, which is what keeps this component off the
 * `anyComponentStyle` budget entirely and makes the token mapping auditable
 * from the template alone.
 */
@Component({
  selector: 'app-auth-brand-illustration',
  templateUrl: './auth-brand-illustration.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthBrandIllustration {}
