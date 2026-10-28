// vistas publicas

let ESTUDIANTE_LOGUEADO = null;
let DESTACADOS = [];

document.addEventListener('DOMContentLoaded', () => {
  const sesion = sessionStorage.getItem('cfar_user');
  if (sesion) {
    ESTUDIANTE_LOGUEADO = JSON.parse(sesion);
    actualizarUIUsuario();
  }

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

function iniciales(nombre) {
  return (nombre || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
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

// =================== MODAL ===================
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

// =================== DESTACADOS ===================
async function cargarDestacados() {
  const { data } = await db.from('cfar_destacados').select('*');
  DESTACADOS = data || [];
}

function esDestacado(nombre) {
  return DESTACADOS.find(d => d.nombre.toLowerCase() === (nombre || '').toLowerCase());
}

// =================== HORARIO ===================
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

// =================== LOGIN ===================
function actualizarUIUsuario() {
  const btn = document.getElementById('btn-login-estudiante');
  if (btn && ESTUDIANTE_LOGUEADO) {
    btn.innerHTML = `👤 ${ESTUDIANTE_LOGUEADO.nombre}`;
    btn.onclick = abrirEditarPerfil;
  }
}

function abrirLogin() {
  abrirModal(`
    <div class="modal-login">
      <h2 style="margin-bottom:10px;color:var(--primary-dark);">Iniciar Sesión</h2>
      <p style="margin-bottom:15px;font-size:0.9rem;color:var(--text-muted);">Usa tu nombre exacto y tu clave personal.</p>
      <input type="text" id="login-nombre" placeholder="Tu nombre exacto">
      <input type="password" id="login-clave" placeholder="Tu clave personal">
      <button class="btn-agregar" style="width:100%;margin-top:10px;" onclick="hacerLogin()">Entrar</button>
    </div>
  `);
}

async function hacerLogin() {
  const nombre = document.getElementById('login-nombre').value.trim();
  const clave = document.getElementById('login-clave').value.trim();

  if (!nombre || !clave) return alert('Llena los campos');

  const { data, error } = await db.from('cfar_estudiantes').select('*').eq('nombre', nombre).eq('clave', clave).single();

  if (error || !data) {
    return alert('Nombre o clave incorrectos.');
  }

  ESTUDIANTE_LOGUEADO = data;
  sessionStorage.setItem('cfar_user', JSON.stringify(data));
  cerrarModal();
  actualizarUIUsuario();
  alert('¡Bienvenido ' + data.nombre + '!');
}

function cerrarSesionEstudiante() {
  ESTUDIANTE_LOGUEADO = null;
  sessionStorage.removeItem('cfar_user');
  location.reload();
}

// =================== SUBIR FOTOS (BASE64) ===================
async function subirArchivoBase64(archivo, prefijo) {
  if (!archivo) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result; 
        const res = await fetch(base64Data);
        const blob = await res.blob();
        
        const nombreFinal = `${prefijo}_${Date.now()}.jpg`;
        
        const { data, error } = await db.storage
          .from('cfar_media')
          .upload(nombreFinal, blob, { contentType: 'image/jpeg', upsert: false });

        if (error) {
          alert("Error de Supabase: " + error.message);
          resolve(null);
        } else {
          const { data: urlData } = db.storage.from('cfar_media').getPublicUrl(nombreFinal);
          resolve(urlData.publicUrl + '?t=' + Date.now());
        }
      } catch (err) {
        alert("Error procesando imagen: " + err.message);
        resolve(null);
      }
    };

    reader.onerror = () => {
      alert("El celular no pudo leer la imagen.");
      resolve(null);
    };

    reader.readAsDataURL(archivo); 
  });
}

// =================== EDITAR PERFIL ===================
async function abrirEditarPerfil() {
  if (!ESTUDIANTE_LOGUEADO) return abrirLogin();
  const e = ESTUDIANTE_LOGUEADO;

  abrirModal(`
    <div class="form-perfil">
      <h2 style="margin-bottom:15px;color:var(--primary-dark);">Editar Mi Perfil</h2>

      <label>Foto de Perfil</label>
      <input type="file" id="edit-pfp" accept="image/*">

      <label>Banner Animado (GIF)</label>
      <input type="file" id="edit-banner" accept="image/*">
      
      <label>Apodo / Nickname</label>
      <input type="text" id="edit-apodo" value="${e.apodo || ''}" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);margin-bottom:10px;font-family:inherit;">
      
      <label>Bio / Sobre mí</label>
      <textarea id="edit-bio" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);min-height:80px;margin-bottom:10px;font-family:inherit;">${e.bio || ''}</textarea>
      
      <div style="background:#eff6ff; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #bfdbfe;">
        <p style="font-size:0.85rem; color:#1e40af; font-weight:600; margin-bottom:8px;">🎨 Colores de tu Perfil (Degradado)</p>
        <div style="display:flex; gap:10px;">
          <div style="flex:1;">
            <label style="font-size:0.75rem; margin:0 0 4px 0;">Color 1</label>
            <input type="color" id="edit-color1" value="${e.color1 || '#1e3a8a'}" style="width:100%; cursor:pointer;">
          </div>
          <div style="flex:1;">
            <label style="font-size:0.75rem; margin:0 0 4px 0;">Color 2</label>
            <input type="color" id="edit-color2" value="${e.color2 || '#3b82f6'}" style="width:100%; cursor:pointer;">
          </div>
        </div>
      </div>
      
      <label>Nueva Clave (dejar vacío si no quieres cambiarla)</label>
      <input type="password" id="edit-clave" placeholder="Nueva contraseña" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);margin-bottom:15px;font-family:inherit;">

      <button class="btn-agregar" style="width:100%;" onclick="guardarPerfil()">Guardar Cambios</button>
      <button class="btn-salir" style="width:100%;margin-top:10px;background:#dc2626;" onclick="cerrarSesionEstudiante()">Cerrar Sesión</button>
    </div>
  `);
}

