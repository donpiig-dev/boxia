// --- REGISTRO DEL SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("Service Worker del Cliente listo."))
    .catch(err => console.error("Error al registrar SW:", err));
}

// --- SELECTORES DEL DOM ---
const loginSection = document.getElementById('login-section');
const playerSection = document.getElementById('player-section');
const loginForm = document.getElementById('login-form');
const downloadList = document.getElementById('download-list');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');
const progressFill = document.getElementById('progress-fill');
const logoutBtn = document.getElementById('logout-btn');

// Enrutamiento confirmado para tu versión de Cobalt (V7/V8)
const COBALT_API_URL = "https://cobalt-api-production-2724.up.railway.app/";

// --- SISTEMA DE LOGIN ---
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (user === "admin" && pass === "1234") {
    localStorage.setItem('isUserLoggedIn', 'true');
    checkUserAuth();
  } else {
    document.getElementById('login-error').innerText = "Acceso denegado / Credenciales incorrectas";
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('isUserLoggedIn');
  checkUserAuth();
});

function checkUserAuth() {
  if (localStorage.getItem('isUserLoggedIn') === 'true') {
    loginSection.classList.add('hidden');
    playerSection.classList.remove('hidden');
    renderDownloadList();
  } else {
    loginSection.classList.remove('hidden');
    playerSection.classList.add('hidden');
  }
}

// --- RENDERIZAR TABLA DE DESCARGAS ---
function renderDownloadList() {
  downloadList.innerHTML = '';
  const videos = JSON.parse(localStorage.getItem('pending_videos')) || [];

  if (videos.length === 0) {
    downloadList.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay enlaces pendientes.</td></tr>`;
    return;
  }

  videos.forEach(video => {
    const thumbUrl = video.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <img src="${thumbUrl}" alt="Miniatura" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px;">
      </td>
      <td title="${video.url}">${video.url}</td>
      <td>
        <button class="btn-download" onclick="downloadVideo(${video.id})">⬇️ Descargar</button>
      </td>
    `;
    downloadList.appendChild(tr);
  }); 
}

// --- PROCESAR ENLACE Y DESCARGA BINARIA ---
window.downloadVideo = async function(videoId) {
  const videos = JSON.parse(localStorage.getItem('pending_videos')) || [];
  const targetVideo = videos.find(v => String(v.id) === String(videoId));

  if (!targetVideo || !targetVideo.url) {
    alert("Error: No se encontró la URL de este video en el almacenamiento local.");
    return;
  }

  const realVideoUrl = targetVideo.url.trim();
  updateStatusContainer("Conectando con el servidor Cobalt...", "20%");

  try {
    // 1. Petición POST a la API de Cobalt
    // 1. Petición POST a la API de Cobalt
    const response = await fetch(COBALT_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({
    url: realVideoUrl,
    videoQuality: "720",
    youtubeVideoCodec: "h264"
  })
});

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Error sin respuesta de texto");
      throw new Error(`Servidor respondió con código ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Obtener la URL de flujo generada por Cobalt (acepta tanto data.url como data.text si redirige)
    const streamUrl = data.url || data.text;
    if (!streamUrl) {
      throw new Error(data.text || "Cobalt no devolvió un flujo de descarga válido.");
    }

    // 2. Secuestrar los bytes del video en segundo plano (Blob)
    updateStatusContainer("Descargando flujo binario del video...", "50%");
    const videoRes = await fetch(streamUrl);
    if (!videoRes.ok) throw new Error("No se pudo obtener el archivo binario desde el servidor de flujo.");
    const videoBlob = await videoRes.blob();

    // 3. Forzar guardado nativo mediante File System Access API o Descarga Directa
    updateStatusContainer("Guardando archivo en el dispositivo...", "85%");
    
    if ('showSaveFilePicker' in window) {
      // Entornos modernos / Escritorio: El usuario elige la carpeta (Ideal para tarjetas SD)
      const handle = await window.showSaveFilePicker({
        suggestedName: `video_${videoId}.mp4`,
        types: [{
          description: 'Video MP4',
          accept: {'video/mp4': ['.mp4']}
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(videoBlob);
      await writable.close();
    } else {
      // Mobile / Fallback: Inyección Blob tradicional si showSaveFilePicker no está disponible
      const blobUrl = URL.createObjectURL(videoBlob);
      triggerNativeDownload(blobUrl, `video_${videoId}.mp4`);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }

    updateStatusContainer("¡Video guardado con éxito!", "100%");
    setTimeout(hideStatusContainer, 3000);

  } catch (error) {
    console.error("Error en el proceso de descarga:", error);
    alert(`No se pudo procesar la descarga: ${error.message}`);
    hideStatusContainer();
  }
};

// --- INYECTOR DE DESCARGA DIRECTA (FALLBACK) ---
function triggerNativeDownload(streamUrl, filename) {
  const anchor = document.createElement('a');
  anchor.href = streamUrl;
  anchor.setAttribute('download', filename);
  anchor.target = "_blank"; 
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

// --- COMPONENTES VISUALES DE ESTADO ---
function updateStatusContainer(text, percentage) {
  if (statusContainer && statusText && progressFill) {
    statusContainer.classList.remove('hidden');
    statusText.innerText = text;
    progressFill.style.width = percentage;
  }
}

function hideStatusContainer() {
  if (statusContainer && progressFill) {
    statusContainer.classList.add('hidden');
    progressFill.style.width = "0%";
  }
}

// Sincronización en tiempo real entre pestañas (Admin -> Cliente)
window.addEventListener('storage', (event) => {
  if (event.key === 'pending_videos') {
    renderDownloadList();
  }
});

// Inicialización de la aplicación
checkUserAuth();