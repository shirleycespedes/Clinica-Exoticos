import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { app } from "./firebaseConfig";

const VAPID_KEY =
    "BFb5TxV6f9MXHQtU6r--DCwMVR_L06MxsLszxsWyN48P-CslAeRYno3NhFcUf2AK9A-H8n-kiVaj3iMGeHJHMaA";

let unsubscribeMessages = null;

export async function registerWebPush(onNotification) {
    if (!(await isSupported())) {
        throw new Error("Este navegador no admite Firebase Push.");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        console.warn("[Firebase Web] Permiso de notificaciones no concedido.");
        return null;
    }

    const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/firebase-cloud-messaging-push-scope/" }
    );

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
    });

    if (!token) {
        throw new Error("Firebase no devolvió un token para este navegador.");
    }

    // Evita duplicar los avisos si se registra más de una vez.
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }

    // Mensajes recibidos mientras estás usando la página.
    unsubscribeMessages = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {};

        onNotification(
            title || "VetExóticos",
            body || "",
            payload.data || {}
        );
    });

    return token;
}