async function guardarPerfil() {
  const id = ESTUDIANTE_LOGUEADO.id;
  const btn = document.querySelector('.modal .btn-agregar');
  const textoOriginal = btn.textContent;
  btn.textContent = 'Guardando...'; btn.disabled = true;

  const pfpFile = document.getElementById('edit-pfp').files[0];
  const bannerFile = document.getElementById('edit-banner').files[0];
  const apodo = document.getElementById('edit-apodo').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  const color1 = document.getElementById('edit-color1').value;
  const color2 = document.getElementById('edit-color2').value;
  const nuevaClave = document.getElementById('edit-clave').value.trim();

  let pfp_url = ESTUDIANTE_LOGUEADO.pfp_url;
  let banner_url = ESTUDIANTE_LOGUEADO.banner_url;

  if (pfpFile) {
    btn.textContent = 'Subiendo Foto...';
    const nuevaPfp = await subirArchivoBase64(pfpFile, 'pfp');
    if (nuevaPfp) pfp_url = nuevaPfp;
  }
  
  if (bannerFile) {
    btn.textContent = 'Subiendo Banner...';
    const nuevoBanner = await subirArchivoBase64(bannerFile, 'banner');
    if (nuevoBanner) banner_url = nuevoBanner;
  }

  btn.textContent = 'Guardando...';
  const updates = { apodo, bio, color1, color2, pfp_url, banner_url };
  if (nuevaClave) updates.clave = nuevaClave;

  const { error } = await db.from('cfar_estudiantes').update(updates).eq('id', id);

  if (error) { 
    alert('Error al guardar en base de datos: ' + error.message); 
    btn.textContent = textoOriginal;
    btn.disabled = false; 
    return; 
  }

  const { data } = await db.from('cfar_estudiantes').select('*').eq('id', id).single();
  ESTUDIANTE_LOGUEADO = data;
  sessionStorage.setItem('cfar_user', JSON.stringify(data));
  
  cerrarModal();
  actualizarUIUsuario();
  cargarEstudiantes(); 
  alert('¡Perfil actualizado!');
}

// =================== ESTUDIANTES ===================
async function cargarEstudiantes() {
  const cont = document.getElementById('lista-estudiantes');
  await cargarDestacados();

  const { data, error } = await db.from('cfar_estudiantes').select('*').order('nombre');
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }

  cont.innerHTML = data.length ? data.map(e => {
    const dest = esDestacado(e.nombre);
    
    // Degradado para toda la tarjeta
    const grad = `linear-gradient(135deg, ${e.color1 || '#1e3a8a'}, ${e.color2 || '#3b82f6'})`;
    let pfpLimpia = e.pfp_url ? e.pfp_url.split('?')[0] : null;
    let bannerLimpio = e.banner_url ? e.banner_url.split('?')[0] : null;

    // Si tiene colores personalizados, el texto es blanco
    const textoColor = e.color1 ? '#ffffff' : 'var(--text)';
    const subTextoColor = e.color1 ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)';

    return `
      <div class="card card-click ${dest ? 'destacado' : ''}" 
           style="background: ${grad}; color: ${textoColor};" 
           onclick="verPerfilEstudiante(${e.id})">
        
        ${bannerLimpio ? `
          <div style="margin: -22px -22px 15px -22px; overflow:hidden; border-radius: 14px 14px 0 0;">
            <img src="${bannerLimpio}" style="width:100%; height:80px; object-fit:cover; transition: transform 0.5s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          </div>
        ` : ''}

        <div style="display:flex;gap:14px;align-items:center;">
          ${pfpLimpia 
            ? `<img src="${pfpLimpia}" class="pfp-img" style="border-color:${textoColor}; display:block !important; width:64px; height:64px; object-fit:cover;">` 
            : `<div class="avatar" style="background:rgba(255,255,255,0.2); color:${textoColor}; border:2px solid ${textoColor};">${iniciales(e.nombre)}</div>`}
          
          <div>
            <h4 style="margin:0; color:${textoColor};">${e.nombre}${dest?.corona ? '<span class="corona">👑</span>' : ''}</h4>
            ${e.apodo ? `<small style="color:${subTextoColor};font-weight:600;">"${e.apodo}"</small>` : ''}
            <small style="color:${subTextoColor};">🎓 ${e.curso || '—'}</small>
          </div>
        </div>
      </div>`;
  }).join('') : vacio('Sin estudiantes registrados aún.');
}

