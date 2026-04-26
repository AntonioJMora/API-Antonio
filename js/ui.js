document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const entityTypes = document.getElementById("entityTypes");
    const searchResults = document.getElementById("searchResults");
    const searchState = document.getElementById("searchState");

    const favoritesResults = document.getElementById("favoritesResults");
    const favoritesState = document.getElementById("favoritesState");
    const btnDeleteAllFavs = document.getElementById("btnDeleteAllFavs");
    const favFilterSelect = document.getElementById("favFilterSelect");
    const favSortSelect = document.getElementById("favSortSelect");

    const btnExportCsv = document.getElementById("btnExportCsv");

    let timeoutId;


    // Guarda: estos elementos solo existen en index.html
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                handleSearch(e.target.value.trim(), entityTypes.value);
            }, 150);
        });

        entityTypes.addEventListener("change", (e) => {
            handleSearch(searchInput.value.trim(), e.target.value);
        });
    }

    async function handleSearch(term, type) {
        if (!term) {
            searchResults.innerHTML = "";
            searchState.classList.add("hidden");
            return;
        }

        searchState.textContent = "Cargando resultados...";
        searchState.className = "search-state";
        searchResults.innerHTML = "";

        try {
            const data = await searchZeldaAPI(type, term);
            
            if (data.length === 0) {
                searchState.textContent = "No se encontraron resultados.";
                return;
            }

            searchState.classList.add("hidden");
            renderApiResults(data, type);
        } catch (error) {
            searchState.textContent = `Error: ${error.message}. (Ver consola)`;
            console.error(error);
            searchState.classList.remove("hidden");
            searchState.classList.add("error");
        }
    }

    function renderApiResults(items, type) {
        searchResults.innerHTML = "";
        
        items.forEach(item => {
            const card = document.createElement("article");
            card.classList.add("entity-card");
            
            const name = item.name || "Sin nombre";
            const itemType = item.searchType || type;
            
            card.innerHTML = `
                <h3 class="entity-title">
                    <a href="detalle.html?type=${itemType}&id=${item.id}" class="ui-link">${name}</a>
                </h3>
                <p>${itemType}</p>
                <button class="btn btn-fav" data-id="${item.id}" data-name="${name}" data-desc="${item.description || 'Sin descripción'}" data-type="${itemType}">
                    + Favorito
                </button>
            `;
            searchResults.appendChild(card);
        });

        const favButtons = searchResults.querySelectorAll(".btn-fav");
        favButtons.forEach(btn => {
            btn.addEventListener("click", handleAddFavoriteClick);
        });
    }


    async function handleAddFavoriteClick(e) {
        if (!isFirebaseReady()) {
            searchState.textContent = "Error: No tienes configurado Firebase. Revisa js/firebase.js";
            searchState.classList.remove("hidden");
            searchState.classList.add("error");
            return;
        }

        const btn = e.target;
        const itemData = {
            id: btn.getAttribute("data-id"),
            name: btn.getAttribute("data-name"),
            description: btn.getAttribute("data-desc"),
            type: btn.getAttribute("data-type")
        };

        try {
            btn.textContent = "Guardando...";
            btn.disabled = true;

            await addFavorite(itemData);
            
            btn.textContent = "Guardado ✓";
            btn.classList.add("active");
            
            setTimeout(() => loadFavorites(), 500);
        } catch (err) {
            btn.textContent = "Error al guardar";
            btn.disabled = false;
        }
    }

    // Lista cargada global para poder ordenar/filtrar sin repeticiones constantes
    let currentFavs = [];

    async function loadFavorites() {
        if (!isFirebaseReady()) {
            favoritesState.textContent = "Firebase no está inicializado. No se cargarán favoritos.";
            return;
        }

        if (!favoritesState || !favoritesResults) return;

        favoritesState.textContent = "Cargando favoritos desde la nube...";
        favoritesState.classList.remove("hidden");
        favoritesResults.innerHTML = "";

        try {
            currentFavs = await getFavorites();
            if (currentFavs.length === 0) {
                favoritesState.textContent = "Aún no tienes favoritos.";
                return;
            }

            favoritesState.classList.add("hidden");
            applyFiltersAndSort(); 

        } catch (error) {
            favoritesState.textContent = `Error al cargar: ${error.message}`;
            favoritesState.classList.add("error");
        }
    }

    function applyFiltersAndSort() {
        if(currentFavs.length === 0) return;

        let filtered = [...currentFavs];
        
        // Filtro por tipo
        const filterVal = favFilterSelect.value;
        if (filterVal !== "all") {
            filtered = filtered.filter(f => f.type === filterVal);
        }

        // Orden
        const sortVal = favSortSelect.value;
        filtered.sort((a, b) => {
            switch(sortVal) {
                case "name-asc": return a.name.localeCompare(b.name);
                case "name-desc": return b.name.localeCompare(a.name);
                case "date-new": return new Date(b.dateAdded) - new Date(a.dateAdded);
                case "date-old": return new Date(a.dateAdded) - new Date(b.dateAdded);
                default: return 0;
            }
        });

        renderFavorites(filtered);
    }

    function renderFavorites(items) {
        if (!favoritesResults || !favoritesState) return;

        favoritesResults.innerHTML = "";
        
        if (items.length === 0) {
            favoritesState.textContent = "No hay favoritos que coincidan con el filtro.";
            favoritesState.classList.remove("hidden");
            return;
        } else {
            favoritesState.classList.add("hidden");
        }

        items.forEach(item => {
            const card = document.createElement("article");
            card.classList.add("entity-card");
            
            // Formatear tipo sacando mayúscula para display
            const tipoText = item.type.charAt(0).toUpperCase() + item.type.slice(1);
            
            card.innerHTML = `
                <div class="entity-meta">${tipoText}</div>
                <h3 class="entity-title">${item.name}</h3>
                <p class="entity-desc">${item.description.substring(0, 100)}...</p>
                <button class="btn btn-danger" data-docid="${item.docId}">
                    Eliminar Favorito
                </button>
            `;
            favoritesResults.appendChild(card);
        });

        // Eventos a botones borrar
        const deleteButtons = favoritesResults.querySelectorAll(".btn-delete-fav");
        deleteButtons.forEach(btn => {
            btn.addEventListener("click", handleDeleteFavClick);
        });
    }

    async function handleDeleteFavClick(e) {
        const btn = e.target;
        const docId = btn.getAttribute("data-docid");
        
        try {
            btn.textContent = "Eliminando...";
            await deleteFavorite(docId);
            setTimeout(() => loadFavorites(), 500); 
        } catch (error) {
            btn.textContent = "Eliminar Favorito";
            favoritesState.textContent = "Error al borrar: " + error.message;
            favoritesState.classList.remove("hidden");
            favoritesState.classList.add("error");
        }
    }

    let confirmEmpty = false;
    if (btnDeleteAllFavs) {
        btnDeleteAllFavs.addEventListener("click", async () => {
            if (!confirmEmpty) {
                btnDeleteAllFavs.textContent = "¿Seguro? Clic para Vaciar";
                confirmEmpty = true;
                setTimeout(() => {
                    confirmEmpty = false;
                    btnDeleteAllFavs.textContent = "Vaciar Todos";
                }, 3000);
                return;
            }
            
            btnDeleteAllFavs.textContent = "Vaciando...";
            try {
                for (const fav of currentFavs) {
                    await deleteFavorite(fav.docId);
                }
                loadFavorites();
            } catch (error) {
                favoritesState.textContent = "Error vaciando: " + error.message;
                favoritesState.classList.remove("hidden");
                favoritesState.classList.add("error");
            } finally {
                confirmEmpty = false;
                btnDeleteAllFavs.textContent = "Vaciar Todos";
            }
        });
    }

    if (favFilterSelect) favFilterSelect.addEventListener("change", applyFiltersAndSort);
    if (favSortSelect) favSortSelect.addEventListener("change", applyFiltersAndSort);

    // Cargar favoritos al abrir la web (si Firebase está bien y estamos en la sección)
    if(isFirebaseReady() && favoritesState) {
        loadFavorites();
    }
});
