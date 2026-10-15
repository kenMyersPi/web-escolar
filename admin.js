// panel admin

let CACHE = {
  estudiantes: [],
  profesores: [],
  materias: ['Matemática', 'Castellano', 'Biología', 'Química', 'Física', 'Inglés', 'G.H.C', 'Educación Física', 'Grupo estable', 'Orientación']
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('activa'));
      document.getElementById(id).classList.add('activa');
      document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
    });
  });

  document.getElementById('admin-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') loginAdmin();
  });

  db.auth.getSession().then(({ data }) => {
    if (data.session) {
      document.getElementById('login-admin').style.display = 'none';
      document.getElementById('panel-admin').style.display = 'block';
      cargarTodo();
    }
  });
});

async function loginAdmin() {
  const email = document.getElementById('admin-email').value.trim();
  const pass = document.getElementById('admin-pass').value;
  const errorEl = document.getElementById('error-login');
  const btn = document.getElementById('btn-login');

  errorEl.textContent = '';
  if (!email || !pass) { errorEl.textContent = 'Completa los campos'; return; }

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  const { error } = await db.auth.signInWithPassword({ email, password: pass });

  btn.disabled = false;
  btn.textContent = 'Entrar';

  if (error) {
    errorEl.textContent = 'Correo o contraseña incorrectos';
    return;
  }

  document.getElementById('login-admin').style.display = 'none';
  document.getElementById('panel-admin').style.display = 'block';
  cargarTodo();
}

async function cerrarSesion() {
  await db.auth.signOut();
  location.reload();
}

// ============ HORARIO (fijo, no se toca) ============
// ya no se administra desde aquí

// ============ PROFESORES ============
async function agregarProfesor() {
  const nombre = document.getElementById('p-nombre').value.trim();
  const materia = document.getElementById('p-materia').value.trim();
  const apodo = document.getElementById('p-apodo').value.trim();
  const bio = document.getElementById('p-bio').value.trim();
  const resena = document.getElementById('p-resena').value.trim();

  if (!nombre) return alert('Falta el nombre');

  const { error } = await db.from('cfar_profesores').insert({ nombre, materia, apodo, bio, resena });
  if (error) return alert('Error: ' + error.message);

  limpiar(['p-nombre','p-materia','p-apodo','p-bio','p-resena']);
  cargarTodo();
}

async function editarProfesor(id) {
  const p = CACHE.profesores.find(x => x.id === id);
  if (!p) return;

  const nombre = prompt('Nombre:', p.nombre);
  if (nombre === null) return;
  const materia = prompt('Materia:', p.materia || '');
  if (materia === null) return;
  const apodo = prompt('Apodo:', p.apodo || '');
  if (apodo === null) return;
  const bio = prompt('Bio:', p.bio || '');
  if (bio === null) return;
  const resena = prompt('Reseña:', p.resena || '');
  if (resena === null) return;

  const { error } = await db.from('cfar_profesores').update({ nombre, materia, apodo, bio, resena }).eq('id', id);
  if (error) return alert('Error: ' + error.message);
  cargarTodo();
}

// ============ ESTUDIANTES ============
async function agregarEstudiante() {
  const nombre = document.getElementById('e-nombre').value.trim();
  const curso = document.getElementById('e-curso').value.trim();
  const clave = document.getElementById('e-clave').value.trim();
  const apodo = document.getElementById('e-apodo').value.trim();
  const bio = document.getElementById('e-bio').value.trim();

  if (!nombre) return alert('Falta el nombre');

  const { error } = await db.from('cfar_estudiantes').insert({ nombre, curso, clave, apodo, bio });
  if (error) return alert('Error: ' + error.message);

  limpiar(['e-nombre','e-curso','e-clave','e-apodo','e-bio']);
  cargarTodo();
}

async function editarEstudiante(id) {
  const e = CACHE.estudiantes.find(x => x.id === id);
  if (!e) return;

  const nombre = prompt('Nombre:', e.nombre);
  if (nombre === null) return;
  const curso = prompt('Curso:', e.curso || '');
  if (curso === null) return;
  const clave = prompt('Clave:', e.clave || '');
  if (clave === null) return;
  const apodo = prompt('Apodo:', e.apodo || '');
  if (apodo === null) return;
  const bio = prompt('Bio:', e.bio || '');
  if (bio === null) return;

  const { error } = await db.from('cfar_estudiantes').update({ nombre, curso, clave, apodo, bio }).eq('id', id);
  if (error) return alert('Error: ' + error.message);
  cargarTodo();
}

