// vistas publicas

let ESTUDIANTE_LOGUEADO = null;
let DESTACADOS = [];
let MUSICA_ACTIVA = false;

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
  
  crearReproductorGlobal();
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

// =================== REPRODUCTOR GLOBAL ===================
// Cambia este link por el MP3 que tú quieras que suene de fondo en toda la página
const URL_MUSICA_FONDO = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

function crearReproductorGlobal() {
  const div = document.createElement('div');
  div.className = 'music-player';
  div.innerHTML = `
    <button id="btn-musica" onclick="toggleMusicaGlobal()">▶️</button>
    <span style="font-size:0.8rem; font-weight:600; color:var(--text);">Música Lo-Fi</span>
    <audio id="audio-global" loop>
      <source src="${URL_MUSICA_FONDO}" type="audio/mpeg">
    </audio>
  `;
  document.body.appendChild(div);
}

function toggleMusicaGlobal() {
  const audio = document.getElementById('audio-global');
  const btn = document.getElementById('btn-musica');
  if (MUSICA_ACTIVA) {
    audio.pause();
    btn.innerHTML = '▶️';
  } else {
    audio.play();
    btn.innerHTML = '⏸️';
  }
  MUSICA_ACTIVA = !MUSICA_ACTIVA;
}

// =================== MODAL ===================
function abrirModal(html, claseExtra = '', fondoGradiente = '') {
  cerrarModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-global';
  
  // Si hay degradado personalizado, se aplica al fondo del modal
  const estiloFondo = fondoGradiente ? `style="background: ${fondoGradiente};"` : '';

  overlay.innerHTML = `
    <div class="modal ${claseExtra}" ${estiloFondo}>
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
      <h2 style="margin-bottom:10px;color:white;">Iniciar Sesión</h2>
      <p style="margin-bottom:15px;font-size:0.9rem;color:var(--text-muted);">Usa tu nombre exacto y tu clave personal.</p>
      <input type="text" id="login-nombre" placeholder="Tu nombre exacto" style="background:#0f172a; color:white; border:1px solid var(--border);">
      <input type="password" id="login-clave" placeholder="Tu clave personal" style="background:#0f172a; color:white; border:1px solid var(--border);">
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
      <h2 style="margin-bottom:15px;color:white;">Editar Mi Perfil</h2>

      <label style="color:white;">Foto de Perfil</label>
      <input type="file" id="edit-pfp" accept="image/*">

      <label style="color:white;">Banner Animado (GIF)</label>
      <input type="file" id="edit-banner" accept="image/*">
      
      <label style="color:white;">Apodo / Nickname</label>
      <input type="text" id="edit-apodo" value="${e.apodo || ''}" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);margin-bottom:10px;font-family:inherit;">
      
      <label style="color:white;">Bio / Sobre mí</label>
      <textarea id="edit-bio" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);min-height:80px;margin-bottom:10px;font-family:inherit;">${e.bio || ''}</textarea>
      
      <div style="background:rgba(59,130,246,0.1); padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid rgba(59,130,246,0.3);">
        <p style="font-size:0.85rem; color:#93c5fd; font-weight:600; margin-bottom:8px;">🎨 Colores de tu Perfil (Degradado)</p>
        <div style="display:flex; gap:10px;">
          <div style="flex:1;">
            <label style="font-size:0.75rem; margin:0 0 4px 0; color:var(--text-muted);">Color 1</label>
            <input type="color" id="edit-color1" value="${e.color1 || '#1e3a8a'}" style="width:100%; cursor:pointer;">
          </div>
          <div style="flex:1;">
            <label style="font-size:0.75rem; margin:0 0 4px 0; color:var(--text-muted);">Color 2</label>
            <input type="color" id="edit-color2" value="${e.color2 || '#3b82f6'}" style="width:100%; cursor:pointer;">
          </div>
        </div>
      </div>
      
      <label style="color:white;">Nueva Clave (dejar vacío si no quieres cambiarla)</label>
      <input type="password" id="edit-clave" placeholder="Nueva contraseña" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);margin-bottom:15px;font-family:inherit;">

      <button class="btn-agregar" style="width:100%;" onclick="guardarPerfil()">Guardar Cambios</button>
      <button class="btn-salir" style="width:100%;margin-top:10px;background:#dc2626; border:none;" onclick="cerrarSesionEstudiante()">Cerrar Sesión</button>
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
           style="background: ${grad}; color: ${textoColor}; padding: 0; overflow: hidden;" 
           onclick="verPerfilEstudiante(${e.id})">
        
        <!-- Banner en la Card -->
        ${bannerLimpio ? `
          <div style="width:100%; height:80px; overflow:hidden;">
            <img src="${bannerLimpio}" style="width:100%; height:100%; object-fit:cover; transition: transform 0.5s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          </div>
        ` : ''}

        <!-- Contenido de la Card con padding -->
        <div style="padding: 15px 20px 20px 20px; ${bannerLimpio ? 'margin-top: -30px;' : ''}">
          <div style="display:flex;gap:14px;align-items:flex-end; position:relative; z-index:2;">
            
            ${pfpLimpia 
              ? `<img src="${pfpLimpia}" class="pfp-img" style="border: 3px solid ${textoColor}; display:block !important; width:64px; height:64px; object-fit:cover; background: #fff;">` 
              : `<div class="avatar" style="background:rgba(0,0,0,0.3); color:${textoColor}; border:3px solid ${textoColor};">${iniciales(e.nombre)}</div>`}
            
            <div style="padding-bottom: 5px;">
              <h4 style="margin:0; color:${textoColor}; font-size: 1.1rem;">${e.nombre}${dest?.corona ? '<span class="corona">👑</span>' : ''}</h4>
              ${e.apodo ? `<small style="color:${subTextoColor};font-weight:600; display:block;">"${e.apodo}"</small>` : ''}
              <small style="color:${subTextoColor};">🎓 ${e.curso || '—'}</small>
            </div>
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

  // Traemos el muro ordenado por likes
  const { data: muro } = await db.from('cfar_muro').select('*').eq('estudiante_id', id).order('likes', { ascending: false });

  const notasHTML = lista.map(n => `<li><span>${n.materia}</span> <strong>${n.nota}</strong></li>`).join('');
  
  const muroHTML = (muro || []).map(m => `
    <li class="muro-item">
      <div>
        <strong>${m.autor_nombre}</strong>
        ${m.mensaje}
      </div>
      <button class="btn-like" onclick="darLike(${m.id}, ${e.id})">
        ❤️ <span>${m.likes || 0}</span>
      </button>
    </li>
  `).join('');

  let pfpLimpia = e.pfp_url ? e.pfp_url.split('?')[0] : null;
  let bannerLimpio = e.banner_url ? e.banner_url.split('?')[0] : null;
  const margenHeader = bannerLimpio ? 'margin-top: -30px;' : 'margin-top: 15px;';

  abrirModal(`
    ${bannerLimpio ? `<img src="${bannerLimpio}" class="banner-img">` : ''}
    ${dest ? `<div class="banner-destacado" style="margin-top:${bannerLimpio ? '-10px' : '10px'}; position:relative; z-index:3;">👑 ${dest.frase || 'Usuario destacado'}</div>` : ''}

    <div class="modal-perfil-header" style="${margenHeader}">
      ${pfpLimpia 
        ? `<img src="${pfpLimpia}" class="pfp-img grande" style="box-shadow:0 0 20px ${e.color1}; display:block !important; width:96px; height:96px; object-fit:cover;">` 
        : `<div class="avatar avatar-grande" style="background:rgba(0,0,0,0.3)">${iniciales(e.nombre)}</div>`}
      
      <div style="padding-bottom: 5px;">
        <h2 style="color: white; margin:0; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${e.nombre}${dest?.corona ? ' <span class="corona">👑</span>' : ''}</h2>
        ${e.apodo ? `<div class="apodo" style="color: rgba(255,255,255,0.9); text-shadow: 0 1px 2px rgba(0,0,0,0.5);">"${e.apodo}"</div>` : ''}
        <div class="curso" style="color: rgba(255,255,255,0.8);">🎓 ${e.curso || '—'}</div>
        
        ${e.badges && e.badges.length ? `<div style="margin-top:8px;">${e.badges.map(b => `<span class="badge" style="background:rgba(0,0,0,0.4); border-color:rgba(255,255,255,0.3); color:white;">🏅 ${b}</span>`).join('')}</div>` : ''}
      </div>
    </div>

    ${dest?.audio_url ? `
      <audio controls style="width:100%;margin:0 0 15px 0; height:35px;">
        <source src="${dest.audio_url}">
      </audio>
    ` : ''}

    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <div class="bio" style="flex:1;">${e.bio || 'Este estudiante no ha escrito su biografía.'}</div>
    </div>

    ${promedio ? `
      <h3>📊 Promedio general</h3>
      <div class="promedio-big">
        <div class="num">${promedio}</div>
        <div class="label">${lista.length} materias</div>
      </div>
    ` : ''}

    <h3>💬 Muro (Sugerencias / Mensajes)</h3>
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <input type="text" id="muro-nombre" placeholder="Tu nombre" style="width:30%;padding:8px;border-radius:6px;border:none;background:rgba(255,255,255,0.9); color: #0f172a;">
      <input type="text" id="muro-msg" placeholder="Escribe un mensaje..." style="flex:1;padding:8px;border-radius:6px;border:none;background:rgba(255,255,255,0.9); color: #0f172a;">
      <button class="btn-agregar" style="margin:0; background:rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3);" onclick="enviarMuro(${e.id})">Enviar</button>
    </div>
    <ul class="muro-lista">
      ${muroHTML ? muroHTML : '<p style="font-size:0.8rem;color:rgba(255,255,255,0.6);">Sin mensajes aún.</p>'}
    </ul>
  `, dest ? 'modal-galaxia' : '', grad);
}

// =================== LIKES ===================
async function darLike(muroId, estudianteId) {
  const { data: m } = await db.from('cfar_muro').select('likes').eq('id', muroId).single();
  if (!m) return;

  const nuevosLikes = (m.likes || 0) + 1;
  await db.from('cfar_muro').update({ likes: nuevosLikes }).eq('id', muroId);
  
  // Recargamos el perfil para ver el cambio
  verPerfilEstudiante(estudianteId);
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
          ${p.apodo ? `<small style="color:var(--primary-light);font-weight:600;">"${p.apodo}"</small>` : ''}
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
    <div class="modal-perfil-header" style="align-items: center;">
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
      <span style="display:inline-block;padding:4px 12px;background:${ev.tipo === 'Examen' ? 'rgba(220,38,38,0.2)' : 'rgba(59,130,246,0.2)'};color:${ev.tipo === 'Examen' ? '#fca5a5' : '#93c5fd'};border-radius:999px;font-size:0.75rem;font-weight:600;margin-bottom:10px; border: 1px solid ${ev.tipo === 'Examen' ? 'rgba(220,38,38,0.3)' : 'rgba(59,130,246,0.3)'};">
        ${ev.tipo}
      </span>
      <h2 style="color:white;font-size:1.35rem;font-weight:700;margin-bottom:8px;">${ev.titulo}</h2>
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
