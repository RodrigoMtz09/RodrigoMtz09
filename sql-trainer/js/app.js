// ============================================================
//  Logica principal de SQL Trainer
// ============================================================

const state = {
  nivelActivo: 'Basico',
  ejercicioActivo: null,
  resueltos: cargarProgreso(),   // Set con los ids resueltos
};

// ---------- Persistencia del progreso (localStorage) ----------
function cargarProgreso() {
  try {
    const raw = localStorage.getItem('sqltrainer_resueltos');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}
function guardarProgreso() {
  localStorage.setItem('sqltrainer_resueltos', JSON.stringify([...state.resueltos]));
}

// ---------- Arranque ----------
window.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('estado-carga');
  try {
    await initDatabase();
    status.remove();
    construirEsquemaLateral();
    construirTabsNiveles();
    construirListaEjercicios();
    seleccionarEjercicio(EXERCISES.find(e => e.nivel === state.nivelActivo).id);
    actualizarProgresoGlobal();
    conectarEditor();
  } catch (err) {
    status.textContent = 'Error al cargar la base de datos: ' + err.message;
    status.classList.add('error');
  }
});

// ---------- Panel lateral: esquema ----------
function construirEsquemaLateral() {
  const cont = document.getElementById('esquema');
  cont.innerHTML = SCHEMA_INFO.map(t => `
    <div class="tabla-esquema">
      <div class="tabla-nombre">▸ ${t.tabla}</div>
      <div class="tabla-cols">${t.columnas.join(', ')}</div>
    </div>
  `).join('');
}

// ---------- Tabs de niveles ----------
function construirTabsNiveles() {
  const niveles = ['Basico', 'Intermedio', 'Avanzado'];
  const cont = document.getElementById('tabs-niveles');
  cont.innerHTML = niveles.map(n => `
    <button class="tab ${n === state.nivelActivo ? 'activo' : ''}" data-nivel="${n}">${n}</button>
  `).join('');
  cont.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.nivelActivo = btn.dataset.nivel;
      cont.querySelectorAll('.tab').forEach(b => b.classList.toggle('activo', b === btn));
      construirListaEjercicios();
      const primero = EXERCISES.find(e => e.nivel === state.nivelActivo);
      if (primero) seleccionarEjercicio(primero.id);
    });
  });
}

// ---------- Lista de ejercicios del nivel activo ----------
function construirListaEjercicios() {
  const cont = document.getElementById('lista-ejercicios');
  const ejercicios = EXERCISES.filter(e => e.nivel === state.nivelActivo);
  cont.innerHTML = ejercicios.map((e, i) => `
    <button class="item-ejercicio ${state.resueltos.has(e.id) ? 'resuelto' : ''} ${e.id === state.ejercicioActivo ? 'activo' : ''}"
            data-id="${e.id}">
      <span class="check">${state.resueltos.has(e.id) ? '✔' : (i + 1)}</span>
      <span class="titulo-item">${e.titulo}</span>
    </button>
  `).join('');
  cont.querySelectorAll('.item-ejercicio').forEach(btn => {
    btn.addEventListener('click', () => seleccionarEjercicio(btn.dataset.id));
  });
}

// ---------- Seleccionar un ejercicio ----------
function seleccionarEjercicio(id) {
  const ej = EXERCISES.find(e => e.id === id);
  if (!ej) return;
  state.ejercicioActivo = id;

  document.getElementById('ej-nivel').textContent = ej.nivel;
  document.getElementById('ej-nivel').className = 'badge nivel-' + ej.nivel.toLowerCase();
  document.getElementById('ej-titulo').textContent = ej.titulo;
  document.getElementById('ej-enunciado').innerHTML = ej.enunciado;

  const pista = document.getElementById('pista-texto');
  pista.textContent = ej.pista;
  document.getElementById('pista-box').classList.add('oculto');

  document.getElementById('editor').value = '';
  limpiarResultados();

  construirListaEjercicios();  // refresca resaltado activo
}

// ---------- Editor y botones ----------
function conectarEditor() {
  const editor = document.getElementById('editor');

  document.getElementById('btn-ejecutar').addEventListener('click', ejecutarConsulta);
  document.getElementById('btn-verificar').addEventListener('click', verificarConsulta);
  document.getElementById('btn-limpiar').addEventListener('click', () => {
    editor.value = '';
    limpiarResultados();
    editor.focus();
  });
  document.getElementById('btn-solucion').addEventListener('click', mostrarSolucion);
  document.getElementById('btn-toggle-pista').addEventListener('click', () => {
    document.getElementById('pista-box').classList.toggle('oculto');
  });

  // Ctrl/Cmd + Enter para ejecutar
  editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      ejecutarConsulta();
    }
    // Permitir tabulacion dentro del editor
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart, en = editor.selectionEnd;
      editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(en);
      editor.selectionStart = editor.selectionEnd = s + 2;
    }
  });
}

// ---------- Ejecutar (solo mostrar resultado) ----------
function ejecutarConsulta() {
  const sqlText = document.getElementById('editor').value.trim();
  if (!sqlText) {
    mostrarMensaje('Escribe una consulta primero.', 'aviso');
    return;
  }
  try {
    const { columns, rows } = runQuery(sqlText);
    renderTabla(columns, rows);
    mostrarMensaje(`Consulta ejecutada. ${rows.length} fila(s).`, 'ok');
  } catch (err) {
    limpiarTabla();
    mostrarMensaje('Error de SQL: ' + err.message, 'error');
  }
}

