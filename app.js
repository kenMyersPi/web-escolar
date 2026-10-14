// vistas publicas

document.addEventListener('DOMContentLoaded', () => {
  // nav
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.seccion;
      document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
      document.getElementById(id).classList.add('activa');
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
    });
  });

  // carga inicial
  cargarHorario();
  cargarProfesores();
  cargarEstudiantes();
  cargarNotas();
  cargarEvaluaciones();
  cargarAnuncios();
});

const vacio = (msg) => `<div class="vacio">${msg}</div>`;

// horario estilo grilla

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// bloques predefinidos del horario
const BLOQUES_HORA = [
  { inicio: '7:00',  fin: '7:40'  },
  { inicio: '7:40',  fin: '8:20'  },
  { inicio: '8:20',  fin: '9:00'  },
  { inicio: '9:00',  fin: '9:30', receso: true },
  { inicio: '9:30',  fin: '10:10' },
  { inicio: '10:10', fin: '10:50' },
  { inicio: '10:50', fin: '11:30' }
];

// horario fijo (no cambia)

const HORARIO_FIJO = [
  { hora: '7:00 - 7:40',  clases: {
    Lunes:     { m: 'Castellano', p: 'Prof. Ingrid' },
    Martes:    { m: 'Matemática', p: 'Prof. Elizabeth' },
    Miércoles: { m: 'Educación Física', p: 'Prof. Daniel' },
    Jueves:    null,
    Viernes:   { m: 'G.H.C', p: 'Prof. Maruja' }
  }},
  { hora: '7:40 - 8:20',  clases: {
    Lunes: null, Martes: null, Miércoles: null, Jueves: null, Viernes: null
  }},
  { hora: '8:20 - 9:00',  clases: {
    Lunes:     { m: 'Orientación', p: 'Prof. Bárbara' },
    Martes:    { m: 'Biología', p: 'Prof. Bárbara' },
    Miércoles: { m: 'G.H.C', p: 'Prof. Maruja' },
    Jueves:    { m: 'Orientación', p: 'Prof. Bárbara' },
    Viernes:   { m: 'Inglés', p: 'Prof. Ponfati' }
  }},
  { hora: '9:00 - 9:40',  clases: {
    Lunes: null, Martes: null, Miércoles: null, Jueves: null, Viernes: null
  }},
  { receso: true, hora: '9:40 - 9:55' },
  { hora: '9:55 - 10:35', clases: {
    Lunes:     null,
    Martes:    { m: 'Inglés', p: 'Prof. Rondlis' },
    Miércoles: { m: 'Matemática', p: 'Prof. Elizabeth' },
    Jueves:    { m: 'Educación Física', p: 'Prof. Daniel' },
    Viernes:   { m: 'Química', p: 'Prof. Andy' }
  }},
  { hora: '10:35 - 11:15', clases: {
    Lunes: null, Martes: null, Miércoles: null, Jueves: null, Viernes: null
  }},
  { hora: '11:15 - 11:55', clases: {
    Lunes:     { m: 'Orientación', p: 'Prof. Bárbara' },
    Martes:    { m: 'Biología', p: 'Prof. Bárbara' },
    Miércoles: { m: 'Química', p: 'Prof. Andy' },
    Jueves:    { m: 'Orientación', p: 'Prof. Bárbara' },
    Viernes:   { m: 'Biología', p: 'Prof. Bárbara' }
  }},
  { receso: true, hora: '11:55 - 12:10' },
  { hora: '12:10 - 12:50', clases: {
    Lunes:     { m: 'Física', p: 'Prof. Elizabeth' },
    Martes:    null,
    Miércoles: null,
    Jueves:    { m: 'Física', p: 'Prof. Elizabeth' },
    Viernes:   { m: 'Castellano', p: 'Prof. Ingrid' }
  }},
  { hora: '12:50 - 1:30', clases: {
    Lunes: null, Martes: null, Miércoles: null, Jueves: null, Viernes: null
  }}
];

function cargarHorario() {
  const tbody = document.getElementById('cuerpo-horario');
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  tbody.innerHTML = HORARIO_FIJO.map(bloque => {
    // receso
    if (bloque.receso) {
      return `
        <tr>
          <td class="celda-hora">${bloque.hora}</td>
          <td colspan="5" class="celda-receso">☕ Receso</td>
        </tr>`;
    }

    // fila normal
    let fila = `<tr><td class="celda-hora">${bloque.hora}</td>`;
    DIAS.forEach(dia => {
      const c = bloque.clases[dia];
      if (c) {
        fila += `
          <td>
            <div class="celda-materia">
              <span class="materia-nombre">${c.m}</span>
              <span class="materia-profe">${c.p}</span>
            </div>
          </td>`;
      } else {
        fila += `<td class="celda-vacia">—</td>`;
      }
    });
    fila += `</tr>`;
    return fila;
  }).join('');
}

async function cargarProfesores() {
  const cont = document.getElementById('lista-profesores');
  const { data, error } = await db.from('cfar_profesores').select('*').order('id');
  if (error) { cont.innerHTML = vacio('Error al cargar los profesores.'); return; }
  cont.innerHTML = data.length ? data.map(p => `
    <div class="card">
      <h4>${p.nombre}</h4>
      <small>📚 ${p.materia || '—'}</small>
      <p>${p.resena || ''}</p>
    </div>
  `).join('') : vacio('Sin profesores registrados aún.');
}

async function cargarEstudiantes() {
  const cont = document.getElementById('lista-estudiantes');
  const { data, error } = await db.from('cfar_estudiantes').select('id, nombre, curso').order('nombre');
  if (error) { cont.innerHTML = vacio('Error al cargar los estudiantes.'); return; }
  cont.innerHTML = data.length ? data.map(e => `
    <div class="card">
      <h4>${e.nombre}</h4>
      <small>🎓 ${e.curso || '—'}</small>
    </div>
  `).join('') : vacio('Sin estudiantes registrados aún.');
}

async function cargarNotas() {
  const cont = document.getElementById('lista-notas');
  const { data, error } = await db
    .from('cfar_notas')
    .select('id, materia, nota, privada, cfar_estudiantes(nombre)')
    .order('id');
  if (error) { cont.innerHTML = vacio('Error al cargar las notas.'); return; }

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
  }).join('') : vacio('Sin notas registradas aún.');
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
  if (error) { cont.innerHTML = vacio('Error al cargar los anuncios.'); return; }
  cont.innerHTML = data.length ? data.map(a => `
    <div class="card">
      <h4>📢 ${a.titulo}</h4>
      <p>${a.texto}</p>
    </div>
  `).join('') : vacio('Sin anuncios por ahora.');
}
