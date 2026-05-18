// --- REGISTRO DEL SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("Service Worker registrado con éxito."))
    .catch(err => console.log("Error al registrar SW:", err));
}

// --- SELECTORES DEL DOM ---
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const videoForm = document.getElementById('video-form');
const videoUrlInput = document.getElementById('video-url');
const videoIdInput = document.getElementById('video-id');
const videoList = document.getElementById('video-list');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const logoutBtn = document.getElementById('logout-btn');

// --- ESTADO DE LA APLICACIÓN ---
let videos = JSON.parse(localStorage.getItem('pending_videos')) || [];

// --- LOGICA CRUD DE VIDEOS (Declarada antes de usarse) ---

// 1. Renderizar la lista en la tabla con soporte responsivo y límite de 25 caracteres
function renderVideos() {
  if (!videoList) return;
  videoList.innerHTML = '';
  
  videos.forEach(video => {
    const tr = document.createElement('tr');
    
    // Limitador estricto a 25 caracteres para el tooltip flotante (title)
    const shortTitle = video.url.length > 25 
      ? video.url.slice(0, 25) + '...' 
      : video.url;

    tr.innerHTML = `
      <td class="col-url">
        <span class="video-url-text" title="${shortTitle}">${video.url}</span>
      </td>
      <td class="col-date">${video.date}</td>
      <td class="col-actions">
        <button class="btn-edit" onclick="editVideo(${video.id})">✏️ Editar</button>
        <button class="btn-delete" onclick="deleteVideo(${video.id})">❌ Eliminar</button>
      </td>
    `;
    videoList.appendChild(tr);
  });
}

function saveAndRender() {
  localStorage.setItem('pending_videos', JSON.stringify(videos));
  renderVideos();
}

function resetForm() {
  videoUrlInput.value = '';
  videoIdInput.value = '';
  submitBtn.innerText = "Guardar Enlace";
  cancelBtn.classList.add('hidden');
}

// Crear o Editar Enlace
videoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = videoUrlInput.value.trim();
  const id = videoIdInput.value;

  if (!url) return;

  if (id) {
    // Modo Edición
    videos = videos.map(video => video.id === parseInt(id) ? { ...video, url } : video);
    resetForm();
  } else {
    // Modo Creación
    const newVideo = {
      id: Date.now(),
      url: url,
      date: new Date().toLocaleDateString()
    };
    videos.push(newVideo);
  }

  saveAndRender();
});

// Registrar funciones globales en window para asegurar compatibilidad con onclick
window.editVideo = function(id) {
  const video = videos.find(v => v.id === id);
  if (video) {
    videoUrlInput.value = video.url;
    videoIdInput.value = video.id;
    submitBtn.innerText = "Actualizar Enlace";
    cancelBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Comodidad en móvil
  }
};

window.deleteVideo = function(id) {
  if (confirm("¿Seguro que deseas eliminar este enlace?")) {
    videos = videos.filter(v => v.id !== id);
    saveAndRender();
  }
};

cancelBtn.addEventListener('click', resetForm);

// --- SISTEMA DE AUTENTICACIÓN ---
function checkAuth() {
  if (localStorage.getItem('isLoggedIn') === 'true') {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    renderVideos(); // 🟢 Ahora sí existe y está declarada arriba
  } else {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (user === "admin" && pass === "1234") {
    localStorage.setItem('isLoggedIn', 'true');
    checkAuth();
  } else {
    document.getElementById('login-error').innerText = "Credenciales incorrectas";
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('isLoggedIn');
  checkAuth();
});

// --- INICIALIZACIÓN ---
// Ejecutamos la verificación al final, asegurando que todo el script fue leído
checkAuth();
