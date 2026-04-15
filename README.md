# Liga de Fútbol Escolar — CEIP El Vetón

Aplicación web progresiva (PWA) para gestionar la liga de fútbol escolar del CEIP El Vetón de Majadas. Permite crear equipos, generar el calendario de jornadas por sistema round-robin, registrar resultados y consultar la clasificación en tiempo real.

---

## Características

- **Sin instalación** — funciona directamente desde el navegador
- **Modo offline** — Service Worker con caché de todos los recursos
- **Datos persistentes** — almacenamiento en `localStorage` con protección de borrado automático
- **Número de equipos flexible** — de 4 a 12 equipos (número impar admitido con jornada de descanso)
- **Calendario round-robin** — generación automática de enfrentamientos
- **Fecha y hora por partido** — cada partido tiene su propio horario
- **Clasificación en tiempo real** — se actualiza al instante al introducir resultados
- **Impresión del calendario** — con logo, fecha/hora y equipos listos para imprimir
- **Impresión de clasificación** — tabla completa con cabecera oficial

---

## Estructura del proyecto

```
├── index.html              # Shell principal de la app
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker (caché offline)
├── assets/
│   └── logo.png            # Logo oficial de la liga
├── css/
│   ├── styles.css          # Estilos principales
│   └── print.css           # Estilos de impresión
└── js/
    ├── state.js            # Estado inicial de la app
    ├── storage.js          # Guardar/cargar/limpiar datos (localStorage)
    ├── scheduler.js        # Algoritmo round-robin de jornadas
    ├── standings.js        # Cálculo de clasificación
    ├── ui.js               # Renderizado de vistas
    └── app.js              # Lógica de eventos y acciones
```

---

## Uso

### 1. Abrir la app
Abre `index.html` en el navegador, o despliega los archivos en un servidor web (recomendado para activar el Service Worker y la instalación como PWA).

### 2. Configurar equipos
1. Pulsa el icono ⚙ (ajustes)
2. Elige el número de equipos participantes
3. Añade el nombre de cada equipo
4. Puedes renombrar equipos en cualquier momento

### 3. Generar el calendario
Una vez añadidos todos los equipos, pulsa **Generar calendario**. Se crearán automáticamente todas las jornadas con los enfrentamientos.

### 4. Asignar fecha y hora a los partidos
En la pantalla **Calendario**, cada partido tiene un selector de fecha y hora. Los valores se guardan automáticamente.

### 5. Registrar resultados
En la pantalla de **Inicio**, selecciona la jornada y escribe los goles de cada partido. La clasificación se actualiza al instante.

### 6. Imprimir
- **Calendario**: desde la vista Calendario, pulsa el botón Imprimir
- **Clasificación**: desde la vista Clasificación, pulsa el botón Imprimir

---

## Datos y almacenamiento

Los datos se guardan automáticamente en el navegador con `localStorage`. No se pierden al cerrar la página ni el navegador. La app solicita al navegador protección de almacenamiento persistente para evitar borrados automáticos.

Los datos **solo se pueden eliminar** desde dentro de la app:
- **Eliminar equipo** — borra ese equipo y el calendario
- **Borrar jornadas** — elimina el calendario generado
- **Borrar todos los datos** — restablece la app al estado inicial

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 / CSS3 | Estructura y estilos |
| JavaScript (Vanilla) | Lógica, sin frameworks |
| Service Worker | Caché offline |
| localStorage | Persistencia de datos |
| Google Fonts | Tipografía (Barlow) |
| CSS Print | Impresión de calendario y clasificación |

---

## Paleta de colores

| Variable | Color | Uso |
|---|---|---|
| `--primary` | `#0d4a1a` | Verde oscuro Extremadura |
| `--accent2` | `#7ab648` | Verde claro |
| `--gold` | `#f0b429` | Dorado / destacados |

---

## Créditos

Desarrollado para el **CEIP El Vetón de Majadas** — Liga Fútbol Escolar.