// ============ NOTAS ============
async function agregarNota() {
  const estudiante_id = Number(document.getElementById('n-estudiante').value);
  const materia = document.getElementById('n-materia').value.trim();
  const nota = Number(document.getElementById('n-nota').value);
  const privada = document.getElementById('n-privada').checked;

  if (!estudiante_id || !materia || isNaN(nota)) return alert('Completa los campos');

  const { error } = await db.from('cfar_notas').insert({ estudiante_id, materia, nota, privada });
  if (error) return alert('Error: ' + error.message);

  limpiar(['n-materia','n-nota']);
  document.getElementById('n-privada').checked = false;
  cargarTodo();
}

async function editarNota(id) {
  const { data: n } = await db.from('cfar_notas').select('*').eq('id', id).single();
  if (!n) return;

  const materia = prompt('Materia:', n.materia);
  if (materia === null) return;
  const nota = prompt('Nota:', n.nota);
  if (nota === null) return;
  const privada = confirm('¿Marcar como privada? (Aceptar = sí, Cancelar = no)');

  const { error } = await db.from('cfar_notas').update({ materia, nota: Number(nota), privada }).eq('id', id);
  if (error) return alert('Error: ' + error.message);
  cargarTodo();
}

// ============ EVALUACIONES ============
async function agregarEvaluacion() {
  const tipo = document.getElementById('ev-tipo').value;
  const titulo = document.getElementById('ev-titulo').value.trim();
  const materia = document.getElementById('ev-materia').value.trim();
  const fecha = document.getElementById('ev-fecha').value || null;
  const descripcion = document.getElementById('ev-desc').value.trim();
  const contenido = document.getElementById('ev-contenido').value.trim();

  if (!titulo) return alert('Falta el título');

  const { error } = await db.from('cfar_evaluaciones').insert({ tipo, titulo, materia, fecha, descripcion, contenido });
  if (error) return alert('Error: ' + error.message);

  limpiar(['ev-titulo','ev-materia','ev-fecha','ev-desc','ev-contenido']);
  cargarTodo();
}

async function editarEvaluacion(id) {
  const { data: ev } = await db.from('cfar_evaluaciones').select('*').eq('id', id).single();
  if (!ev) return;

  const titulo = prompt('Título:', ev.titulo);
  if (titulo === null) return;
  const materia = prompt('Materia:', ev.materia || '');
  if (materia === null) return;
  const fecha = prompt('Fecha (YYYY-MM-DD):', ev.fecha || '');
  if (fecha === null) return;
  const descripcion = prompt('Descripción:', ev.descripcion || '');
  if (descripcion === null) return;
  const contenido = prompt('Contenido (tema completo):', ev.contenido || '');
  if (contenido === null) return;

  const { error } = await db.from('cfar_evaluaciones')
    .update({ titulo, materia, fecha: fecha || null, descripcion, contenido })
    .eq('id', id);
  if (error) return alert('Error: ' + error.message);
  cargarTodo();
}

// ============ ANUNCIOS ============
async function agregarAnuncio() {
  const titulo = document.getElementById('a-titulo').value.trim();
  const texto = document.getElementById('a-texto').value.trim();
  if (!titulo || !texto) return alert('Completa los campos');

  const { error } = await db.from('cfar_anuncios').insert({ titulo, texto });
  if (error) return alert('Error: ' + error.message);

  limpiar(['a-titulo','a-texto']);
  cargarTodo();
}

async function editarAnuncio(id) {
  const { data: a } = await db.from('cfar_anuncios').select('*').eq('id', id).single();
  if (!a) return;

  const titulo = prompt('Título:', a.titulo);
  if (titulo === null) return;
  const texto = prompt('Contenido:', a.texto);
  if (texto === null) return;

  const { error } = await db.from('cfar_anuncios').update({ titulo, texto }).eq('id', id);
  if (error) return alert('Error: ' + error.message);
  cargarTodo();
}

