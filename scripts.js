// ============================================================
    //  CONFIGURACIÓN MAESTRA (COOPEVIAN 2026)
    // ============================================================
    const SMMLV = 1750905;
    const VALOR_HORA_BASE = 7958.6591;

    // Factores de conversión (basados en colillas reales)
    const FACTOR_DIURNO = 11.56;
    const FACTOR_NOCTURNO = 9.34;
    const FACTOR_DESCANSO = 1.15;
    const FACTOR_FESTIVO_D = 12;
    const FACTOR_FESTIVO_N = 12;

    // Auxilios fijos quincenales (valores 2026)
    const AUX_COMUNICACION = 76356;
    const AUX_ALIMENTACION_N = 157731;
    const AUX_ALIMENTACION_E = 36804;
    const AUX_MOVILIZACION = 90515;
    const AUX_BIENESTAR = 48458;
    const AUX_TRANSPORTE = 118160;

    // Deducciones fijas (quincenales)
    const APORTES_SOCIALES = 126940;
    const FONDO_INCAP = 35018;
    const POLIZA = 5750;
    const FUN_VIVIR = 12275;
    const FONDEVIAN = 30952;
    const FONDOPENSIONVE = 3609;
    const ADMISION = 29656;
    const SOLUCION_VIVIENDA = 29697;  // solo 1ª quincena
    const CUOTA_ADICIONAL_BASE = 157043; // base para el 33%

    // Parámetros ajustables por período (defaults = convención actual)
    const TOPE_IBC = 2826775;
    const HORAS_NOMINALES = 220;

    let ultimoCalculo = { totalDev: 0, totalDed: 0, neto: 0, ibc: 0 };

    const STORAGE_KEY = 'centinela_datos_v1';

    function validarInputs(diurnos, nocturnos, festD, festN, extras) {
        if ([diurnos, nocturnos, festD, festN, extras].some(v => v < 0)) {
            return 'Los valores no pueden ser negativos.';
        }
        const campos = [['Diurnos', diurnos], ['Nocturnos', nocturnos], ['Festivos diurnos', festD], ['Festivos nocturnos', festN]];
        for (const [nombre, v] of campos) {
            if (v > 15) return nombre + ': máximo 15 turnos en una quincena de 15 días.';
        }
        if (extras > 200) {
            return 'Las horas extras superan el máximo razonable (200 h).';
        }
        return null;
    }

    function mostrarError(msg) {
        const el = document.getElementById('errorMsg');
        if (el) {
            el.textContent = msg;
            el.style.display = msg ? 'block' : 'none';
        }
    }

    function guardarDatos() {
        try {
            const datos = {
                mes: document.getElementById('mes').value,
                quincena: document.getElementById('quincena').value,
                diurnos: document.getElementById('diurnos').value,
                nocturnos: document.getElementById('nocturnos').value,
                festivosD: document.getElementById('festivosD').value,
                festivosN: document.getElementById('festivosN').value,
                extras: document.getElementById('extras').value,
                paramHorasNominales: document.getElementById('paramHorasNominales').value,
                paramHoraBase: document.getElementById('paramHoraBase').value,
                paramAuxTransporte: document.getElementById('paramAuxTransporte').value,
                paramTopeIbc: document.getElementById('paramTopeIbc').value,
                paramIbcManual: document.getElementById('paramIbcManual').value,
                realNeto: document.getElementById('realNeto').value
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
        } catch(e) {}
    }

    function cargarDatos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const d = JSON.parse(raw);
            if (d.mes) document.getElementById('mes').value = d.mes;
            if (d.quincena) document.getElementById('quincena').value = d.quincena;
            if (d.diurnos !== undefined && d.diurnos !== '') document.getElementById('diurnos').value = d.diurnos;
            if (d.nocturnos !== undefined && d.nocturnos !== '') document.getElementById('nocturnos').value = d.nocturnos;
            if (d.festivosD !== undefined && d.festivosD !== '') document.getElementById('festivosD').value = d.festivosD;
            if (d.festivosN !== undefined && d.festivosN !== '') document.getElementById('festivosN').value = d.festivosN;
            if (d.extras !== undefined && d.extras !== '') document.getElementById('extras').value = d.extras;
            if (d.paramHorasNominales !== undefined && d.paramHorasNominales !== '') document.getElementById('paramHorasNominales').value = d.paramHorasNominales;
            if (d.paramHoraBase !== undefined && d.paramHoraBase !== '') document.getElementById('paramHoraBase').value = d.paramHoraBase;
            if (d.paramAuxTransporte !== undefined && d.paramAuxTransporte !== '') document.getElementById('paramAuxTransporte').value = d.paramAuxTransporte;
            if (d.paramTopeIbc !== undefined && d.paramTopeIbc !== '') document.getElementById('paramTopeIbc').value = d.paramTopeIbc;
            if (d.paramIbcManual !== undefined) document.getElementById('paramIbcManual').value = d.paramIbcManual;
            if (d.realNeto !== undefined) document.getElementById('realNeto').value = d.realNeto;
        } catch(e) {}
    }

    function sincronizarHoraBase() {
        const horas = parseFloat(document.getElementById('paramHorasNominales').value);
        if (!isNaN(horas) && horas > 0) {
            document.getElementById('paramHoraBase').value = (SMMLV / horas).toFixed(4);
        }
    }

    function limpiarTodo() {
        if (!confirm('¿Borrar todos los turnos y restablecer la herramienta?')) return;
        ['diurnos', 'nocturnos', 'festivosD', 'festivosN'].forEach(id => document.getElementById(id).value = 0);
        document.getElementById('extras').value = 0;
        try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
        mostrarError('');
        calcular();
    }

    function setTexto(id, txt) {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
    }

    // Resumen dinámico de horas: evita confundir turnos con horas
    function actualizarResumenHoras() {
        const d  = parseFloat(document.getElementById('diurnos').value) || 0;
        const n  = parseFloat(document.getElementById('nocturnos').value) || 0;
        const fd = parseFloat(document.getElementById('festivosD').value) || 0;
        const fn = parseFloat(document.getElementById('festivosN').value) || 0;
        const ex = parseFloat(document.getElementById('extras').value) || 0;

        // Equivalencia en horas debajo de cada campo de turnos
        setTexto('eqDiurnos',   d  ? '= ' + (d * 12)  + ' horas' : '');
        setTexto('eqNocturnos', n  ? '= ' + (n * 12)  + ' horas' : '');
        setTexto('eqFestivosD', fd ? '= ' + (fd * 12) + ' horas' : '');
        setTexto('eqFestivosN', fn ? '= ' + (fn * 12) + ' horas' : '');

        const panel = document.getElementById('resumenHoras');
        if (!panel) return;

        const hD = d * 12, hN = n * 12, hFD = fd * 12, hFN = fn * 12;
        const total = hD + hN + hFD + hFN + ex;
        const turnos = d + n + fd + fn;

        let html = '<div class="fila"><span>Diurnas</span><strong>' + hD + ' h</strong></div>' +
                   '<div class="fila"><span>Nocturnas</span><strong>' + hN + ' h</strong></div>' +
                   '<div class="fila"><span>Festivas diurnas</span><strong>' + hFD + ' h</strong></div>' +
                   '<div class="fila"><span>Festivas nocturnas</span><strong>' + hFN + ' h</strong></div>' +
                   '<div class="fila"><span>Horas extras</span><strong>' + ex + ' h</strong></div>' +
                   '<div class="total"><span>TOTAL</span><span>' + total + ' h · ' + turnos + ' turnos</span></div>';

        if (total > 200) {
            html += '<p class="warn">⚠️ Has ingresado ' + total + ' h. En una quincena de 15 días el máximo realista es ~180 h (12 h × 15 días). Revisa tus valores.</p>';
        } else if (total > 180) {
            html += '<p class="warn">⚠️ ' + total + ' h supera el rango normal (~180 h por quincena). Verifica tus turnos.</p>';
        } else {
            html += '<p class="ok">✅ Dentro del rango normal (máx. ~180 h en una quincena).</p>';
        }
        panel.innerHTML = html;
    }

    // ===== Cargar desde colilla (horas → turnos) =====
    function abrirColilla() {
        const m = document.getElementById('modalColilla');
        if (!m) return;
        m.classList.add('activo');
        document.getElementById('convResultado').innerHTML = '';
    }

    function cerrarColilla() {
        const m = document.getElementById('modalColilla');
        if (m) m.classList.remove('activo');
    }

    function convertirColilla() {
        const hD  = parseFloat(document.getElementById('colDiurnas').value) || 0;
        const hN  = parseFloat(document.getElementById('colNocturnas').value) || 0;
        const hFD = parseFloat(document.getElementById('colFestD').value) || 0;
        const hFN = parseFloat(document.getElementById('colFestN').value) || 0;
        const hEx = parseFloat(document.getElementById('colExtras').value) || 0;

        const tD  = Math.round(hD / 12);
        const tN  = Math.round(hN / 12);
        const tFD = Math.round(hFD / 12);
        const tFN = Math.round(hFN / 12);

        document.getElementById('diurnos').value = tD;
        document.getElementById('nocturnos').value = tN;
        document.getElementById('festivosD').value = tFD;
        document.getElementById('festivosN').value = tFN;
        document.getElementById('extras').value = hEx; // las extras ya se manejan en horas

        document.getElementById('convResultado').innerHTML =
            '<div class="resultado-conversion"><strong>✓ Convertido a turnos:</strong><br>' +
            'Diurnas ' + hD + ' h → <strong>' + tD + ' turnos</strong><br>' +
            'Nocturnas ' + hN + ' h → <strong>' + tN + ' turnos</strong><br>' +
            'Festivas D ' + hFD + ' h → <strong>' + tFD + ' turnos</strong><br>' +
            'Festivas N ' + hFN + ' h → <strong>' + tFN + ' turnos</strong><br>' +
            'Extras ' + hEx + ' h → se usan directo (ya están en horas)</div>';

        calcular();
    }

    // ============================================================
    //  CÁLCULO PRINCIPAL
    // ============================================================
    function calcular() {
        const mes = parseInt(document.getElementById('mes').value);
        const quincena = document.getElementById('quincena').value;

        const diurnos = parseFloat(document.getElementById('diurnos').value) || 0;
        const nocturnos = parseFloat(document.getElementById('nocturnos').value) || 0;
        const festD = parseFloat(document.getElementById('festivosD').value) || 0;
        const festN = parseFloat(document.getElementById('festivosN').value) || 0;
        const extras = parseFloat(document.getElementById('extras').value) || 0;

        // Validación de inputs
        const error = validarInputs(diurnos, nocturnos, festD, festN, extras);
        if (error) {
            mostrarError(error);
            return;
        }
        mostrarError('');

        // Parámetros ajustables del período (fallback a los defaults si están vacíos)
        const pvHora = parseFloat(document.getElementById('paramHoraBase').value);
        const vHora = isNaN(pvHora) ? VALOR_HORA_BASE : pvHora;
        const pAux = parseFloat(document.getElementById('paramAuxTransporte').value);
        const auxTransporte = isNaN(pAux) ? AUX_TRANSPORTE : pAux;
        const pTope = parseFloat(document.getElementById('paramTopeIbc').value);
        const topeIbc = isNaN(pTope) ? TOPE_IBC : pTope;
        const ibcManualRaw = (document.getElementById('paramIbcManual').value || '').trim();
        const ibcManual = ibcManualRaw === '' ? null : parseFloat(ibcManualRaw);

        // Horas equivalentes
        const hDiurnas = diurnos * FACTOR_DIURNO;
        const hNocturnas = nocturnos * FACTOR_NOCTURNO;
        const hDescanso = (diurnos + nocturnos + festD + festN) * FACTOR_DESCANSO;
        const hFestD = festD * FACTOR_FESTIVO_D;
        const hFestN = festN * FACTOR_FESTIVO_N;

        const vNocturna = vHora * 1.35;   // recargo 35%
        const vFestD = vHora * 1.75;      // dominical/festivo diurno
        const vFestN = vHora * 2.10;      // dominical/festivo nocturno
        const vExtra = vHora * 1.55;      // extra diurna (asumimos todas como diurnas)

        const valDiurno = hDiurnas * vHora;
        const valNocturno = hNocturnas * vNocturna;
        const valDescanso = hDescanso * vHora;
        const valFestD = hFestD * vFestD;
        const valFestN = hFestN * vFestN;
        const valExtra = extras * vExtra;

        // Auxilios
        const totalAux = AUX_COMUNICACION + AUX_ALIMENTACION_N + AUX_ALIMENTACION_E +
                         AUX_MOVILIZACION + AUX_BIENESTAR + auxTransporte;

        // Bonificación semestral (solo en junio y diciembre, primera quincena)
        let bonif = 0;
        if (quincena === '1' && (mes === 6 || mes === 12)) {
            bonif = diurnos * 74091; // 50% del turno diurno ($148.182 / 2 = $74.091)
        }

        const totalDev = valDiurno + valNocturno + valDescanso + valFestD + valFestN +
                         valExtra + totalAux + bonif;

        // IBC (excluye auxilio de transporte y bonificación)
        let ibc = totalDev - auxTransporte - bonif;
        if (ibc < SMMLV) ibc = SMMLV;
        if (ibc > topeIbc) ibc = topeIbc;
        // IBC manual: si el usuario lo escribió, sobrescribe el cálculo automático
        if (ibcManual !== null && !isNaN(ibcManual)) ibc = ibcManual;

        // Deducciones
        const eps = ibc * 0.0338;
        const pension = ibc * 0.0338;
        const cuotaAdmin = totalDev * 0.025;

        let cuotaAdicional = 0;
        const mesesAdicional = [1, 3, 5, 7, 8, 10, 12];
        if (mesesAdicional.includes(mes)) {
            cuotaAdicional = CUOTA_ADICIONAL_BASE * 0.33;
        }

        const deducciones = [
            { cod: '505', desc: 'POLIZA COLECTI', val: POLIZA },
            { cod: '550', desc: 'ADMISION', val: ADMISION },
            { cod: '551', desc: 'EPS SURA', val: eps },
            { cod: '554', desc: 'FONDO DE INCAP', val: FONDO_INCAP },
            { cod: '555', desc: 'APORTES SOCIAL', val: APORTES_SOCIALES },
            { cod: '557', desc: 'ADMINISTRACION', val: cuotaAdmin },
            { cod: '582', desc: 'FUN.VIVIR', val: FUN_VIVIR },
            { cod: '677', desc: 'FONDEVIAN', val: FONDEVIAN },
            { cod: '679', desc: 'FONDOPENSIONVE', val: FONDOPENSIONVE },
            { cod: '567', desc: 'PORVENIR', val: pension }
        ];

        // Descuentos adicionales según quincena
        if (quincena === '1') {
            deducciones.push({ cod: '519', desc: 'SOLUCION DE VI', val: SOLUCION_VIVIENDA });
        }
        if (cuotaAdicional > 0) {
            deducciones.push({ cod: '558', desc: 'ADMIN. ADICIONAL (33%)', val: cuotaAdicional });
        }

        const totalDed = deducciones.reduce((a, d) => a + d.val, 0);
        const neto = totalDev - totalDed;

        // Guardar para el comparador
        ultimoCalculo = { totalDev, totalDed, neto, ibc, bonif };

        // Construir tabla de devengados
        const devengados = [
            { cod: '001', desc: 'COMP.ORD.BAS D', cant: hDiurnas.toFixed(2), val: valDiurno },
            { cod: '003', desc: 'COMP.ORD.BAS N', cant: hNocturnas.toFixed(2), val: valNocturno },
            { cod: '080', desc: 'DESCANSOS COMP', cant: hDescanso.toFixed(2), val: valDescanso },
            { cod: '094', desc: 'COMPEXT.FESTDI', cant: hFestD.toFixed(2), val: valFestD },
            { cod: '095', desc: 'COMPEXT.FESTNO', cant: hFestN.toFixed(2), val: valFestN },
            { cod: '091', desc: 'COMP.EXTRA.SUP', cant: extras.toFixed(1), val: valExtra },
            { cod: '040', desc: 'AUX.COMUNICACI', cant: '—', val: AUX_COMUNICACION },
            { cod: '045', desc: 'AUX.ALIMENTACI (N)', cant: '—', val: AUX_ALIMENTACION_N },
            { cod: '047', desc: 'AUX.ALIMENTACI (E)', cant: '—', val: AUX_ALIMENTACION_E },
            { cod: '048', desc: 'AUX.MOVILIZACI', cant: '—', val: AUX_MOVILIZACION },
            { cod: '082', desc: 'AUXILIO DE TRA', cant: '—', val: auxTransporte },
            { cod: '089', desc: 'AUX.BIENESTAR', cant: '—', val: AUX_BIENESTAR }
        ];
        if (bonif > 0) {
            devengados.push({ cod: '049', desc: 'BONIF.SEMESTRA', cant: '—', val: bonif });
        }

        renderizarTabla(devengados, deducciones, totalDev, totalDed, neto);
        mostrarDiagnostico(quincena, mes, ibc, cuotaAdicional, bonif, ibcManual);
        guardarDatos();
        actualizarResumenHoras();
        comparar();
    }

    function renderizarTabla(devengados, deducciones, totalDev, totalDed, neto) {
        const tbody = document.getElementById('tablaBody');
        let html = '';
        devengados.forEach(d => {
            html += `<tr class="row-dev">
                <td><strong>${d.cod}</strong></td>
                <td>${d.desc}</td>
                <td class="text-center">${d.cant}</td>
                <td class="text-right">${formatoMoneda(d.val)}</td>
            </tr>`;
        });
        deducciones.forEach(d => {
            html += `<tr class="row-ded">
                <td><strong>${d.cod}</strong></td>
                <td>${d.desc}</td>
                <td class="text-center">—</td>
                <td class="text-right">${formatoMoneda(d.val)}</td>
            </tr>`;
        });
        tbody.innerHTML = html;

        document.getElementById('totalDev').innerText = formatoMoneda(totalDev);
        document.getElementById('totalDed').innerText = formatoMoneda(totalDed);
        document.getElementById('neto').innerText = formatoMoneda(neto);
    }

    function mostrarDiagnostico(quincena, mes, ibc, cuotaAdicional, bonif, ibcManual) {
        const div = document.getElementById('diagnosticoContenido');
        let txt = '';
        if (cuotaAdicional > 0) {
            txt += `<p>⚠️ <strong>Cuota adicional de administración</strong> activa: ${formatoMoneda(cuotaAdicional)}</p>`;
        } else {
            txt += `<p>✓ <strong>Cuota adicional</strong> inactiva este mes</p>`;
        }
        txt += `<p>✓ <strong>IBC</strong> ${ibcManual !== null ? '(manual)' : 'calculado'}: ${formatoMoneda(ibc)}</p>`;
        if (bonif > 0) {
            txt += `<p style="color:var(--success);font-weight:700;">🎁 Bonificación semestral incluida: ${formatoMoneda(bonif)}</p>`;
        }
        div.innerHTML = txt;
    }

    function comparar() {
        const realDev = parseFloat(document.getElementById('realDev').value) || 0;
        const realDed = parseFloat(document.getElementById('realDed').value) || 0;
        const realNetoRaw = (document.getElementById('realNeto').value || '').trim();
        const realNeto = realNetoRaw === '' ? null : parseFloat(realNetoRaw);
        const realNet = realNeto !== null ? realNeto : (realDev - realDed);

        const calcDev = ultimoCalculo.totalDev || 0;
        const calcDed = ultimoCalculo.totalDed || 0;
        const calcNet = ultimoCalculo.neto || 0;

        const diffDev = realDev - calcDev;
        const diffDed = realDed - calcDed;
        const diffNet = realNet - calcNet;

        const container = document.getElementById('comparacionResultados');
        container.innerHTML = `
            <div class="table-container" style="margin-top:8px;">
                <table>
                    <thead><tr><th>Concepto</th><th>Simulado</th><th>Real</th><th>Diferencia</th></tr></thead>
                    <tbody>
                        <tr><td>Devengados</td><td class="text-right">${formatoMoneda(calcDev)}</td><td class="text-right">${formatoMoneda(realDev)}</td><td class="text-right ${diffDev > 0 ? 'diff-pos' : 'diff-neg'}">${formatoMoneda(diffDev)}</td></tr>
                        <tr><td>Deducciones</td><td class="text-right">${formatoMoneda(calcDed)}</td><td class="text-right">${formatoMoneda(realDed)}</td><td class="text-right ${diffDed > 0 ? 'diff-neg' : 'diff-pos'}">${formatoMoneda(diffDed)}</td></tr>
                        <tr class="total-row"><td>Neto</td><td class="text-right">${formatoMoneda(calcNet)}</td><td class="text-right">${formatoMoneda(realNet)}</td><td class="text-right ${diffNet > 0 ? 'diff-pos' : 'diff-neg'}">${formatoMoneda(diffNet)}</td></tr>
                    </tbody>
                </table>
            </div>
            ${realNeto !== null ? `<div class="resultado-conversion" style="margin-top:10px;">
                Tu cálculo: <strong>${formatoMoneda(calcNet)}</strong><br>
                Neto real: <strong>${formatoMoneda(realNeto)}</strong><br>
                Diferencia: <strong>${formatoMoneda(realNeto - calcNet)}</strong> ${Math.abs(realNeto - calcNet) < 1 ? '✅ ¡Coinciden exactamente!' : ''}
            </div>` : ''}
        `;
    }

    // ============================================================
    //  UTILIDADES
    // ============================================================
    function formatoMoneda(v) {
        return '$' + Math.round(v).toLocaleString('es-CO');
    }

    // ============================================================
    //  EXPORTACIÓN (PDF y Excel)
    // ============================================================
    function exportarPDF() {
        if (!ultimoCalculo.totalDev) { alert('Primero calcula la liquidación.'); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(18);
        doc.text('Liquidación COOPEVIAN', pageWidth/2, 40, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Período: ${document.getElementById('mes').options[document.getElementById('mes').selectedIndex].text} - Quincena ${document.getElementById('quincena').value}`, pageWidth/2, 60, { align: 'center' });
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, pageWidth/2, 75, { align: 'center' });

        let y = 100;
        doc.setFontSize(11);
        doc.text('CONCEPTO', 40, y);
        doc.text('VALOR', pageWidth-40, y, { align: 'right' });
        y += 15;

        const rows = document.querySelectorAll('#tablaBody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                const concepto = cells[1].innerText;
                const valor = cells[3].innerText;
                doc.text(concepto, 40, y);
                doc.text(valor, pageWidth-40, y, { align: 'right' });
                y += 14;
                if (y > 750) { doc.addPage(); y = 40; }
            }
        });

        y += 10;
        doc.setFontSize(12);
        doc.text('TOTAL DEVENGADO', 40, y);
        doc.text(document.getElementById('totalDev').innerText, pageWidth-40, y, { align: 'right' });
        y += 20;
        doc.text('TOTAL DEDUCCIONES', 40, y);
        doc.text(document.getElementById('totalDed').innerText, pageWidth-40, y, { align: 'right' });
        y += 25;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('NETO A PAGAR', 40, y);
        doc.text(document.getElementById('neto').innerText, pageWidth-40, y, { align: 'right' });

        doc.save('Liquidacion_COOPEVIAN.pdf');
    }

    function exportarExcel() {
        if (!ultimoCalculo.totalDev) { alert('Primero calcula la liquidación.'); return; }
        const wb = XLSX.utils.book_new();
        const data = [['Concepto','Valor']];
        const rows = document.querySelectorAll('#tablaBody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                data.push([cells[1].innerText, cells[3].innerText]);
            }
        });
        data.push(['TOTAL DEVENGADO', document.getElementById('totalDev').innerText]);
        data.push(['TOTAL DEDUCCIONES', document.getElementById('totalDed').innerText]);
        data.push(['NETO A PAGAR', document.getElementById('neto').innerText]);

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Liquidación');
        XLSX.writeFile(wb, 'Liquidacion_COOPEVIAN.xlsx');
    }

    // ============================================================
    //  INICIALIZACIÓN
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        cargarDatos();
        // Al cambiar las horas nominales, recalcular el valor hora base (SMMLV / horas)
        const pHoras = document.getElementById('paramHorasNominales');
        if (pHoras) {
            pHoras.addEventListener('change', function() { sincronizarHoraBase(); calcular(); });
        }
        ['paramHoraBase', 'paramAuxTransporte', 'paramTopeIbc', 'paramIbcManual'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', function() { calcular(); });
        });
        // Resumen de horas en vivo (turnos ↔ horas)
        ['diurnos', 'nocturnos', 'festivosD', 'festivosN', 'extras'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', actualizarResumenHoras);
        });
        // Cerrar el modal de colilla con Escape o clic en el fondo
        const mc = document.getElementById('modalColilla');
        if (mc) {
            mc.addEventListener('click', function(e) { if (e.target === mc) cerrarColilla(); });
            document.addEventListener('keydown', function(e) { if (e.key === 'Escape') cerrarColilla(); });
        }
        calcular();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(() => console.log('✅ Service Worker registrado'))
                .catch(() => console.log('ℹ️ Service Worker no disponible'));
        }
    });