// ---------- Verificar contra la solucion ----------
function verificarConsulta() {
  const ej = EXERCISES.find(e => e.id === state.ejercicioActivo);
  const sqlText = document.getElementById('editor').value.trim();
  if (!sqlText) {
    mostrarMensaje('Escribe una consulta primero.', 'aviso');
    return;
  }

  let resultadoUsuario, resultadoEsperado;
  try {
    resultadoUsuario = runQuery(sqlText);
  } catch (err) {
    limpiarTabla();
    mostrarMensaje('Error de SQL en tu consulta: ' + err.message, 'error');
    return;
  }
  try {
    resultadoEsperado = runQuery(ej.solucion);
  } catch (err) {
    mostrarMensaje('Error interno en la solucion de referencia.', 'error');
    return;
  }

  renderTabla(resultadoUsuario.columns, resultadoUsuario.rows);

  const comparacion = compararResultados(resultadoUsuario, resultadoEsperado, ej.ordenado);
  if (comparacion.ok) {
    state.resueltos.add(ej.id);
    guardarProgreso();
    construirListaEjercicios();
    actualizarProgresoGlobal();
    mostrarMensaje('✔ ¡Correcto! Tu resultado coincide con el esperado.', 'ok');
  } else {
    mostrarMensaje('✗ Aun no coincide: ' + comparacion.motivo, 'error');
  }
}

// ---------- Comparacion de conjuntos de resultados ----------
function compararResultados(usuario, esperado, ordenado) {
  if (usuario.rows.length !== esperado.rows.length) {
    return { ok: false, motivo: `esperaba ${esperado.rows.length} fila(s) y obtuviste ${usuario.rows.length}.` };
  }
  if (usuario.columns.length !== esperado.columns.length) {
    return { ok: false, motivo: `esperaba ${esperado.columns.length} columna(s) y obtuviste ${usuario.columns.length}.` };
  }

  const norm = (v) => {
    if (v === null || v === undefined) return '∅';
    if (typeof v === 'number') return Math.round(v * 1e6) / 1e6 + '';
    return v + '';
  };
  const filaStr = (fila) => fila.map(norm).join('§');

  let u = usuario.rows.map(filaStr);
  let e = esperado.rows.map(filaStr);

  if (!ordenado) { u = u.slice().sort(); e = e.slice().sort(); }

  for (let i = 0; i < e.length; i++) {
    if (u[i] !== e[i]) {
      return { ok: false, motivo: ordenado
        ? 'revisa el orden y los valores de las filas.'
        : 'los valores de las filas no coinciden.' };
    }
  }
  return { ok: true };
}

// ---------- Mostrar solucion ----------
function mostrarSolucion() {
  const ej = EXERCISES.find(e => e.id === state.ejercicioActivo);
  document.getElementById('editor').value = ej.solucion;
  mostrarMensaje('Se cargo la solucion de referencia. Ejecutala para ver el resultado esperado.', 'aviso');
}

// ---------- Render de resultados ----------
function renderTabla(columns, rows) {
  const cont = document.getElementById('resultado-tabla');
  if (columns.length === 0) {
    cont.innerHTML = '<p class="sin-datos">La consulta no devolvio columnas.</p>';
    return;
  }
  const thead = '<tr>' + columns.map(c => `<th>${escapeHtml(c)}</th>`).join('') + '</tr>';
  const tbody = rows.map(r =>
    '<tr>' + r.map(v => `<td>${v === null ? '<span class="nulo">NULL</span>' : escapeHtml(v)}</td>`).join('') + '</tr>'
  ).join('');
  cont.innerHTML = `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  if (rows.length === 0) {
    cont.innerHTML += '<p class="sin-datos">0 filas.</p>';
  }
}

function limpiarTabla() {
  document.getElementById('resultado-tabla').innerHTML = '';
}
function limpiarResultados() {
  limpiarTabla();
  document.getElementById('mensaje').innerHTML = '';
  document.getElementById('mensaje').className = 'mensaje';
}

function mostrarMensaje(texto, tipo) {
  const el = document.getElementById('mensaje');
  el.textContent = texto;
  el.className = 'mensaje ' + tipo;
}

// ---------- Progreso global ----------
function actualizarProgresoGlobal() {
  const total = EXERCISES.length;
  const hechos = EXERCISES.filter(e => state.resueltos.has(e.id)).length;
  const pct = Math.round((hechos / total) * 100);
  document.getElementById('progreso-texto').textContent = `${hechos} / ${total} resueltos`;
  document.getElementById('progreso-barra').style.width = pct + '%';
}

// ---------- Utilidades ----------
function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Reiniciar progreso
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-reiniciar');
  if (btn) btn.addEventListener('click', () => {
    if (confirm('¿Borrar todo tu progreso?')) {
      state.resueltos.clear();
      guardarProgreso();
      construirListaEjercicios();
      actualizarProgresoGlobal();
    }
  });
});
