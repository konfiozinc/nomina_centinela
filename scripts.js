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
    const FUN_VIVIR = 12450;
    const FONDEVIAN = 30952;
    const FONDOPENSIONVE = 3609;
    const ADMISION = 29656;
    const SOLUCION_VIVIENDA = 29697;  // solo 1ª quincena
    const CUOTA_ADICIONAL_BASE = 157043; // base para el 33%

    let ultimoCalculo = { totalDev: 0, totalDed: 0, neto: 0, ibc: 0 };

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

        // Horas equivalentes
        const hDiurnas = diurnos * FACTOR_DIURNO;
        const hNocturnas = nocturnos * FACTOR_NOCTURNO;
        const hDescanso = (diurnos + nocturnos + festD + festN) * FACTOR_DESCANSO;
        const hFestD = festD * FACTOR_FESTIVO_D;
        const hFestN = festN * FACTOR_FESTIVO_N;

        const vHora = VALOR_HORA_BASE;
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
                         AUX_MOVILIZACION + AUX_BIENESTAR + AUX_TRANSPORTE;

        // Bonificación semestral (solo en junio y diciembre, primera quincena)
        let bonif = 0;
        if (quincena === '1' && (mes === 6 || mes === 12)) {
            bonif = diurnos * 74091; // 50% del turno diurno ($148.182 / 2 = $74.091)
        }

        const totalDev = valDiurno + valNocturno + valDescanso + valFestD + valFestN +
                         valExtra + totalAux + bonif;

        // IBC (excluye auxilio de transporte y bonificación)
        let ibc = totalDev - AUX_TRANSPORTE - bonif;
        if (ibc < SMMLV) ibc = SMMLV;
        const TOPE_IBC = 2826775;
        if (ibc > TOPE_IBC) ibc = TOPE_IBC;

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
            { cod: '082', desc: 'AUXILIO DE TRA', cant: '—', val: AUX_TRANSPORTE },
            { cod: '089', desc: 'AUX.BIENESTAR', cant: '—', val: AUX_BIENESTAR }
        ];
        if (bonif > 0) {
            devengados.push({ cod: '049', desc: 'BONIF.SEMESTRA', cant: '—', val: bonif });
        }

        renderizarTabla(devengados, deducciones, totalDev, totalDed, neto);
        mostrarDiagnostico(quincena, mes, ibc, cuotaAdicional, bonif);
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

    function mostrarDiagnostico(quincena, mes, ibc, cuotaAdicional, bonif) {
        const div = document.getElementById('diagnosticoContenido');
        let txt = '';
        if (cuotaAdicional > 0) {
            txt += `<p>⚠️ <strong>Cuota adicional de administración</strong> activa: ${formatoMoneda(cuotaAdicional)}</p>`;
        } else {
            txt += `<p>✓ <strong>Cuota adicional</strong> inactiva este mes</p>`;
        }
        txt += `<p>✓ <strong>IBC</strong> calculado: ${formatoMoneda(ibc)} (tope 2026: $2.826.775)</p>`;
        if (bonif > 0) {
            txt += `<p style="color:var(--success);font-weight:700;">🎁 Bonificación semestral incluida: ${formatoMoneda(bonif)}</p>`;
        }
        div.innerHTML = txt;
    }

    function comparar() {
        const realDev = parseFloat(document.getElementById('realDev').value) || 0;
        const realDed = parseFloat(document.getElementById('realDed').value) || 0;
        const realNet = realDev - realDed;

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
        calcular();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(() => console.log('✅ Service Worker registrado'))
                .catch(() => console.log('ℹ️ Service Worker no disponible'));
        }
    });
