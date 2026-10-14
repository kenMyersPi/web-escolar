// panel admin

async function loginAdmin() {
  const email = document.getElementById('admin-email').value.trim();
  const pass = document.getElementById('admin-pass').value;
  const errorEl = document.getElementById('error-login');

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  if (error) { errorEl.textContent = 'Credenciales incorrectas'; return; }

  document.getElementById('login-admin').style.display = 'none';
  document.getElementById('panel-admin').style.display = 'block';
  cargarTodo();
}

async function cerrarSesion() {
  await supabaseClient.auth.signOut();
  location.reload();
}

// sesion activa?
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) {
    document.getElementById('login-admin').style.display = 'none';
    document.getElementById('panel-admin').style.display = 'block';
    cargarTodo();
  }
});

function mostrarTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');
}

// ---------- agregar ----------
async function agregarHorario() {
  const dia = document.getElementById('h-dia').value.trim();
  const hora = document.getElementById('h-hora').value.trim();
  const materia = document.getElementById('h-materia').value.trim();
  const profesor = document.getElementById('h-profesor').value.trim();
  if (!dia || !hora || !materia) return alert('Completa los campos');

  const { error } = await supabaseClient.from('cfar_horario').insert({ dia, hora, materia, profesor });
  if (error) return alert('Error: ' + error.message);
  limpiar(['h-dia','h-hora','h-materia','h-profesor']);
  cargarTodo();
}

async function agregarProfesor() {
  const nombre = document.getElementById('p-nombre').value.trim();
  const materia = document.getElementById('p-materia').value.trim();
  const resena = document.getElementById('p-resena').value.trim();
  if (!nombre) return alert('Falta el nombre');

  const { error } = await supabaseClient.from('cfar_profesores').insert({ nombre, materia, resena });
  if (error) return alert('Error: ' + error.message);
  limpiar(['p-nombre','p-materia','p-resena']);
  cargarTodo();
}

async function agregarEstudiante() {
  const nombre = document.getElementById('e-nombre').value.trim();
  const curso = document.getElementById('e-curso').value.trim();
  const clave = document.getElementById('e-clave').value.trim();
  if (!nombre) return alert('Falta el nombre');

  const { error } = await supabaseClient.from('cfar_estudiantes').insert({ nombre, curso, clave });
  if (error) return alert('Error: ' + error.message);
  limpiar(['e-nombre','e-curso','e-clave']);
  cargarTodo();
}

async function agregarNota() {
  const estudiante_id = Number(document.getElementById('n-estudiante').value);
  const materia = document.getElementById('n-materia').value.trim();
  const nota = Number(document.getElementById('n-nota').value);
  const privada = document.getElementById('n-privada').checked;
  if (!estudiante_id || !materia || isNaN(nota)) return alert('Completa los campos');

  const { error } = await supabaseClient.from('cfar_notas').insert({ estudiante_id, materia, nota, privada });
  if (error) return alert('Error: ' + error.message);
  limpiar(['n-materia','n-nota']);
  document.getElementById('n-privada').checked = false;
  cargarTodo();
}

async function agregarEvaluacion() {
  const tipo = document.getElementById('ev-tipo').value;
  const titulo = document.getElementById('ev-titulo').value.trim();
  const materia = document.getElementById('ev-materia').value.trim();
  const fecha = document.getElementById('ev-fecha').value || null;
  const descripcion = document.getElementById('ev-desc').value.trim();
  if (!titulo) return alert('Falta el título');

  const { error } = await supabaseClient.from('cfar_evaluaciones').insert({ tipo, titulo, materia, fecha, descripcion });
  if (error) return alert('Error: ' + error.message);
  limpiar(['ev-titulo','ev-materia','ev-fecha','ev-desc']);
  cargarTodo();
}

async function agregarAnuncio() {
  const titulo = document.getElementById('a-titulo').value.trim();
  const texto = document.getElementById('a-texto').value.trim();
  if (!titulo || !texto) return alert('Completa los campos');

  const { error } = await supabaseClient.from('cfar_anuncios').insert({ titulo, texto });
  if (error) return alert('Error: ' + error.message);
  limpiar(['a-titulo','a-texto']);
  cargarTodo();
}

// ---------- borrar ----------
async function borrar(tabla, id) {
  if (!confirm('¿Eliminar?')) return;
  const { error } = await supabaseClient.from(tabla).delete().eq('id', id);
  if (error) return alert('Error: ' + error.message);
  cargarTodo();
}

// ---------- render ----------
async function cargarTodo() {
  // horario
  const { data: h } = await supabaseClient.from('cfar_horario').select('*').order('id');
  document.getElementById('admin-horario').innerHTML = (h || []).map(x =>
    `<li>${x.materia} · ${x.dia} ${x.hora} <button onclick="borrar('cfar_horario', ${x.id})">Eliminar</button></li>`
  ).join('');

  // profes
  const { data: p } = await supabaseClient.from('cfar_profesores').select('*').order('id');
  document.getElementById('admin-profes').innerHTML = (p || []).map(x =>
    `<li>${x.nombre} (${x.materia || '—'}) <button onclick="borrar('cfar_profesores', ${x.id})">Eliminar</button></li>`
  ).join('');

  // estudiantes
  const { data: e } = await supabaseClient.from('cfar_estudiantes').select('*').order('nombre');
  document.getElementById('admin-estudiantes').innerHTML = (e || []).map(x =>
    `<li>${x.nombre} · ${x.curso || '—'} <button onclick="borrar('cfar_estudiantes', ${x.id})">Eliminar</button></li>`
  ).join('');

  // select estudiantes para notas
  const select = document.getElementById('n-estudiante');
  select.innerHTML = (e || []).map(x => `<option value="${x.id}">${x.nombre}</option>`).join('');

  // notas
  const { data: n } = await supabaseClient
    .from('cfar_notas')
    .select('id, materia, nota, privada, cfar_estudiantes(nombre)')
    .order('id');
  document.getElementById('admin-notas').innerHTML = (n || []).map(x =>
    `<li>${x.cfar_estudiantes?.nombre || '?'} · ${x.materia}: ${x.nota} ${x.privada ? '🔒' : ''} <button onclick="borrar('cfar_notas', ${x.id})">Eliminar</button></li>`
  ).join('');

  // evaluaciones
  const { data: ev } = await supabaseClient.from('cfar_evaluaciones').select('*').order('id');
  document.getElementById('admin-eval').innerHTML = (ev || []).map(x =>
    `<li>${x.tipo}: ${x.titulo} <button onclick="borrar('cfar_evaluaciones', ${x.id})">Eliminar</button></li>`
  ).join('');

  // anuncios
  const { data: a } = await supabaseClient.from('cfar_anuncios').select('*').order('id', { ascending: false });
  document.getElementById('admin-anuncios').innerHTML = (a || []).map(x =>
    `<li>${x.titulo} <button onclick="borrar('cfar_anuncios', ${x.id})">Eliminar</button></li>`
  ).join('');
}

function limpiar(ids) {
  ids.forEach(id => document.getElementById(id).value = '');
}
