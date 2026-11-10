const nodemailer = require('nodemailer');

class EmailService {
    /**
     * Envía un correo con código de verificación (para login o recuperación de contraseña)
     * Soporta:
     * 1. Resend API (HTTPS en puerto 443 - Recomendado para Railway y Nube)
     * 2. Brevo API (HTTPS en puerto 443)
     * 3. SMTP con Nodemailer (con timeout estricto de 5s para evitar bloqueos)
     * 4. Consola (solo en entorno de desarrollo local)
     *
     * @param {Object} options
     * @param {string} options.to - Correo del destinatario
     * @param {string} options.nombre - Nombre del usuario
     * @param {string} options.code - Código de 6 dígitos
     * @param {string} [options.type='login'] - 'login' o 'reset_password'
     */
    static async sendVerificationEmail({ to, nombre, code, type = 'login' }) {
        const isLogin = type === 'login';
        const subject = isLogin
            ? 'Código de verificación de identidad - VetExóticos'
            : 'Código de recuperación de contraseña - VetExóticos';

        const actionText = isLogin
            ? 'Recibimos un intento de inicio de sesión en tu cuenta. Utiliza el siguiente código para confirmar tu identidad e ingresar a la aplicación:'
            : 'Recibimos una solicitud para restablecer tu contraseña. Utiliza el siguiente código para proceder con el restablecimiento de tu contraseña en la aplicación móvil:';

        const footerNote = isLogin
            ? 'Si no intentaste iniciar sesión, te recomendamos cambiar tu contraseña de inmediato.'
            : 'Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no se modificará.';

        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #059669; margin: 0; font-size: 26px;">🦎 VetExóticos</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Clínica Veterinaria Especializada</p>
                </div>
                <div style="padding: 20px 0; border-top: 1px solid #f1f5f9;">
                    <p style="color: #1e293b; font-size: 16px; margin: 0 0 12px 0;">Hola <strong>${nombre || 'Usuario'}</strong>,</p>
                    <p style="color: #475569; font-size: 15px; line-height: 1.5; margin: 0 0 24px 0;">${actionText}</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <span style="display: inline-block; font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #059669; background-color: #ecfdf5; padding: 14px 28px; border-radius: 8px; border: 2px dashed #10b981;">${code}</span>
                    </div>
                    <p style="color: #ef4444; font-size: 13px; text-align: center; margin: 0 0 16px 0;">
                        ⏱️ Este código expira en <strong>15 minutos</strong>.
                    </p>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">${footerNote}</p>
            </div>
        `;

        // 1. INTENTO VÍA RESEND (API REST HTTPS - Puerto 443)
        // No requiere puertos SMTP y funciona en Railway, Render, Vercel, etc.
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey && resendApiKey.trim() !== '') {
            console.log(`📧 Enviando código vía Resend HTTPS API a ${to}...`);
            const fromAddress = process.env.EMAIL_FROM || 'VetExóticos <onboarding@resend.dev>';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey.trim()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: fromAddress,
                        to: [to],
                        subject: subject,
                        html: html
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `Resend error HTTP ${response.status}`);
                }

                console.log(`✅ Correo enviado con éxito vía Resend (ID: ${data.id})`);
                return { success: true, provider: 'resend', id: data.id };
            } catch (err) {
                clearTimeout(timeoutId);
                const isTimeout = err.name === 'AbortError';
                const msg = isTimeout ? 'Tiempo de espera agotado (7s) conectando con Resend API' : err.message;
                console.error(`❌ Error al enviar correo vía Resend: ${msg}`);
                throw new Error(`Fallo en Resend API: ${msg}`);
            }
        }

        // 2. INTENTO VÍA BREVO API (HTTPS - Puerto 443)
        const brevoApiKey = process.env.BREVO_API_KEY;
        if (brevoApiKey && brevoApiKey.trim() !== '') {
            console.log(`📧 Enviando código vía Brevo HTTPS API a ${to}...`);
            const senderEmail = process.env.EMAIL_FROM || 'no-reply@clinica-exoticos.com';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

            try {
                const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'api-key': brevoApiKey.trim(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: 'VetExóticos', email: senderEmail },
                        to: [{ email: to, name: nombre || 'Usuario' }],
                        subject: subject,
                        htmlContent: html
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `Brevo error HTTP ${response.status}`);
                }

                console.log(`✅ Correo enviado con éxito vía Brevo (ID: ${data.messageId})`);
                return { success: true, provider: 'brevo', id: data.messageId };
            } catch (err) {
                clearTimeout(timeoutId);
                const isTimeout = err.name === 'AbortError';
                const msg = isTimeout ? 'Tiempo de espera agotado (7s) conectando con Brevo API' : err.message;
                console.error(`❌ Error al enviar correo vía Brevo: ${msg}`);
                throw new Error(`Fallo en Brevo API: ${msg}`);
            }
        }

        // 3. INTENTO VÍA SMTP (Nodemailer con timeout estricto)
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const isConfiguredSmtp = smtpUser && smtpPass && smtpUser !== 'tu_correo@gmail.com' && smtpPass !== 'tu_password';

        if (isConfiguredSmtp) {
            console.log(`📧 Intentando envío vía SMTP (${process.env.SMTP_HOST || 'smtp.gmail.com'}) con timeout de 5s...`);
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '465', 10),
                secure: String(process.env.SMTP_PORT) === '465',
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                },
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 5000
            });

            try {
                const info = await transporter.sendMail({
                    from: `"VetExóticos" <${smtpUser}>`,
                    to,
                    subject,
                    html
                });
                console.log(`✅ Correo enviado con éxito vía SMTP (ID: ${info.messageId})`);
                return { success: true, provider: 'smtp', id: info.messageId };
            } catch (err) {
                console.error(`❌ Error al enviar correo vía SMTP: ${err.message}`);
                throw new Error(`Fallo en conexión SMTP: ${err.message}`);
            }
        }

        // 4. SI ESTAMOS EN PRODUCCIÓN Y NINGÚN PROVEEDOR ESTÁ CONFIGURADO
        if (process.env.NODE_ENV === 'production') {
            const errorMsg = 'El servicio de correo no está configurado en producción. Por favor configura RESEND_API_KEY en las variables de entorno de Railway.';
            console.error(`🛑 ${errorMsg}`);
            throw new Error(errorMsg);
        }

        // 5. MODO DESARROLLO LOCAL (Si no hay credenciales configuradas)
        console.log('--------------------------------------------------');
        console.log('📢 [MODO DESARROLLO] Código de verificación generado:');
        console.log(`🔑 CÓDIGO: ${code}`);
        console.log(`📧 Destinatario: ${to}`);
        console.log(`🏷️ Acción: ${type}`);
        console.log('--------------------------------------------------');
        return { success: true, provider: 'console', code };
    }
}

module.exports = EmailService;
