import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthShell } from './auth-shell';
import { copy } from '../../shared/i18n/copy';

/**
 * R2's eight value -> token pairs, and the ONLY colours the illustration is
 * allowed to carry. Listed as token names because the design's literals are
 * exactly what must NOT survive the translation.
 */
const SVG_TOKENS = [
  '--nx-svg-wire',
  '--nx-primary',
  '--nx-svg-node',
  '--nx-accent',
  '--nx-on-status',
  '--nx-link-hover',
  '--nx-text-dim',
  '--nx-link',
];

/** The `network` variant's own labels. Their presence proves WHICH svg shipped. */
const NETWORK_LABELS = ['DEP-BA-01', 'HUB-CBA', 'ENT-4471'];

/** The `routes` and `rings` labels — Tweak experiments, not spec (NG6). */
const REJECTED_VARIANT_LABELS = ['R-12 · ORIGEN', 'CD NORTE', 'ZONA SUR', 'FLOTA · 214'];

/**
 * The COMPILED stylesheet, read from the document the builder injects into.
 * Asserting the compiled text is stronger than asserting the source: it is
 * what the browser receives, scoping attribute included.
 */
function compiledShellCss(): string {
  const tags = Array.from(document.querySelectorAll('style'));
  const own = tags.map((tag) => tag.textContent ?? '').find((css) => css.includes('.brand'));
  if (own === undefined) {
    throw new Error('auth-shell.css was never injected into the document');
  }
  return own;
}

@Component({
  imports: [AuthShell],
  template: `<app-auth-shell><p class="projected">form</p></app-auth-shell>`,
})
class Host {}

describe('AuthShell', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  const q = <T extends Element = HTMLElement>(sel: string) => el.querySelector(sel) as T | null;
  const text = () => el.textContent ?? '';
  const svg = () => q<SVGSVGElement>('svg');
  const svgNodes = () => [svg()!, ...Array.from(svg()!.querySelectorAll('*'))];

  describe('R8 — one brand panel, not two', () => {
    it('renders the brand panel and the form panel as two host sections', () => {
      expect(q('.brand')).not.toBeNull();
      expect(q('.form-panel')).not.toBeNull();
      // ONE panel. A second copy would render a second wordmark below.
      expect(el.querySelectorAll('.brand').length).toBe(1);
    });

    it('projects the routed form into the form panel, and nowhere else', () => {
      expect(q('.form-panel .projected')).not.toBeNull();
      expect(q('.brand .projected')).toBeNull();
    });

    it('renders the wordmark exactly once and every brand string from the copy contract', () => {
      const brand = copy.auth.brand;
      expect(el.querySelectorAll('.wordmark').length).toBe(1);
      expect(q('.wordmark')?.textContent).toBe(brand.wordmark);
      expect(q('.brand__headline')?.textContent).toBe(brand.headline);
      expect(q('.brand__description')?.textContent).toBe(brand.description);
      expect(q('.brand__version')?.textContent).toBe(brand.version);
      expect(q('.brand__status')?.textContent).toContain(brand.status);
    });
  });

  describe('R2 — the illustration is visible', () => {
    it('has a non-zero viewBox and stays aria-hidden', () => {
      const node = svg();
      expect(node).not.toBeNull();
      expect(node!.getAttribute('viewBox') ?? node!.getAttribute('viewbox')).toBe('0 0 600 460');
      expect(node!.getAttribute('aria-hidden')).toBe('true');
    });

    it('carries every colour in a style attribute, because a presentation attribute cannot resolve var()', () => {
      const styles = svgNodes()
        .map((node) => node.getAttribute('style') ?? '')
        .join(';');
      for (const token of SVG_TOKENS) {
        expect(styles).toContain(`var(${token})`);
      }
      // THE TRAP. `fill="var(--nx-accent)"` is valid markup that paints
      // nothing: the whole illustration would render invisible, with no build
      // error, no failing test and no warning.
      expect(svg()!.outerHTML).not.toContain('fill="var(');
      expect(svg()!.outerHTML).not.toContain('stroke="var(');
    });

    it('carries no raw hex anywhere in the svg', () => {
      expect(svg()!.outerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    });

    it('ships the network variant only, never the routes or rings experiments', () => {
      const markup = svg()!.outerHTML;
      expect(el.querySelectorAll('svg').length).toBe(1);
      for (const label of NETWORK_LABELS) {
        expect(markup).toContain(label);
      }
      for (const label of REJECTED_VARIANT_LABELS) {
        expect(markup).not.toContain(label);
      }
    });
  });

  describe("R10 — below 1024px, OUR design, not the design's", () => {
    it('carries exactly ONE media query, and it is at max-width: 1024px', () => {
      const css = compiledShellCss();
      expect(css.match(/@media/g)?.length ?? 0).toBe(1);
      expect(css).toMatch(/@media\s*\(max-width:\s*1024px\)/);
    });

    it('collapses to one column and hides the brand panel inside that query', () => {
      const css = compiledShellCss();
      // `minmax(0, 1fr)`, never a bare `1fr` — same argument as styles.css:210-212.
      expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
      expect(css).toMatch(/\.brand\[[^\]]*\]\s*\{\s*display:\s*none/);
      expect(css).toMatch(/\.form-panel\[[^\]]*\][^}]*padding:\s*24px/);
    });
  });

  describe('D4 — the form panel stays reachable above a 1023x600 viewport', () => {
    it('aligns to flex-start, NOT center, because a centred overflowing item extends block-start', () => {
      const css = compiledShellCss();
      const panel = /\.form-panel\[[^\]]*\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
      expect(panel).toMatch(/align-items:\s*flex-start/);
      expect(panel).not.toMatch(/align-items:\s*center/);
    });
  });
});