async function verPerfilEstudiante(id) {
  const { data: e } = await db.from('cfar_estudiantes').select('*').eq('id', id).single();
  if (!e) return;

  const dest = esDestacado(e.nombre);
  const grad = `linear-gradient(135deg, ${e.color1 || '#1e3a8a'}, ${e.color2 || '#3b82f6'})`;

  const { data: notas } = await db.from('cfar_notas').select('materia, nota, privada').eq('estudiante_id', id);
  const lista = notas || [];
  const promedio = lista.length ? (lista.reduce((s, n) => s + Number(n.nota), 0) / lista.length).toFixed(2) : null;

  const { data: muro } = await db.from('cfar_muro').select('*').eq('estudiante_id', id).order('id', { ascending: false });

  const notasHTML = lista.map(n => `<li><span>${n.materia}</span> <strong>${n.nota}</strong></li>`).join('');
  const muroHTML = (muro || []).map(m => `
    <li class="muro-item">
      <strong>${m.autor_nombre}</strong>
      ${m.mensaje}
    </li>
  `).join('');

  let pfpLimpia = e.pfp_url ? e.pfp_url.split('?')[0] : null;
  let bannerLimpio = e.banner_url ? e.banner_url.split('?')[0] : null;

  abrirModal(`
    ${bannerLimpio ? `
      <div style="width: 100%; max-height: 160px; overflow: hidden; border-radius: 18px 18px 0 0; margin-bottom: 15px;">
        <img src="${bannerLimpio}" style="width: 100%; height: 160px; object-fit: cover; object-position: center; display: block;">
      </div>
    ` : ''}
    
    ${dest ? `<div class="banner-destacado" style="margin-top:${bannerLimpio ? '0' : '10px'};">👑 ${dest.frase || 'Usuario destacado'}</div>` : ''}

    <div class="modal-perfil-header" style="margin-top:${bannerLimpio ? '10px' : '0'};">
      ${pfpLimpia 
        ? `<img src="${pfpLimpia}" class="pfp-img grande" style="box-shadow:0 0 20px ${e.color1}; display:block !important; width:96px; height:96px; object-fit:cover;">` 
        : `<div class="avatar avatar-grande" style="background:${grad}">${iniciales(e.nombre)}</div>`}
      
      <div>
        <h2 style="color:${e.color2}">${e.nombre}${dest?.corona ? ' <span class="corona">👑</span>' : ''}</h2>
        ${e.apodo ? `<div class="apodo" style="color:${e.color2}">"${e.apodo}"</div>` : ''}
        <div class="curso">🎓 ${e.curso || '—'}</div>
        
        ${e.badges && e.badges.length ? `<div style="margin-top:8px;">${e.badges.map(b => `<span class="badge">🏅 ${b}</span>`).join('')}</div>` : ''}
      </div>
    </div>

    ${dest?.audio_url ? `
      <audio controls style="width:100%;margin:15px 0; height:35px;">
        <source src="${dest.audio_url}">
      </audio>
    ` : ''}

    <div style="display:flex;gap:10px;margin-top:15px;flex-wrap:wrap;">
      <div class="bio" style="flex:1;">${e.bio || 'Este estudiante no ha escrito su biografía.'}</div>
    </div>

    ${promedio ? `
      <h3>📊 Promedio general</h3>
      <div class="promedio-big" style="background:${grad}">
        <div class="num">${promedio}</div>
        <div class="label">${lista.length} materias</div>
      </div>
    ` : ''}

    <h3>💬 Muro (Sugerencias / Mensajes)</h3>
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <input type="text" id="muro-nombre" placeholder="Tu nombre" style="width:30%;padding:8px;border-radius:6px;border:1px solid #ccc;font-family:inherit;">
      <input type="text" id="muro-msg" placeholder="Escribe un mensaje..." style="flex:1;padding:8px;border-radius:6px;border:1px solid #ccc;font-family:inherit;">
      <button class="btn-agregar" style="margin:0;" onclick="enviarMuro(${e.id})">Enviar</button>
    </div>
    <ul class="muro-lista">${muroHTML || '<p style="font-size:0.8rem;color:#888;">Sin mensajes aún.</p>'}</ul>
  `, dest ? 'modal-galaxia' : '');
}

async function enviarMuro(estudianteId) {
  const autor = document.getElementById('muro-nombre').value.trim();
  const msg = document.getElementById('muro-msg').value.trim();
  if (!autor || !msg) return alert('Escribe tu nombre y el mensaje');

  const { error } = await db.from('cfar_muro').insert({ estudiante_id: estudianteId, autor_nombre: autor, mensaje: msg });
  if (error) return alert('Error: ' + error.message);
  
  verPerfilEstudiante(estudianteId); 
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

  const { data: notas } = await db.from('cfar_notas')
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

  const { data: nota } = await db.from('cfar_notas').select('nota, estudiante_id').eq('id', notaId).single();
  const { data: est } = await db.from('cfar_estudiantes').select('clave').eq('id', nota.estudiante_id).single();

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
