// vistas publicas

let ESTUDIANTE_LOGUEADO = null;
let DESTACADOS = [];

document.addEventListener('DOMContentLoaded', () => {
  // Revisar si el estudiante ya estaba logueado
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

function iniciales(nombre) {
  return (nombre || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

async function cargarDestacados() {
  const { data } = await db.from('cfar_destacados').select('*');
  DESTACADOS = data || [];
}

function esDestacado(nombre) {
  return DESTACADOS.find(d => d.nombre.toLowerCase() === (nombre || '').toLowerCase());
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
      <h2>Iniciar Sesión</h2>
      <p style="margin-bottom:15px;">Usa tu nombre exacto y tu clave personal.</p>
      <input type="text" id="login-nombre" placeholder="Tu nombre exacto">
      <input type="password" id="login-clave" placeholder="Tu clave personal">
      <button class="btn-agregar" style="width:100%" onclick="hacerLogin()">Entrar</button>
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
  cargarEstudiantes();
  alert('¡Bienvenido ' + data.nombre + '!');
}

function cerrarSesionEstudiante() {
  ESTUDIANTE_LOGUEADO = null;
  sessionStorage.removeItem('cfar_user');
  location.reload();
}

// =================== SUBIR FOTOS A SUPABASE STORAGE ===================
async function subirArchivo(archivo, prefijo) {
  if (!archivo) return null;
  const ext = archivo.name.split('.').pop();
  const nombre = `${prefijo}_${Date.now()}.${ext}`;
  
  const { data, error } = await db.storage.from('cfar_media').upload(nombre, archivo);
  if (error) {
    alert('Error subiendo imagen: ' + error.message);
    return null;
  }
  
  const { data: urlData } = db.storage.from('cfar_media').getPublicUrl(nombre);
  return urlData.publicUrl;
}

// =================== EDITAR PERFIL (ESTUDIANTE) ===================
async function abrirEditarPerfil() {
  if (!ESTUDIANTE_LOGUEADO) return abrirLogin();

  const e = ESTUDIANTE_LOGUEADO;

  abrirModal(`
    <div class="form-perfil">
      <h2 style="margin-bottom:15px;">Editar Mi Perfil</h2>
      
      <label>Foto de Perfil (GIF o Imagen)</label>
      <input type="file" id="edit-pfp" accept="image/*,image/gif">
      
      <label>Banner (GIF o Imagen)</label>
      <input type="file" id="edit-banner" accept="image/*,image/gif">
      
      <label>Apodo / Nickname</label>
      <input type="text" id="edit-apodo" value="${e.apodo || ''}" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);margin-bottom:10px;">
      
      <label>Bio / Sobre mí</label>
      <textarea id="edit-bio" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);min-height:80px;margin-bottom:10px;">${e.bio || ''}</textarea>
      
      <label>Color 1 (Izquierda)</label>
      <input type="color" id="edit-color1" value="${e.color1 || '#1e3a8a'}" style="width:100%;">
      
      <label>Color 2 (Derecha)</label>
      <input type="color" id="edit-color2" value="${e.color2 || '#3b82f6'}" style="width:100%;">
      
      <label>Nueva Clave (dejar vacío si no quieres cambiarla)</label>
      <input type="password" id="edit-clave" placeholder="Nueva contraseña" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);margin-bottom:15px;">

      <button class="btn-agregar" onclick="guardarPerfil()">Guardar Cambios</button>
      <button class="btn-salir" style="width:100%;margin-top:10px;background:#dc2626;" onclick="cerrarSesionEstudiante()">Cerrar Sesión</button>
    </div>
  `);
}

async function guardarPerfil() {
  const id = ESTUDIANTE_LOGUEADO.id;
  const btn = document.querySelector('.modal .btn-agregar');
  btn.textContent = 'Subiendo...'; btn.disabled = true;

  const pfpFile = document.getElementById('edit-pfp').files[0];
  const bannerFile = document.getElementById('edit-banner').files[0];
  const apodo = document.getElementById('edit-apodo').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  const color1 = document.getElementById('edit-color1').value;
  const color2 = document.getElementById('edit-color2').value;
  const nuevaClave = document.getElementById('edit-clave').value.trim();

  let pfp_url = ESTUDIANTE_LOGUEADO.pfp_url;
  let banner_url = ESTUDIANTE_LOGUEADO.banner_url;

  if (pfpFile) pfp_url = await subirArchivo(pfpFile, 'pfp');
  if (bannerFile) banner_url = await subirArchivo(bannerFile, 'banner');

  const updates = { apodo, bio, color1, color2, pfp_url, banner_url };
  if (nuevaClave) updates.clave = nuevaClave;

  const { error } = await db.from('cfar_estudiantes').update(updates).eq('id', id);

  if (error) { alert('Error: ' + error.message); btn.disabled = false; return; }

  // actualizar sesion local
  const { data } = await db.from('cfar_estudiantes').select('*').eq('id', id).single();
  ESTUDIANTE_LOGUEADO = data;
  sessionStorage.setItem('cfar_user', JSON.stringify(data));
  
  cerrarModal();
  actualizarUIUsuario();
  cargarEstudiantes(); // recargar el index
  alert('¡Perfil actualizado!');
}

// =================== RENDER ESTUDIANTES ===================
async function cargarEstudiantes() {
  const cont = document.getElementById('lista-estudiantes');
  await cargarDestacados();

  const { data, error } = await db.from('cfar_estudiantes').select('*').order('nombre');
  if (error) { cont.innerHTML = vacio('Error al cargar.'); return; }

  cont.innerHTML = data.length ? data.map(e => {
    const dest = esDestacado(e.nombre);
    const isOwner = ESTUDIANTE_LOGUEADO && ESTUDIANTE_LOGUEADO.id === e.id;
    
    // Usar color del perfil si tiene, sino el default
    const grad = `linear-gradient(135deg, ${e.color1 || '#1e3a8a'}, ${e.color2 || '#3b82f6'})`;
    
    return `
      <div class="card card-click ${dest ? 'destacado' : ''}" style="border-top: 4px solid transparent; background-clip: padding-box; border-image: ${grad} 1;" onclick="verPerfilEstudiante(${e.id})">
        <div style="display:flex;gap:14px;align-items:center;">
          ${e.pfp_url 
            ? `<img src="${e.pfp_url}" class="pfp-img" style="border-color:${e.color1};">` 
            : `<div class="avatar" style="background:${grad}">${iniciales(e.nombre)}</div>`}
          
          <div>
            <h4 style="margin:0;">${e.nombre}${dest?.corona ? '<span class="corona">👑</span>' : ''}</h4>
            ${e.apodo ? `<small style="color:${e.color2};font-weight:600;">"${e.apodo}"</small>` : ''}
            <small>🎓 ${e.curso || '—'}</small>
          </div>
        </div>
      </div>`;
  }).join('') : vacio('Sin estudiantes registrados aún.');
}

// =================== VER PERFIL ===================
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

  abrirModal(`
    ${e.banner_url ? `<img src="${e.banner_url}" class="banner-img">` : ''}
    ${dest ? `<div class="banner-destacado" style="margin-top:10px;">👑 ${dest.frase || 'Usuario destacado'}</div>` : ''}

    <div class="modal-perfil-header" style="margin-top:${e.banner_url ? '15px' : '0'};">
      ${e.pfp_url 
        ? `<img src="${e.pfp_url}" class="pfp-img grande" style="box-shadow:0 0 20px ${e.color1};">` 
        : `<div class="avatar avatar-grande" style="background:${grad}">${iniciales(e.nombre)}</div>`}
      
      <div>
        <h2 style="color:${e.color2}">${e.nombre}${dest?.corona ? ' <span class="corona">👑</span>' : ''}</h2>
        ${e.apodo ? `<div class="apodo" style="color:${e.color2}">"${e.apodo}"</div>` : ''}
        <div class="curso">🎓 ${e.curso || '—'}</div>
        
        ${e.badges?.length ? `<div style="margin-top:8px;">${e.badges.map(b => `<span class="badge">🏅 ${b}</span>`).join('')}</div>` : ''}
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
      <input type="text" id="muro-nombre" placeholder="Tu nombre" style="width:30%;padding:8px;border-radius:6px;border:1px solid #ccc;">
      <input type="text" id="muro-msg" placeholder="Escribe un mensaje..." style="flex:1;padding:8px;border-radius:6px;border:1px solid #ccc;">
      <button class="btn-agregar" style="margin:0;" onclick="enviarMuro(${e.id})">Enviar</button>
    </div>
    <ul class="muro-lista">${muroHTML || '<p style="font-size:0.8rem;color:#888;">Sin mensajes aún.</p>'}</ul>
  `);
}

async function enviarMuro(estudianteId) {
  const autor = document.getElementById('muro-nombre').value.trim();
  const msg = document.getElementById('muro-msg').value.trim();
  if (!autor || !msg) return alert('Escribe tu nombre y el mensaje');

  const { error } = await db.from('cfar_muro').insert({ estudiante_id: estudianteId, autor_nombre: autor, mensaje: msg });
  if (error) return alert('Error: ' + error.message);
  
  verPerfilEstudiante(estudianteId); // recargar modal
}
