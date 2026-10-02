# Changelog — Centinela

## 2026-10-01 — Mejoras de UX (turnos vs. horas)

Motivo: el usuario ingresó **horas como si fueran turnos** y el resultado se infló (~$3,6M vs $1,6M real). El cálculo estaba bien; la interfaz no explicaba la diferencia.

- ✅ **Nota explicativa** arriba del formulario: "Ingresa el NÚMERO DE TURNOS, no las horas" con ejemplo (48 h ÷ 12 = 4).
- ✅ **Placeholders** con ejemplos en los 5 campos (Ej: 4 / Ej: 2 / Ej: 1 / Ej: 8).
- ✅ **Equivalencia en horas en vivo** debajo de cada campo (ej. "4 → = 48 horas").
- ✅ **Panel "Total de horas del período"** con desglose, total, turnos y validación (✅ normal / ⚠️ supera ~180 h / ⚠️ supera 200 h).
- ✅ **Botón "Cargar desde colilla (horas)"** con modal: se ingresan HORAS y se convierten a turnos (÷12, redondeado). Probado: 44.04 / 44.04 / 24 / 12 → **4 / 4 / 2 / 1** turnos.
- ✅ **Validación**: máx. 15 turnos por campo, sin negativos, aviso si horas extras > 200.
- ✅ **Comparador con "Neto real (opcional)"**: muestra tu cálculo, el neto real y la diferencia.
- ✅ **Valores por defecto realistas** (4 / 4 / 2 / 1 / 8) en lugar de los anteriores (8 / 0 / 4 / 2 / 48) que inducían a error.
- ✅ Corregido un `</html>s` sobrante al final del HTML.
- ⚠️ **Ninguna fórmula de cálculo fue modificada.**

## 2026-10-01 — Verificación con colillas reales + parámetros ajustables

- ✅ **FUN.VIVIR corregido: 12.450 → 12.275** (confirmado con colilla real).
- ✅ **Parámetros editables en la interfaz**: horas nominales, valor hora base, auxilio de transporte, tope IBC y **IBC manual** (sobrescribe el cálculo automático).
- ✅ Los parámetros se guardan junto con los turnos (`localStorage`).
- ✅ Al cambiar "horas nominales" se recalcula el valor hora base (SMMLV ÷ horas).
- ✅ **Verificado que ADMINISTRACIÓN = 2,5% del devengado** (no del IBC) — no se tocó.
- ✅ Confirmado que los devengados no cambian; el fix de FUN.VIVIR resta $175 a las deducciones y suma $175 al neto.
- ⚠️ Pendientes documentados en el README (fórmula del IBC, horas nominales, auxilio, hora extra).

## 2026-10-01 — Auditoría (mejoras seguras)

- ✅ Cargadas librerías **jsPDF** y **SheetJS** (los botones de PDF y Excel ya funcionan).
- ✅ **PWA corregida**: rutas relativas en `manifest.json`, `service-worker.js` y registro del SW; iconos 192/512 generados.
- ✅ **Validación de inputs** (negativos y valores absurdos) con mensajes claros.
- ✅ **Persistencia en `localStorage`** (los turnos no se pierden al recargar) + botón "Limpiar todo".
- ✅ **Accesibilidad**: zoom permitido (quitado `maximum-scale`), aria-labels en botones, disclaimer más visible.
- ✅ **SEO completo**: description, canonical, Open Graph, Twitter, JSON-LD (`WebApplication`).
- ✅ **Archivos de producción**: `sitemap.xml`, `robots.txt`, `404.html`, `privacidad.html`.
- ✅ **README.md** real + este changelog.
- ⚠️ **Cálculos NO modificados** (pendientes de verificación con COOPEVIAN; ver sección en README).
