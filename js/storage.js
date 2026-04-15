const STORAGE_KEY = "torneo-futbol-simple";

// Solicita al navegador que no borre automáticamente los datos
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist();
}

function saveState() {
  const data = JSON.stringify(window.appState);
  localStorage.setItem(STORAGE_KEY, data);
  // Copia de seguridad en sessionStorage por si acaso
  try { sessionStorage.setItem(STORAGE_KEY, data); } catch(e) {}
}

function loadState() {
  // Intenta primero localStorage, luego sessionStorage como respaldo
  let saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    try { saved = sessionStorage.getItem(STORAGE_KEY); } catch(e) {}
  }
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    window.appState = {
      ...window.appState,
      ...parsed
    };
    // Si se recuperó de sessionStorage, restaurar en localStorage
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, saved);
    }
  } catch (error) {
    console.error("Error al cargar datos", error);
  }
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
  try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}
}