// panel admin

document.addEventListener('DOMContentLoaded', () => {
  // tabs
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('activa'));
      document.getElementById(id).classList.add('activa');
      document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
    });
  });

  // enter para login
  document.getElementById('admin-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') loginAdmin();
  });

  // sesion activa?
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

  if (!email || !pass) {
    errorEl.textContent = 'Completa los campos';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  const { data, error } = await db.auth.signInWithPassword({ email, password: pass });

  btn.disabled = false;
  btn.textContent = 'Entrar';

  if (error) {
    errorEl.textContent = 'Correo o contraseña incorrectos';
    console.error(error);
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

async function agregarHorario() {
  const dia_semana = document.getElementById('h-dia').value;
  const bloque = document.getElementById('h-bloque').value;
  const materia = document.getElementById('h-materia').value.trim();
  const profesor = document.getElementById('h-profesor').value.trim();

  if (!dia_semana || !bloque || !materia) return alert('Completa los campos');

  const [hora_inicio, hora_fin] = bloque.split('|');

  const { error } = await db.from('cfar_horario').insert({
    dia_semana,
    hora_inicio,
    hora_fin,
    materia,
    profesor
  });

  if (error) return alert('Error: ' + error.message);
  limpiar(['h-materia','h-profesor']);
  document.getElementById('h-dia').value = '';
  document.getElementById('h-bloque').value = '';
  cargarTodo();
}

async function agregarProfesor() {
  const nombre = document.getElementById('p-nombre').value.trim();
  const materia = document.getElementById('p-materia').value.trim();
  const resena = document.getElementById('p-resena').value.trim();
  if (!nombre) return alert('Falta el nombre');

  const { error } = await db.from('cfar_profesores').insert({ nombre, materia, resena });
  if (error) return alert('Error: ' + error.message);
  limpiar(['p-nombre','p-materia','p-resena']);
  cargarTodo();
}

async function agregarEstudiante() {
  const nombre = document.getElementById('e-nombre').value.trim();
  const curso = document.getElementById('e-curso').value.trim();
  const clave = document.getElementById('e-clave').value.trim();
  if (!nombre) return alert('Falta el nombre');

  const { error } = await db.from('cfar_estudiantes').insert({ nombre, curso, clave });
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

  const { error } = await db.from('cfar_notas').insert({ estudiante_id, materia, nota, privada });
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

  const { error } = await db.from('cfar_evaluaciones').insert({ tipo, titulo, materia, fecha, descripcion });
  if (error) return alert('Error: ' + error.message);
  limpiar(['ev-titulo','ev-materia','ev-fecha','ev-desc']);
  cargarTodo();
}

async function agregarAnuncio() {
  const titulo = document.getElementById('a-titulo').value.trim();
  const texto = document.getElementById('a-texto').value.trim();
  if (!titulo || !texto) return alert('Completa los campos');

  const { error } = await db.from('cfar_anuncios').insert({ titulo, texto });
  if (error) return alert('Error: ' + error.message);
  limpiar(['a-titulo','a-texto']);
  cargarTodo();
}

async function borrar(tabla, id) {
  if (!confirm('¿Eliminar este registro?')) return;
  const { error } = await db.from(tabla).delete().eq('id', id);
  if (error) return alert('Error: ' + error.message);
  cargarTodo();
}

async function cargarTodo() {
  const { data: h } = await db.from('cfar_horario').select('*').order('id');
  document.getElementById('admin-horario').innerHTML = (h || []).map(x =>
  `<li><span>${x.dia_semana} ${x.hora_inicio}-${x.hora_fin}: ${x.materia} (${x.profesor || '—'})</span> <button onclick="borrar('cfar_horario', ${x.id})">Eliminar</button></li>`
).join('');

  const { data: p } = await db.from('cfar_profesores').select('*').order('id');
  document.getElementById('admin-profes').innerHTML = (p || []).map(x =>
    `<li><span>${x.nombre} (${x.materia || '—'})</span> <button onclick="borrar('cfar_profesores', ${x.id})">Eliminar</button></li>`
  ).join('');

  const { data: e } = await db.from('cfar_estudiantes').select('*').order('nombre');
  document.getElementById('admin-estudiantes').innerHTML = (e || []).map(x =>
    `<li><span>${x.nombre} · ${x.curso || '—'}</span> <button onclick="borrar('cfar_estudiantes', ${x.id})">Eliminar</button></li>`
  ).join('');

  const select = document.getElementById('n-estudiante');
  select.innerHTML = (e || []).length
    ? e.map(x => `<option value="${x.id}">${x.nombre}</option>`).join('')
    : '<option value="">Sin estudiantes</option>';

  const { data: n } = await db
    .from('cfar_notas')
    .select('id, materia, nota, privada, cfar_estudiantes(nombre)')
    .order('id');
  document.getElementById('admin-notas').innerHTML = (n || []).map(x =>
    `<li><span>${x.cfar_estudiantes?.nombre || '?'} · ${x.materia}: ${x.nota} ${x.privada ? '🔒' : ''}</span> <button onclick="borrar('cfar_notas', ${x.id})">Eliminar</button></li>`
  ).join('');

  const { data: ev } = await db.from('cfar_evaluaciones').select('*').order('id');
  document.getElementById('admin-eval').innerHTML = (ev || []).map(x =>
    `<li><span>${x.tipo}: ${x.titulo}</span> <button onclick="borrar('cfar_evaluaciones', ${x.id})">Eliminar</button></li>`
  ).join('');

  const { data: a } = await db.from('cfar_anuncios').select('*').order('id', { ascending: false });
  document.getElementById('admin-anuncios').innerHTML = (a || []).map(x =>
    `<li><span>${x.titulo}</span> <button onclick="borrar('cfar_anuncios', ${x.id})">Eliminar</button></li>`
  ).join('');
}

function limpiar(ids) {
  ids.forEach(id => document.getElementById(id).value = '');
}
