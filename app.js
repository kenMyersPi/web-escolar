// vistas publicas

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.seccion;
      document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
      document.getElementById(id).classList.add('activa');
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
    });
  });

  cargarHorario();
  cargarProfesores();
  cargarEstudiantes();
  cargarNotas();
  cargarEvaluaciones();
  cargarAnuncios();
});

const vacio = (msg) => `<div class="vacio">${msg}</div>`;
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

let DESTACADOS = [];

// helpers
function iniciales(nombre) {
  return (nombre || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

function colorMateria(materia) {
  if (!materia) return 'default';
  const m = materia.toLowerCase();
  if (m.includes('matem')) return 'matematica';
  if (m.includes('castell') || m.includes('lengua')) return 'castellano';
  if (m.includes('biol')) return 'biologia';
  if (m.includes('quim')) return 'quimica';
  if (m.includes('fisic')) return 'fisica';
  if (m.includes('ingles') || m.includes('ingl')) return 'ingles';
  if (m.includes('ghc') || m.includes('g.h.c') || m.includes('geograf')) return 'ghc';
  if (m.includes('educ') && m.includes('fisic')) return 'edfisica';
  if (m.includes('orient')) return 'orientacion';
  if (m.includes('grupo')) return 'grupo';
  return 'default';
}

// modal
function abrirModal(html, claseExtra = '') {
  cerrarModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-global';
  overlay.innerHTML = `
    <div class="modal ${claseExtra}">
      <button class="modal-cerrar" onclick="cerrarModal()">✕</button>
      <div class="modal-body">${html}</div>
    </div>`;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) cerrarModal();
  });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  const m = document.getElementById('modal-global');
  if (m) m.remove();
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarModal();
});

// destacados
async function cargarDestacados() {
  const { data } = await db.from('cfar_destacados').select('*');
  DESTACADOS = data || [];
}

function esDestacado(nombre) {
  return DESTACADOS.find(d => d.nombre.toLowerCase() === (nombre || '').toLowerCase());
}

// horario fijo
const HORARIO_FIJO = [
  { hora: '7:00 - 8:20', clases: {
    Lunes:     { m: 'Castellano', p: 'Prof. Ingrid' },
    Martes:    { m: 'Matemática', p: 'Prof. Elizabeth' },
    Miércoles: { m: 'Educación Física', p: 'Prof. Darye' },
    Jueves:    null,
    Viernes:   { m: 'G.H.C', p: 'Prof. Marquina' }
  }},
  { hora: '8:20 - 9:40', clases: {
    Lunes:     { m: 'Grupo estable', p: 'Prof. Bárbara' },
    Martes:    { m: 'Biología', p: 'Prof. Bárbara' },
    Miércoles: { m: 'G.H.C', p: 'Prof. Marquina' },
    Jueves:    { m: 'Grupo estable', p: 'Prof. Bárbara' },
    Viernes:   { m: 'Inglés', p: 'Prof. Ronaldo' }
  }},
  { receso: true, hora: '9:40 - 9:55' },
  { hora: '9:55 - 11:15', clases: {
    Lunes:     null,
    Martes:    { m: 'Inglés', p: 'Prof. Ronaldo' },
    Miércoles: { m: 'Matemática', p: 'Prof. Elizabeth' },
    Jueves:    { m: 'Educación Física', p: 'Prof. Darye' },
    Viernes:   { m: 'Química', p: 'Prof. Andy' }
  }},
  { hora: '11:15 - 11:55', clases: {
    Lunes:     { m: 'Grupo estable', p: 'Prof. Bárbara' },
    Martes:    { m: 'Biología', p: 'Prof. Bárbara' },
    Miércoles: { m: 'Química', p: 'Prof. Andy' },
    Jueves:    { m: 'Grupo estable', p: 'Prof. Bárbara' },
    Viernes:   { m: 'Biología', p: 'Prof. Bárbara' }
  }},
  { receso: true, hora: '11:55 - 12:10' },
  { hora: '12:10 - 1:30', clases: {
    Lunes:     { m: 'Física', p: 'Prof. Elizabeth' },
    Martes:    null,
    Miércoles: { m: 'Física', p: 'Prof. Elizabeth' },
    Jueves:    null,
    Viernes:   { m: 'Castellano', p: 'Prof. Ingrid' }
  }}
];

