import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthBrandIllustration } from '../auth-brand-illustration/auth-brand-illustration';
import { copy } from '../../shared/i18n/copy';

/**
 * The split auth shell: the brand panel on the left, the routed form on the
 * right. It lives in `layout/` because it is chrome AROUND the routed content —
 * and because the brand panel is BYTE-IDENTICAL between the login and register
 * design pages (verified by full `Compare-Object`, zero differences), so it is
 * ONE component, not two copies. `features/` may never import another
 * feature; this is precisely the code both features would otherwise duplicate.
 *
 * It owns the single media query in the whole change. `src/styles.css` carries
 * an EMPTY diff, so 100% of the responsive work is here, in the component
 * stylesheet, and the frozen 15-class primitive vocabulary did not grow.
 *
 * R1: no `box-shadow` declaration and no selector for any of the 15 global
 * primitives appears below, so this component cannot out-specify the
 * primitive's autofill override at `src/styles.css:187-200` — not because it
 * was avoided, but because the possibility was removed.
 */
@Component({
  selector: 'app-auth-shell',
  imports: [AuthBrandIllustration],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShell {
  readonly copy = copy.auth.brand;
}
