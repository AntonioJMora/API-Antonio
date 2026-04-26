document.addEventListener("DOMContentLoaded", async () => {
    const detailCard = document.getElementById("detailCard");
    //Datos de la url
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const id = params.get("id");

    if (!type || !id) {
        detailCard.innerHTML = "<h2>Error: Faltan parámetros en la URL (id y type).</h2>";
        return;
    }
    try {
        const response = await fetch(`https://zelda.fanapis.com/api/${type}/${id}`);
        if (!response.ok) {
            throw new Error(`Error en el servidor de Zelda: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data;

        if (!data) {
            detailCard.innerHTML = "<h2>No se encontró información de la entidad</h2>";
            return;
        }

        let html = `<h2>${data.name || "Sin nombre"}</h2>`;
        html += `<p><strong>Descripción general:</strong> ${data.description || "No hay descripción disponible."}</p>`;
        html += `<p><strong>Tipo:</strong> ${type}</p>`;



        html += `<hr class="detalle-divider">`;
        html += `<h3>Atributos extra:</h3>`;
        html += `<ul class="lista-detalles-js">`;
        for (const [key, value] of Object.entries(data)) {
            if (key !== "name" && key !== "description" && key !== "id" && typeof value !== "object") {
                html += `<li><strong>${key}:</strong> ${value}</li>`;
            }
        }
        html += `</ul>`;

        html += `<br><br><button class="btn" onclick="window.history.back()">Volver Atrás</button>`;

        detailCard.innerHTML = html;
    } catch(err) {
        detailCard.innerHTML = `<h2 class="detalle-error">Fallo de red: ${err.message}</h2>
        <p>Asegúrate de tener conexión o de que la API de Zelda esté operativa.</p>`;
    }
});