// vistas publicas

function mostrarSeccion(id) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');
}

async function cargarHorario() {
  const cont = document.getElementById('lista-horario');
  const { data, error } = await supabaseClient.from('cfar_horario').select('*').order('id');
  if (error) { cont.innerHTML = '<p>Error al cargar.</p>'; return; }
  cont.innerHTML = data.length ? data.map(h => `
    <div class="card">
      <h4>${h.materia}</h4>
      <small>📅 ${h.dia} · 🕐 ${h.hora}</small>
      <small>👨‍🏫 ${h.profesor || 'Sin asignar'}</small>
    </div>
  `).join('') : '<p>Sin clases registradas.</p>';
}

async function cargarProfesores() {
  const cont = document.getElementById('lista-profesores');
  const { data, error } = await supabaseClient.from('cfar_profesores').select('*').order('id');
  if (error) { cont.innerHTML = '<p>Error al cargar.</p>'; return; }
  cont.innerHTML = data.length ? data.map(p => `
    <div class="card">
      <h4>${p.nombre}</h4>
      <small>📚 ${p.materia || '—'}</small>
      <p>${p.resena || ''}</p>
    </div>
  `).join('') : '<p>Sin profesores registrados.</p>';
}

async function cargarEstudiantes() {
  const cont = document.getElementById('lista-estudiantes');
  const { data, error } = await supabaseClient.from('cfar_estudiantes').select('id, nombre, curso').order('nombre');
  if (error) { cont.innerHTML = '<p>Error al cargar.</p>'; return; }
  cont.innerHTML = data.length ? data.map(e => `
    <div class="card">
      <h4>${e.nombre}</h4>
      <small>🎓 ${e.curso || '—'}</small>
    </div>
  `).join('') : '<p>Sin estudiantes registrados.</p>';
}

async function cargarNotas() {
  const cont = document.getElementById('lista-notas');
  const { data, error } = await supabaseClient
    .from('cfar_notas')
    .select('id, materia, nota, privada, cfar_estudiantes(nombre)')
    .order('id');
  if (error) { cont.innerHTML = '<p>Error al cargar.</p>'; return; }

  cont.innerHTML = data.length ? data.map(n => {
    const nombre = n.cfar_estudiantes?.nombre || 'Desconocido';
    if (n.privada) {
      return `
        <div class="card" data-id="${n.id}">
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
  }).join('') : '<p>Sin notas registradas.</p>';
}

async function verPrivada(input, notaId) {
  const clave = input.value.trim();
  if (!clave) return;

  const { data: nota } = await supabaseClient
    .from('cfar_notas')
    .select('nota, estudiante_id')
    .eq('id', notaId)
    .single();

  const { data: est } = await supabaseClient
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
  const { data, error } = await supabaseClient.from('cfar_evaluaciones').select('*').order('fecha', { ascending: true });
  if (error) { cont.innerHTML = '<p>Error al cargar.</p>'; return; }
  cont.innerHTML = data.length ? data.map(ev => `
    <div class="card">
      <h4>${ev.tipo === 'Examen' ? '📝' : '📁'} ${ev.titulo}</h4>
      <small>📚 ${ev.materia || '—'} · 📅 ${ev.fecha || 'Sin fecha'}</small>
      <p>${ev.descripcion || ''}</p>
    </div>
  `).join('') : '<p>Sin proyectos ni exámenes.</p>';
}

async function cargarAnuncios() {
  const cont = document.getElementById('lista-anuncios');
  const { data, error } = await supabaseClient.from('cfar_anuncios').select('*').order('id', { ascending: false });
  if (error) { cont.innerHTML = '<p>Error al cargar.</p>'; return; }
  cont.innerHTML = data.length ? data.map(a => `
    <div class="card">
      <h4>📢 ${a.titulo}</h4>
      <p>${a.texto}</p>
    </div>
  `).join('') : '<p>Sin anuncios.</p>';
}

// cargar todo al inicio
cargarHorario();
cargarProfesores();
cargarEstudiantes();
cargarNotas();
cargarEvaluaciones();
cargarAnuncios();
