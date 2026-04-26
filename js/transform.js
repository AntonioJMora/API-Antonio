document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("gamesTableBody");
    const btnExportCsv = document.getElementById("btnExportCsv");

    let gamesJson = [];

    async function loadXML() {
        try {
            const response = await fetch("data/juegos.xml");
            if (!response.ok) throw new Error("Error cargando XML");
            const xmlText = await response.text();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            const juegosNodos = xmlDoc.getElementsByTagName("juego");

            for (let i = 0; i < juegosNodos.length; i++) {
                const node = juegosNodos[i];
                gamesJson.push({
                    id: node.getAttribute("id"),
                    titulo: node.getElementsByTagName("titulo")[0].textContent,
                    desarrolladora: node.getElementsByTagName("desarrolladora")[0].textContent,
                    publicadora: node.getElementsByTagName("publicadora")[0].textContent,
                    plataforma: node.getElementsByTagName("plataforma")[0].textContent,
                    // Convertir a Numbers (exigido en rúbrica)
                    anio: Number(node.getElementsByTagName("anio")[0].textContent),
                    puntuacion: Number(node.getElementsByTagName("puntuacion")[0].textContent)
                });
            }

            renderTable(gamesJson);

        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="7" class="transform-error">Error al cargar el catálogo XML: ${err.message}</td></tr>`;
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = "";
        data.forEach(game => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${game.id}</td>
                <td>${game.titulo}</td>
                <td>${game.desarrolladora}</td>
                <td>${game.publicadora}</td>
                <td>${game.plataforma}</td>
                <td>${game.anio}</td>
                <td>${game.puntuacion}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    btnExportCsv.addEventListener("click", () => {
        if (gamesJson.length === 0) {
            const prev = btnExportCsv.textContent;
            btnExportCsv.textContent = "Sin datos";
            btnExportCsv.classList.add("btn-danger");
            setTimeout(()=> {
                btnExportCsv.textContent = prev;
                btnExportCsv.classList.remove("btn-danger");
            }, 2000);
            return;
        }

        const csvRows = [];
        const headers = ["ID", "Título", "Desarrolladora", "Publicadora", "Plataforma", "Año", "Puntuación"];
        csvRows.push(headers.join(","));

        gamesJson.forEach(game => {
            const values = [
                game.id,
                `"${game.titulo}"`,
                `"${game.desarrolladora}"`,
                `"${game.publicadora}"`,
                `"${game.plataforma}"`,
                game.anio,
                game.puntuacion
            ];
            csvRows.push(values.join(","));
        });

        //Para descargar el csv
        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "catalogo_zelda.csv";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    loadXML();
});
