let peliculas = [];

const contenedor = document.getElementById("peliculas");
const contador = document.getElementById("contador-resultados");
const buscador = document.getElementById("buscador");

const filtroUniverso = document.getElementById("universo");
const filtroTipo = document.getElementById("tipo");
const filtroSaga = document.getElementById("saga");
const filtroOrden = document.getElementById("orden");

// Cargar datos del JSON
fetch("datos/marvel.json")
    .then(response => {
        if (!response.ok) throw new Error("No se pudo cargar marvel.json");
        return response.json();
    })
    .then(datos => {
        peliculas = datos;
        crearFiltros();
        mostrarPeliculas();
    })
    .catch(error => {
        console.error("Error cargando los datos:", error);
        contenedor.innerHTML = `<p class="mensaje-error">⚠️ Error al cargar las películas. Asegúrate de haber ejecutado excel_to_json.py y abrirlo con un servidor local.</p>`;
    });

// Crear opciones desplegables dinámicamente
function crearFiltros() {
    const universosSet = new Set();
    peliculas.forEach(p => {
        if (p.universo) {
            p.universo.split('/').forEach(u => universosSet.add(u.trim()));
        }
    });
    const universos = [...universosSet].sort();
    const tipos = [...new Set(peliculas.map(p => p.tipo).filter(Boolean))].sort();
    const sagas = [...new Set(peliculas.map(p => p.saga).filter(Boolean))].sort();

    universos.forEach(universo => {
        const opcion = document.createElement("option");
        opcion.value = universo;
        opcion.textContent = universo;
        // Seleccionar MCU por defecto
        if (universo === "MCU") opcion.selected = true;
        filtroUniverso.appendChild(opcion);
    });

    tipos.forEach(tipo => {
        const opcion = document.createElement("option");
        opcion.value = tipo;
        opcion.textContent = tipo;
        // Seleccionar Película por defecto
        if (tipo === "Película") opcion.selected = true;
        filtroTipo.appendChild(opcion);
    });

    sagas.forEach(saga => {
        const opcion = document.createElement("option");
        opcion.value = saga;
        opcion.textContent = saga;
        filtroSaga.appendChild(opcion);
    });
}

// Renderizar tarjetas
function mostrarPeliculas() {
    let resultado = [...peliculas];
    const textoBusqueda = buscador.value.trim().toLowerCase();

    // Filtro por texto
    if (textoBusqueda !== "") {
        resultado = resultado.filter(p =>
            (p.titulo && p.titulo.toLowerCase().includes(textoBusqueda)) ||
            (p.saga && p.saga.toLowerCase().includes(textoBusqueda))
        );
    }

    // Filtro universo (soporta valores múltiples como "MCU / X-Men")
    if (filtroUniverso.value !== "todos") {
        resultado = resultado.filter(p => {
            if (!p.universo) return false;
            const universosPeli = p.universo.split('/').map(u => u.trim());
            return universosPeli.includes(filtroUniverso.value);
        });
    }

    // Filtro tipo
    if (filtroTipo.value !== "todos") {
        resultado = resultado.filter(p => p.tipo === filtroTipo.value);
    }

    // Filtro saga
    if (filtroSaga.value !== "todos") {
        resultado = resultado.filter(p => p.saga === filtroSaga.value);
    }

    // Ordenar
    if (filtroOrden.value === "cronologico") {
        resultado.sort((a, b) => (a.orden_cronologico ?? 9999) - (b.orden_cronologico ?? 9999));
    } else if (filtroOrden.value === "estreno") {
        resultado.sort((a, b) => {
            const fechaA = a.fecha_estreno || a.estreno || "9999-12-31";
            const fechaB = b.fecha_estreno || b.estreno || "9999-12-31";
            return fechaA.localeCompare(fechaB);
        });
    }

    // Mostrar contador
    contador.textContent = `Mostrando ${resultado.length} de ${peliculas.length} títulos`;
    contenedor.innerHTML = "";

    if (resultado.length === 0) {
        contenedor.innerHTML = `<p class="mensaje-vacio">No se encontraron películas o series con esos filtros.</p>`;
        return;
    }

    resultado.forEach((pelicula, indice) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";

        // URL del póster
        const posterBaseUrl = "https://image.tmdb.org/t/p/w500";
        const posterUrl = pelicula.poster && pelicula.poster.startsWith('/')
            ? `${posterBaseUrl}${pelicula.poster}`
            : (pelicula.poster || 'https://via.placeholder.com/500x750/1a1a1a/e62429?text=Sin+Poster');

        // Extraer año de estreno
        const fechaRaw = pelicula.fecha_estreno || pelicula.estreno || "";
        const anio = fechaRaw ? fechaRaw.substring(0, 4) : "—";
        const puntuacion = pelicula.puntuacion || pelicula.vote_average ? Number(pelicula.puntuacion || pelicula.vote_average).toFixed(1) : null;
        const duracion = pelicula.duracion ? `${pelicula.duracion} min` : null;

        // Renderizar pastillas de universo independientes
        const tagsUniverso = (pelicula.universo || 'Marvel')
            .split('/')
            .map(u => `<span class="tag tag-universo">${u.trim()}</span>`)
            .join('');

        tarjeta.innerHTML = `
            <div class="poster-box">
                <img src="${posterUrl}" alt="${pelicula.titulo}" loading="lazy">
                <span class="badge-numero">#${indice + 1}</span>
                ${puntuacion ? `<span class="badge-rating">★ ${puntuacion}</span>` : ''}
            </div>
            <div class="contenido-tarjeta">
                <h2 title="${pelicula.titulo}">${pelicula.titulo}</h2>
                
                <div class="etiquetas">
                    <span class="tag tag-tipo">${pelicula.tipo || 'Película'}</span>
                    ${tagsUniverso}
                    ${pelicula.fase && !isNaN(pelicula.fase) ? `<span class="tag tag-fase">Fase ${pelicula.fase}</span>` : ''}
                </div>

                <div class="detalles">
                    <span>📅 ${anio}</span>
                    ${duracion ? `<span>⏱️ ${duracion}</span>` : ''}
                </div>

                ${pelicula.saga ? `<div class="saga-texto">🎯 ${pelicula.saga}</div>` : ''}
                
                ${pelicula.sinopsis || pelicula.overview ? `
                    <p class="sinopsis">${pelicula.sinopsis || pelicula.overview}</p>
                ` : ''}
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });
}

// Event Listeners
buscador.addEventListener("input", mostrarPeliculas);
filtroUniverso.addEventListener("change", mostrarPeliculas);
filtroTipo.addEventListener("change", mostrarPeliculas);
filtroSaga.addEventListener("change", mostrarPeliculas);
filtroOrden.addEventListener("change", mostrarPeliculas);