function cargarHorario() {
  const tbody = document.getElementById('cuerpo-horario');
  if (!tbody) return;

  tbody.innerHTML = HORARIO_FIJO.map(bloque => {
    if (bloque.receso) {
      return `
        <tr>
          <td class="celda-hora">${bloque.hora}</td>
          <td colspan="5" class="celda-receso">☕ Receso</td>
        </tr>`;
    }

    let fila = `<tr><td class="celda-hora">${bloque.hora}</td>`;
    DIAS.forEach(dia => {
      const c = bloque.clases[dia];
      if (c) {
        const color = colorMateria(c.m);
        fila += `
          <td>
            <div class="celda-materia materia-${color}">
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

// =================== PROFESORES ===================
async function cargarProfesores() {
  const cont = document.getElementById('lista-profesores');
  const { data, error } = await db.from('cfar_profesores').select('*').order('id');
  if (error) { cont.innerHTML = vacio('Error al cargar los profesores.'); return; }

  cont.innerHTML = data.length ? data.map(p => `
    <div class="card card-click" onclick="verPerfilProfesor(${p.id})">
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:8px;">
        <div class="avatar">${iniciales(p.nombre)}</div>
        <div>
          <h4 style="margin:0;">${p.nombre}</h4>
          ${p.apodo ? `<small style="color:var(--primary);font-weight:600;">"${p.apodo}"</small>` : ''}
          <small>📚 ${p.materia || '—'}</small>
        </div>
      </div>
      <p>${p.resena || p.bio || ''}</p>
    </div>
  `).join('') : vacio('Sin profesores registrados aún.');
}

async function verPerfilProfesor(id) {
  const { data: p } = await db.from('cfar_profesores').select('*').eq('id', id).single();
  if (!p) return;

  const { data: notas } = await db
    .from('cfar_notas')
    .select('nota, materia')
    .ilike('materia', `%${(p.materia || '').split(' ')[0]}%`);

  const promedioProfe = notas && notas.length
    ? (notas.reduce((s, n) => s + Number(n.nota), 0) / notas.length).toFixed(2)
    : null;

  abrirModal(`
    <div class="modal-perfil-header">
      <div class="avatar avatar-grande">${iniciales(p.nombre)}</div>
      <div>
        <h2>${p.nombre}</h2>
        ${p.apodo ? `<div class="apodo">"${p.apodo}"</div>` : ''}
        <div class="curso">📚 ${p.materia || '—'}</div>
      </div>
    </div>

    ${p.bio || p.resena ? `
      <h3>📝 Sobre el profe</h3>
      <div class="bio">${p.bio || p.resena}</div>
    ` : ''}

    ${promedioProfe ? `
      <h3>📊 Promedio general en ${p.materia}</h3>
      <div class="promedio-big">
        <div class="num">${promedioProfe}</div>
        <div class="label">Promedio del curso</div>
      </div>
    ` : ''}
  `);
}

// =================== ESTUDIANTES ===================
async function cargarEstudiantes() {
  const cont = document.getElementById('lista-estudiantes');

  await cargarDestacados();

  const { data, error } = await db.from('cfar_estudiantes').select('id, nombre, curso, apodo').order('nombre');
  if (error) { cont.innerHTML = vacio('Error al cargar los estudiantes.'); return; }

  cont.innerHTML = data.length ? data.map(e => {
    const dest = esDestacado(e.nombre);
    const claseExtra = dest ? ' destacado' : '';
    const corona = dest?.corona ? '<span class="corona">👑</span>' : '';
    const tag = dest ? '<div class="tag-creador">Creador</div>' : '';

    return `
      <div class="card card-click${claseExtra}" onclick="verPerfilEstudiante(${e.id})">
        <div style="display:flex;gap:14px;align-items:center;">
          <div class="avatar">${iniciales(e.nombre)}</div>
          <div>
            <h4 style="margin:0;">${e.nombre}${corona}</h4>
            ${e.apodo ? `<small style="color:var(--primary);font-weight:600;">"${e.apodo}"</small>` : ''}
            <small>🎓 ${e.curso || '—'}</small>
            ${tag}
          </div>
        </div>
      </div>`;
  }).join('') : vacio('Sin estudiantes registrados aún.');
}

async function verPerfilEstudiante(id) {
  const { data: e } = await db.from('cfar_estudiantes').select('*').eq('id', id).single();
  if (!e) return;

  const dest = esDestacado(e.nombre);

  const { data: notas } = await db
    .from('cfar_notas')
    .select('materia, nota, privada')
    .eq('estudiante_id', id)
    .order('materia');

  const lista = notas || [];
  const promedio = lista.length
    ? (lista.reduce((s, n) => s + Number(n.nota), 0) / lista.length).toFixed(2)
    : null;

  const notasHTML = lista.length ? `
    <ul class="lista-notas-perfil">
      ${lista.map(n => `
        <li class="${Number(n.nota) >= 10 ? 'aprobada' : 'reprobada'}">
          <span>${n.materia} ${n.privada ? '🔒' : ''}</span>
          <span class="nota">${n.nota}</span>
        </li>
      `).join('')}
    </ul>` : '<p style="color:var(--text-muted);">Sin notas registradas aún.</p>';

  const links = [];
  if (dest?.discord) links.push(`<a class="link-perfil discord" href="https://discord.com/users/${dest.discord}" target="_blank" rel="noopener">💬 Discord</a>`);
  if (dest?.github)  links.push(`<a class="link-perfil github" href="https://github.com/${dest.github}" target="_blank" rel="noopener">🐙 GitHub</a>`);
  if (dest?.twitter) links.push(`<a class="link-perfil" href="https://twitter.com/${dest.twitter}" target="_blank" rel="noopener">🐦 Twitter</a>`);
  if (dest?.web)     links.push(`<a class="link-perfil" href="${dest.web}" target="_blank" rel="noopener">🌐 Web</a>`);

  abrirModal(`
    ${dest ? `
      <div class="banner-destacado">
        <span style="font-size:1.1rem;">👑</span>
        ${dest.frase || 'Usuario destacado'}
      </div>
    ` : ''}

    <div class="modal-perfil-header">
      <div class="avatar avatar-grande">${iniciales(e.nombre)}</div>
      <div>
        <h2>${e.nombre}${dest?.corona ? ' <span class="corona">👑</span>' : ''}</h2>
        ${e.apodo ? `<div class="apodo">"${e.apodo}"</div>` : ''}
        <div class="curso">🎓 ${e.curso || '—'}</div>
        ${dest ? '<div class="tag-creador">Creador de la página</div>' : ''}
      </div>
    </div>

    ${links.length ? `<div class="links-perfil">${links.join('')}</div>` : ''}

    ${e.bio ? `
      <h3>📝 Sobre mí</h3>
      <div class="bio">${e.bio}</div>
    ` : ''}

    ${promedio ? `
      <h3>📊 Promedio general</h3>
      <div class="promedio-big">
        <div class="num">${promedio}</div>
        <div class="label">${lista.length} materias registradas</div>
      </div>
    ` : ''}

    <h3>📋 Notas registradas</h3>
    ${notasHTML}
  `, dest ? 'modal-galaxia' : '');
}

// =================== NOTAS ===================
async function cargarNotas() {
  const cont = document.getElementById('lista-notas');
  const { data, error } = await db
    .from('cfar_notas')
    .select('id, materia, nota, privada, cfar_estudiantes(nombre)')
    .order('id');
  if (error) { cont.innerHTML = vacio('Error al cargar las notas.'); return; }

  cont.innerHTML = data.length ? data.map(n => {
    const nombre = n.cfar_estudiantes?.nombre || 'Desconocido';
    const color = colorMateria(n.materia);
    if (n.privada) {
      return `
        <div class="card nota-card materia-${color}">
          <span class="materia-tag" style="background: var(--mat-color);">${n.materia}</span>
          <h4>${nombre}</h4>
          <p class="privada">🔒 Nota privada</p>
          <input type="password" placeholder="Clave del estudiante" onchange="verPrivada(this, ${n.id})">
        </div>`;
    }
    return `
      <div class="card nota-card materia-${color}">
        <span class="materia-tag" style="background: var(--mat-color);">${n.materia}</span>
        <h4>${nombre}</h4>
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

// =================== EVALUACIONES ===================
async function cargarEvaluaciones() {
  const cont = document.getElementById('lista-evaluaciones');
  const { data, error } = await db.from('cfar_evaluaciones').select('*').order('fecha', { ascending: true });
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }

  cont.innerHTML = data.length ? data.map(ev => `
    <div class="card card-click" onclick="verEvaluacion(${ev.id})">
      <h4>${ev.tipo === 'Examen' ? '📝' : '📁'} ${ev.titulo}</h4>
      <small>📚 ${ev.materia || '—'} · 📅 ${ev.fecha || 'Sin fecha'}</small>
      <p>${ev.descripcion || ''}</p>
    </div>
  `).join('') : vacio('Sin proyectos ni exámenes.');
}

async function verEvaluacion(id) {
  const { data: ev } = await db.from('cfar_evaluaciones').select('*').eq('id', id).single();
  if (!ev) return;

  abrirModal(`
    <div style="padding: 6px 0 0;">
      <span style="display:inline-block;padding:4px 12px;background:${ev.tipo === 'Examen' ? '#fee2e2' : '#dbeafe'};color:${ev.tipo === 'Examen' ? '#b91c1c' : '#1e40af'};border-radius:999px;font-size:0.75rem;font-weight:600;margin-bottom:10px;">
        ${ev.tipo}
      </span>
      <h2 style="color:var(--primary-dark);font-size:1.35rem;font-weight:700;margin-bottom:8px;">${ev.titulo}</h2>
      <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:20px;">
        📚 ${ev.materia || '—'} · 📅 ${ev.fecha || 'Sin fecha'}
      </p>

      ${ev.descripcion ? `
        <h3>📌 Descripción</h3>
        <div class="bio">${ev.descripcion}</div>
      ` : ''}

      ${ev.contenido ? `
        <h3>📖 Tema completo</h3>
        <div class="contenido-largo">${ev.contenido}</div>
      ` : `
        <p style="color:var(--text-muted);font-style:italic;margin-top:20px;">
          Aún no hay contenido agregado para este ${ev.tipo.toLowerCase()}.
        </p>
      `}
    </div>
  `);
}

// =================== ANUNCIOS ===================
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
