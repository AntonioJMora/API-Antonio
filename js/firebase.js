const firebaseConfig = {
    apiKey: "AIzaSyC86gz49HIW65kSsPKktJ31srWCffXRh0I",
    authDomain: "api-antonio-590dd.firebaseapp.com",
    projectId: "api-antonio-590dd",
    storageBucket: "api-antonio-590dd.firebasestorage.app",
    messagingSenderId: "1046507243135",
    appId: "1:1046507243135:web:9d2797c0d806ed9b76a14a"
};

let db = null;

function getAnonymousUserId() {
    let userId = localStorage.getItem("hyrule_user_id");
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("hyrule_user_id", userId);
        console.log("[Hyrule] Nuevo ID de usuario anónimo creado:", userId);
    }
    return userId;
}

try {
    if (firebaseConfig.apiKey !== "") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("Firebase inicializado correctamente.");
    } else {
        console.warn("Firebase no configurado.");
    }
} catch (error) {
    console.error("Error al arrancar Firebase:", error);
}


async function addFavorite(item) {
    if (!db) throw new Error("Firebase no está configurado.");
    const userId = getAnonymousUserId();
    try {
        const docRef = await db
            .collection("usuarios")
            .doc(userId)
            .collection("favoritos")
            .add({
                apiId: item.id,
                name: item.name || "Desconocido",
                description: item.description || "Sin descripción",
                type: item.type,
                dateAdded: new Date().toISOString()
        });
        console.log("Añadido a favoritos con ID:", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error al añadir favorito:", e);
        throw e;
    }
}


async function getFavorites() {
    if (!db) throw new Error("Firebase no está configurado.");
    const userId = getAnonymousUserId();    
    try {
        const querySnapshot = await db
            .collection("usuarios")
            .doc(userId)
            .collection("favoritos")
            .get();
        const favs = [];
        querySnapshot.forEach((docSnap) => {
            favs.push({ docId: docSnap.id, ...docSnap.data() });
        });
        return favs;
    } catch (e) {
        console.error("Error al obtener favoritos:", e);
        throw e;
    }
}

async function deleteFavorite(docId) {
    if (!db) throw new Error("Firebase no está configurado.");
    const userId = getAnonymousUserId();
    try {
        await db
            .collection("usuarios")
            .doc(userId)
            .collection("favoritos")
            .doc(docId)
            .delete();
        console.log("Favorito eliminado:", docId);
    } catch (e) {
        console.error("Error al eliminar favorito:", e);
        throw e;
    }
}

function isFirebaseReady() {
    return db !== null;
}
