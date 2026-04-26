const BASE_URL = "https://zelda.fanapis.com/api";

/**
 * Busca en la API de Zelda integrando una caché con localStorage.
 * @param {string} type El endpoint específico (games, characters, monsters, etc.)
 * @param {string} term El término a buscar
 * @returns {Promise<Array>} Un array con los resultados
 */

async function searchZeldaAPI(type, term) {
    const query = term.trim() !== "" ? `?name=${encodeURIComponent(term)}` : "";
    const url = `${BASE_URL}/${type}${query}`;
    
    const cacheKey = `zelda_cache_${type}_${term.toLowerCase()}`;
    
    // 1. Revisar si lo tenemos en localStorage (Caché) con bloque try/catch
    let cachedData;
    try {
        cachedData = localStorage.getItem(cacheKey);
    } catch (e) {}

    if (cachedData) {
        console.log(`[Caché Local] Mostrando resultados para: ${type} - ${term}`);
        return JSON.parse(cachedData);
    }
    
    // 2. Si no está en caché, buscar en la Zelda API
    try {
        let results = [];
        if (type === "all") {
            const types = ["games", "staff", "characters", "monsters", "bosses", "dungeons", "places", "items"];
            // Usamos Promise.allSettled por si algún endpoint de la API falla, para que no colapse "Todo"
            const promises = types.map(t => fetch(`${BASE_URL}/${t}${query}`)
                .then(r => r.ok ? r.json() : { data: [] })
                .then(j => (j.data || []).map(item => { item.searchType = t; return item; }))
                .catch(() => [])
            );
            const allResults = await Promise.all(promises);
            results = allResults.flat();
        } else {
            console.log(`[Fetch API] Buscando en servidor: ${type} - ${term}`);
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const json = await response.json();
                    results = (json.data || []).map(item => { item.searchType = type; return item; });
                }
            } catch(e) {
                console.error("Fetch falló para " + type);
            }
        }
        
        // 3. Guardar en localStorage para futuras búsquedas (con try por si quota)
        try {
            localStorage.setItem(cacheKey, JSON.stringify(results));
        } catch(e) {}
        
        return results;
        
    } catch (error) {
        throw error;
    }
}
