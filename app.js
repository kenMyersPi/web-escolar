// vistas publicas

function mostrarSeccion(id, ev) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');

  if (ev) {
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('activo'));
    ev.target.classList.add('activo');
  }
}

const vacio = (msg) => `<div class="vacio">${msg}</div>`;

async function cargarHorario() {
  const cont = document.getElementById('lista-horario');
  const { data, error } = await db.from('cfar_horario').select('*').order('id');
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }
  cont.innerHTML = data.length ? data.map(h => `
    <div class="card">
      <h4>${h.materia}</h4>
      <small>📅 ${h.dia} · 🕐 ${h.hora}</small>
      <small>👨‍🏫 ${h.profesor || 'Sin asignar'}</small>
    </div>
  `).join('') : vacio('Sin clases registradas.');
}

async function cargarProfesores() {
  const cont = document.getElementById('lista-profesores');
  const { data, error } = await db.from('cfar_profesores').select('*').order('id');
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }
  cont.innerHTML = data.length ? data.map(p => `
    <div class="card">
      <h4>${p.nombre}</h4>
      <small>📚 ${p.materia || '—'}</small>
      <p>${p.resena || ''}</p>
    </div>
  `).join('') : vacio('Sin profesores registrados.');
}

async function cargarEstudiantes() {
  const cont = document.getElementById('lista-estudiantes');
  const { data, error } = await db.from('cfar_estudiantes').select('id, nombre, curso').order('nombre');
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }
  cont.innerHTML = data.length ? data.map(e => `
    <div class="card">
      <h4>${e.nombre}</h4>
      <small>🎓 ${e.curso || '—'}</small>
    </div>
  `).join('') : vacio('Sin estudiantes registrados.');
}

async function cargarNotas() {
  const cont = document.getElementById('lista-notas');
  const { data, error } = await db
    .from('cfar_notas')
    .select('id, materia, nota, privada, cfar_estudiantes(nombre)')
    .order('id');
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }

  cont.innerHTML = data.length ? data.map(n => {
    const nombre = n.cfar_estudiantes?.nombre || 'Desconocido';
    if (n.privada) {
      return `
        <div class="card">
          <h4>${nombre} · ${n.materia}</h4>
          <p class="privada">🔒 Nota privada</p>
          <input type="password" placeholder="Clave del estudiante" onchange="verPrivada(this, ${n.id})">
        </div>`;
    }
    return `
      <div class="card">
        <h4>${nombre} · ${n.materia}</h4>
        <p>📊 Nota: <strong>${n.nota}</strong></p>
      </div>`;
  }).join('') : vacio('Sin notas registradas.');
}

async function verPrivada(input, notaId) {
  const clave = input.value.trim();
  if (!clave) return;

  const { data: nota } = await db
    .from('cfar_notas')
    .select('nota, estudiante_id')
    .eq('id', notaId)
    .single();

  const { data: est } = await db
    .from('cfar_estudiantes')
    .select('clave')
    .eq('id', nota.estudiante_id)
    .single();

  if (est && est.clave === clave) {
    input.outerHTML = `<p>📊 Nota: <strong>${nota.nota}</strong></p>`;
  } else {
    input.value = '';
    alert('Clave incorrecta');
  }
}

async function cargarEvaluaciones() {
  const cont = document.getElementById('lista-evaluaciones');
  const { data, error } = await db.from('cfar_evaluaciones').select('*').order('fecha', { ascending: true });
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }
  cont.innerHTML = data.length ? data.map(ev => `
    <div class="card">
      <h4>${ev.tipo === 'Examen' ? '📝' : '📁'} ${ev.titulo}</h4>
      <small>📚 ${ev.materia || '—'} · 📅 ${ev.fecha || 'Sin fecha'}</small>
      <p>${ev.descripcion || ''}</p>
    </div>
  `).join('') : vacio('Sin proyectos ni exámenes.');
}

async function cargarAnuncios() {
  const cont = document.getElementById('lista-anuncios');
  const { data, error } = await db.from('cfar_anuncios').select('*').order('id', { ascending: false });
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }
  cont.innerHTML = data.length ? data.map(a => `
    <div class="card">
      <h4>📢 ${a.titulo}</h4>
      <p>${a.texto}</p>
    </div>
  `).join('') : vacio('Sin anuncios.');
}

cargarHorario();
cargarProfesores();
cargarEstudiantes();
cargarNotas();
cargarEvaluaciones();
cargarAnuncios();