// ============ BORRAR ============
async function borrar(tabla, id) {
  if (!confirm('¿Eliminar este registro?')) return;
  const { error } = await db.from(tabla).delete().eq('id', id);
  if (error) return alert('Error: ' + error.message);
  cargarTodo();
}

// ============ CARGAR TODO ============
async function cargarTodo() {
  // profesores
  const { data: p } = await db.from('cfar_profesores').select('*').order('id');
  CACHE.profesores = p || [];
  document.getElementById('admin-profes').innerHTML = CACHE.profesores.map(x =>
    `<li>
      <span>${x.nombre}${x.apodo ? ` "${x.apodo}"` : ''} (${x.materia || '—'})</span>
      <div class="acciones-item">
        <button class="btn-editar" onclick="editarProfesor(${x.id})">Editar</button>
        <button onclick="borrar('cfar_profesores', ${x.id})">Eliminar</button>
      </div>
    </li>`
  ).join('');

  // estudiantes
  const { data: e } = await db.from('cfar_estudiantes').select('*').order('nombre');
  CACHE.estudiantes = e || [];
  document.getElementById('admin-estudiantes').innerHTML = CACHE.estudiantes.map(x =>
    `<li>
      <span>${x.nombre}${x.apodo ? ` "${x.apodo}"` : ''} · ${x.curso || '—'}</span>
      <div class="acciones-item">
        <button class="btn-editar" onclick="editarEstudiante(${x.id})">Editar</button>
        <button onclick="borrar('cfar_estudiantes', ${x.id})">Eliminar</button>
      </div>
    </li>`
  ).join('');

  // select estudiantes
  const select = document.getElementById('n-estudiante');
  select.innerHTML = CACHE.estudiantes.length
    ? CACHE.estudiantes.map(x => `<option value="${x.id}">${x.nombre}</option>`).join('')
    : '<option value="">Sin estudiantes</option>';

  // datalist materias para autocompletado
  const dl = document.getElementById('materias-list');
  if (dl) dl.innerHTML = CACHE.materias.map(m => `<option value="${m}">`).join('');

  // notas
  const { data: n } = await db
    .from('cfar_notas')
    .select('id, materia, nota, privada, cfar_estudiantes(nombre)')
    .order('id');
  document.getElementById('admin-notas').innerHTML = (n || []).map(x =>
    `<li>
      <span>${x.cfar_estudiantes?.nombre || '?'} · ${x.materia}: ${x.nota} ${x.privada ? '🔒' : ''}</span>
      <div class="acciones-item">
        <button class="btn-editar" onclick="editarNota(${x.id})">Editar</button>
        <button onclick="borrar('cfar_notas', ${x.id})">Eliminar</button>
      </div>
    </li>`
  ).join('');

  // evaluaciones
  const { data: ev } = await db.from('cfar_evaluaciones').select('*').order('id');
  document.getElementById('admin-eval').innerHTML = (ev || []).map(x =>
    `<li>
      <span>${x.tipo}: ${x.titulo}</span>
      <div class="acciones-item">
        <button class="btn-editar" onclick="editarEvaluacion(${x.id})">Editar</button>
        <button onclick="borrar('cfar_evaluaciones', ${x.id})">Eliminar</button>
      </div>
    </li>`
  ).join('');

  // anuncios
  const { data: a } = await db.from('cfar_anuncios').select('*').order('id', { ascending: false });
  document.getElementById('admin-anuncios').innerHTML = (a || []).map(x =>
    `<li>
      <span>${x.titulo}</span>
      <div class="acciones-item">
        <button class="btn-editar" onclick="editarAnuncio(${x.id})">Editar</button>
        <button onclick="borrar('cfar_anuncios', ${x.id})">Eliminar</button>
      </div>
    </li>`
  ).join('');

  // contador
  const contador = document.getElementById('contador');
  if (contador) {
    contador.innerHTML = `
      <span>👨‍🏫 ${CACHE.profesores.length} profes</span>
      <span>🎓 ${CACHE.estudiantes.length} estudiantes</span>
      <span>📊 ${(n || []).length} notas</span>
      <span>📝 ${(ev || []).length} evaluaciones</span>
    `;
  }
}

function limpiar(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}
