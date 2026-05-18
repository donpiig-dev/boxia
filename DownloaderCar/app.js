// Registro del Service Worker para soporte PWA Offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("Service Worker registrado con éxito."))
    .catch(err => console.log("Error al registrar SW:", err));
}

// Selectores del DOM
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

// Estado de la aplicación en LocalStorage
let videos = JSON.parse(localStorage.getItem('pending_videos')) || [];

// --- SISTEMA DE LOGIN DE PRUEBA ---
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  // Credenciales quemadas para demo (Cambiar por fetch a API en producción)
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

function checkAuth() {
  if (localStorage.getItem('isLoggedIn') === 'true') {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    renderVideos();
  } else {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
  }
}

// --- LOGICA CRUD DE VIDEOS ---

// Crear o Editar Enlace
videoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = videoUrlInput.value;
  const id = videoIdInput.value;

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
  videoUrlInput.value = '';
});

// Renderizar la lista en la tabla
function renderVideos() {
  videoList.innerHTML = '';
  videos.forEach(video => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td title="${video.url}">${video.url}</td>
      <td>${video.date}</td>
      <td>
        <button class="btn-edit" onclick="editVideo(${video.id})">Editar</button>
        <button class="btn-delete" onclick="deleteVideo(${video.id})">Eliminar</button>
      </td>
    `;
    videoList.appendChild(tr);
  });
}

// Preparar formulario para editar
window.editVideo = function(id) {
  const video = videos.find(v => v.id === id);
  if (video) {
    videoUrlInput.value = video.url;
    videoIdInput.value = video.id;
    submitBtn.innerText = "Actualizar Enlace";
    cancelBtn.classList.remove('hidden');
  }
}

// Eliminar Enlace
window.deleteVideo = function(id) {
  if (confirm("¿Seguro que deseas eliminar este enlace?")) {
    videos = videos.filter(v => v.id !== id);
    saveAndRender();
  }
}

// Cancelar Edición
cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  videoUrlInput.value = '';
  videoIdInput.value = '';
  submitBtn.innerText = "Guardar Enlace";
  cancelBtn.classList.add('hidden');
}

function saveAndRender() {
  localStorage.setItem('pending_videos', JSON.stringify(videos));
  renderVideos();
}

// Inicializar la app al cargar
checkAuth();