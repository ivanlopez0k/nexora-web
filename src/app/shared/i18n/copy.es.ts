/**
 * The Spanish copy contract. 62 user-facing strings, 49 neutral + 13 that the
 * design shipped in rioplatense voseo and that are TRANSLATED here, never
 * lifted. Neutral tuteo is a person shift, not a rewrite: the voseo
 * imperative loses its stress accent (`iniciá` -> `inicia`) and the voseo
 * present becomes tuteo (`tenés` -> `tienes`). Nothing else changes.
 *
 * Rows, their design source and the voseo flag live in `sdd/auth-pages/spec-copy-tables`.
 * `copy.spec.ts` owns the mechanical enforcement of all of it, so this file has
 * no comment budget: every leaf below is one of those 62 rows and no others.
 *
 * A slot is never concatenated into a leaf. The three interpolation sites
 * (login success email, register first name, register email) are stored as
 * prefix / middle leaves and the template interpolates between them, so this
 * module stays translatable.
 */
export const copyEs = {
  auth: {
    /** Shared by both forms. 14 leaves. */
    common: {
      emailLabel: 'Email',
      passwordLabel: 'Contraseña',
      emailPlaceholder: 'nombre@empresa.com',
      emailRequired: 'El email es obligatorio.',
      emailInvalid: 'Ingresa un email válido, por ejemplo nombre@empresa.com.',
      passwordRequired: 'La contraseña es obligatoria.',
      capsLock: 'Bloq Mayús está activado',
      showPassword: 'Mostrar',
      hidePassword: 'Ocultar',
      showPasswordLabel: 'Mostrar contraseña',
      hidePasswordLabel: 'Ocultar contraseña',
      signIn: 'Iniciar sesión',
      createAccount: 'Crear cuenta',
      redirecting: 'Redirigiendo a tu espacio de trabajo…',
    },
    /** 12 leaves. */
    login: {
      title: 'Bienvenido de nuevo',
      subtitle: 'Inicia sesión para continuar.',
      alertTitle: 'Credenciales incorrectas',
      alertBody: 'El email o la contraseña no coinciden. Verifica tus datos e intenta nuevamente.',
      passwordPlaceholder: 'Ingresa tu contraseña',
      submitting: 'Verificando credenciales…',
      noAccountQuestion: '¿No tienes una cuenta?',
      hintLine1: 'Demo · operaciones@nexora.com / nexora2026',
      hintLine2: 'Cualquier otra combinación devuelve error.',
      successTitle: 'Sesión iniciada',
      /** SLOT {email} follows, in a colour that differs from this text. */
      successBody: 'Autenticación correcta como',
      successReset: 'Volver al inicio de sesión',
    },
    /** 31 leaves. */
    register: {
      subtitle: 'Completa tus datos para acceder a la plataforma.',
      alertTitle: 'El email ya está registrado',
      /** The cross-link sentence is split because the link sits inside it. */
      alertBodyPrefix: 'Ya existe una cuenta con este email.',
      alertBodyLink: 'Inicia sesión',
      alertBodySuffix: 'o usa otro email.',
      nameLabel: 'Nombre completo',
      namePlaceholder: 'Nombre y apellido',
      nameRequired: 'El nombre es obligatorio.',
      passwordPlaceholder: 'Crea una contraseña',
      ruleLength: '8+ caracteres',
      ruleUpper: 'Una mayúscula',
      ruleDigit: 'Un número',
      confirmLabel: 'Confirmar contraseña',
      confirmPlaceholder: 'Repite la contraseña',
      passwordRulesFailed: 'La contraseña no cumple los requisitos.',
      confirmRequired: 'Confirma tu contraseña.',
      confirmMismatch: 'Las contraseñas no coinciden.',
      passwordsMatch: 'Las contraseñas coinciden',
      termsPrefix: 'Acepto los',
      termsServiceLink: 'Términos de servicio',
      termsConjunction: 'y la',
      privacyPolicyLink: 'Política de privacidad',
      termsRequired: 'Tienes que aceptar los términos para continuar.',
      submitting: 'Creando cuenta…',
      hasAccountQuestion: '¿Ya tienes una cuenta?',
      hintLine1: 'Demo · operaciones@nexora.com ya está registrado.',
      hintLine2: 'Cualquier otro email válido crea la cuenta.',
      successTitle: 'Cuenta creada',
      /** SLOT {firstName} follows. */
      successBodyPrefix: 'Te damos la bienvenida,',
      /** SLOT {email} follows, after the sentence the design also splits. */
      successBodyMiddle: 'Enviamos un email de confirmación a',
      successReset: 'Volver al registro',
    },
    /** The identity panel, byte-identical in both design pages. 5 leaves. */
    brand: {
      wordmark: 'NEXORA',
      headline: 'Sistema Integral de Gestión Logística',
      description:
        'Envíos, rutas, entregas, flota, incidencias y facturación en una sola plataforma operativa.',
      version: '© 2026 Nexora · v4.8.2',
      status: 'Servicios operativos',
    },
  },
} as const;
