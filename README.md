# Centinela — Nómina Simple COOPEVIAN

Herramienta web de apoyo para la **liquidación de nómina y turnos** de los asociados de COOPEVIAN. Permite ingresar los turnos trabajados en la quincena y obtener el devengado, las deducciones y el neto a pagar, para **comparar contra la colilla oficial**.

> ⚠️ **Herramienta de apoyo.** No reemplaza la colilla oficial emitida por la cooperativa.

## Uso

1. Selecciona **mes** y **quincena**.
2. Ingresa los **turnos** (diurnos, nocturnos, festivos diurnos/nocturnos) y las **horas extras**.
3. Pulsa **"Calcular liquidación"**.
4. Revisa la tabla y, si quieres, **compara con tu colilla real**.
5. Exporta a **PDF**, **Excel** o **imprime**.

## Qué calcula

- **Devengados**: compensación ordinaria (diurna/nocturna), descansos, festivos, horas extra, auxilios y bonificación semestral.
- **Deducciones**: EPS, pensión, cuota de administración, póliza, fondo de incapacidad, etc.
- **IBC** (Ingreso Base de Cotización) y **neto a pagar**.

## Parámetros editables desde la interfaz

En la tarjeta **"Parámetros del período"** puedes ajustar estos valores **sin tocar código** (se guardan en tu navegador):

| Campo | Por defecto | Para qué sirve |
|---|---|---|
| Horas nominales | 220 | Al cambiarlo, recalcula el valor hora base = SMMLV ÷ horas |
| Valor hora base | 7.958,6591 | Tarifa por hora usada en los turnos |
| Auxilio transporte (quincenal) | 118.160 | Auxilio del período |
| Tope IBC | 2.826.775 | Tope máximo del IBC |
| **IBC manual** (opcional) | *(vacío)* | Si lo llenas, **sobrescribe** el IBC calculado automáticamente |

## Valores fijos (en `scripts.js`)

Estos valores **no cambian** entre quincenas:

| Constante | Valor | Descripción |
|---|---|---|
| `SMMLV` | 1.750.905 | Salario mínimo 2026 |
| `AUX_COMUNICACION` | 76.356 | Auxilio de comunicación |
| `AUX_ALIMENTACION_N` | 157.731 | Auxilio de alimentación |
| `AUX_ALIMENTACION_E` | 36.804 | Auxilio de alimentación |
| `AUX_MOVILIZACION` | 90.515 | Auxilio de movilización |
| `AUX_BIENESTAR` | 48.458 | Auxilio de bienestar |
| `APORTES_SOCIALES` | 126.940 | Aportes sociales |
| `FONDO_INCAP` | 35.018 | Fondo de incapacidad |
| `POLIZA` | 5.750 | Póliza colectiva |
| `FUN_VIVIR` | **12.275** | Fun. Vivir *(corregido; antes 12.450)* |
| `FONDEVIAN` | 30.952 | Fondevián |
| `FONDOPENSIONVE` | 3.609 | Fondo pensión VE |
| `ADMISION` | 29.656 | Admisión |
| `SOLUCION_VIVIENDA` | 29.697 | Solución de vivienda (solo 1ª quincena) |
| Factores de turno | 11,56 / 9,34 / 1,15 / 12 / 12 | Conversión de turnos a horas |

## Fórmulas verificadas contra colillas reales (ago-2026)

| Concepto | Fórmula | Estado |
|---|---|---|
| EPS SURA | 3,38% del IBC | ✅ Verificado |
| PORVENIR | 3,38% del IBC | ✅ Verificado |
| ADMINISTRACION | **2,5% del devengado** | ✅ Verificado (no es % del IBC) |
| POLIZA, ADMISION, FONDEVIAN, FONDOPENSIONE, APORTES SOCIAL | Valores fijos | ✅ Verificado |

## Pendientes de verificación con COOPEVIAN

Estos puntos **aún no están confirmados** y requieren consulta con la cooperativa:

- **Fórmula exacta del IBC**: el código usa `devengado − auxilio transporte`, pero no reproduce el IBC de las colillas. Por eso existe el campo **"IBC manual"**.
- **Horas nominales (220 vs 210)**: el valor hora base varía entre quincenas. Se sabe que 1.750.905 ÷ 220 = 7.958,66 y ÷ 210 = 8.337,64, pero **no se conoce la regla** que decide cuál aplica.
- **Auxilio de transporte**: varía entre quincenas (114.967 vs 124.548). La hipótesis "proporcional a días" no encaja exactamente.
- **Hora extra `×1.55`**: sin verificar contra colilla.
- **Validación completa con las 2 colillas**: falta el **desglose de turnos** de cada una (las colillas traen totales, no los turnos que los produjeron).

## Estructura

```
index.html          → interfaz
styles.css          → estilos
scripts.js          → lógica de cálculo
manifest.json       → PWA
service-worker.js   → offline
```

## Despliegue

Publicado en GitHub Pages: https://konfiozinc.github.io/nomina_centinela/
