const nodemailer = require('nodemailer');

/**
 * Extrae el nombre y la dirección de correo limpia
 * Ejemplo: 'VetExóticos <mi_correo@gmail.com>' -> { name: 'VetExóticos', email: 'mi_correo@gmail.com' }
 * Ejemplo: 'mi_correo@gmail.com' -> { name: 'VetExóticos', email: 'mi_correo@gmail.com' }
 */
function extractEmailAndName(input, defaultName = 'VetExóticos') {
    if (!input || typeof input !== 'string') return { name: defaultName, email: '' };
    const match = input.match(/^(?:(.*?)<)?([^<>]+)>?$/);
    if (match) {
        const name = (match[1] || '').trim().replace(/^["']|["']$/g, '');
        const email = match[2].trim();
        return { name: name || defaultName, email };
    }
    return { name: defaultName, email: input.trim() };
}

class EmailService {
    /**
     * Envía un correo con código de verificación (para login 2FA o recuperación de contraseña)
     * a CUALQUIER usuario registrado sin requerir un dominio propio.
     *
     * Proveedores soportados:
     * 1. Brevo REST API (HTTPS en puerto 443 - Envía a CUALQUIER correo gratis, sin dominio)
     * 2. SendGrid REST API (HTTPS en puerto 443 - Single Sender Verification)
     * 3. Resend REST API (HTTPS en puerto 443)
     * 4. SMTP con Nodemailer (con timeout estricto de 5s)
     * 5. Consola (solo en desarrollo local)
     *
     * @param {Object} options
     * @param {string} options.to - Correo de destino del usuario
     * @param {string} options.nombre - Nombre del usuario
     * @param {string} options.code - Código numérico de 6 dígitos
     * @param {string} [options.type='login'] - 'login', 'register' o 'reset_password'
     */
    static async sendVerificationEmail({ to, nombre, code, type = 'login' }) {
        let subject = 'Código de verificación - VetExóticos';
        let actionText = 'Utiliza el siguiente código para verificar tu cuenta en la aplicación:';
        let footerNote = 'Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.';

        if (type === 'login') {
            subject = 'Código de verificación de identidad - VetExóticos';
            actionText = 'Recibimos un intento de inicio de sesión en tu cuenta. Utiliza el siguiente código para confirmar tu identidad e ingresar a la aplicación:';
            footerNote = 'Si no intentaste iniciar sesión, te recomendamos cambiar tu contraseña de inmediato.';
        } else if (type === 'register') {
            subject = 'Código de confirmación de registro - VetExóticos';
            actionText = '¡Gracias por unirte a VetExóticos! Para activar tu cuenta y completar tu registro, utiliza el siguiente código de verificación:';
            footerNote = 'Si no creaste una cuenta en VetExóticos, puedes ignorar este correo de forma segura.';
        } else if (type === 'reset_password') {
            subject = 'Código de recuperación de contraseña - VetExóticos';
            actionText = 'Recibimos una solicitud para restablecer tu contraseña. Utiliza el siguiente código para proceder con el restablecimiento de tu contraseña en la aplicación:';
            footerNote = 'Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no se modificará.';
        }

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

        // -----------------------------------------------------------------------------------
        // OPCIÓN 1 (RECOMENDADA): BREVO API (REST HTTPS - Puerto 443)
        // Ventajas: Gratuito (300 emails/día), SIN dominio propio (usa tu correo personal verificado),
        // y entrega correos a CUALQUIER destinatario (Gmail, Hotmail, etc.).
        // -----------------------------------------------------------------------------------
        const brevoApiKey = process.env.BREVO_API_KEY;
        if (brevoApiKey && brevoApiKey.trim() !== '') {
            const rawSender = process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
            const { name: senderName, email: senderEmail } = extractEmailAndName(rawSender, 'VetExóticos');

            if (!senderEmail) {
                throw new Error('Debes configurar EMAIL_FROM en Railway con el correo que verificaste en tu cuenta de Brevo (ej: tu_correo@gmail.com)');
            }

            console.log(`📧 Enviando código vía Brevo HTTPS API a ${to} (Remitente: ${senderEmail})...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

            try {
                const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'api-key': brevoApiKey.trim(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: senderName || 'VetExóticos', email: senderEmail },
                        to: [{ email: to, name: nombre || 'Usuario' }],
                        subject: subject,
                        htmlContent: html
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                let data = {};
                try {
                    data = await response.json();
                } catch {}

                if (!response.ok) {
                    const detail = data.message || `HTTP ${response.status} ${response.statusText}`;
                    throw new Error(detail);
                }

                console.log(`✅ Correo enviado con éxito vía Brevo (ID: ${data.messageId || 'OK'})`);
                return { success: true, provider: 'brevo', id: data.messageId };
            } catch (err) {
                clearTimeout(timeoutId);
                const isTimeout = err.name === 'AbortError';
                const msg = isTimeout ? 'Tiempo de espera agotado (7s) conectando con Brevo API' : err.message;
                console.error(`❌ Error al enviar correo vía Brevo: ${msg}`);
                throw new Error(`Fallo en Brevo API: ${msg}`);
            }
        }

        // -----------------------------------------------------------------------------------
        // OPCIÓN 2: SENDGRID API (REST HTTPS - Puerto 443)
        // -----------------------------------------------------------------------------------
        const sendgridApiKey = process.env.SENDGRID_API_KEY;
        if (sendgridApiKey && sendgridApiKey.trim() !== '') {
            const rawSender = process.env.EMAIL_FROM || process.env.SMTP_USER;
            const { name: senderName, email: senderEmail } = extractEmailAndName(rawSender, 'VetExóticos');

            if (!senderEmail) {
                throw new Error('Debes configurar EMAIL_FROM con el remitente verificado en SendGrid');
            }

            console.log(`📧 Enviando código vía SendGrid HTTPS API a ${to}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

            try {
                const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sendgridApiKey.trim()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email: to, name: nombre || 'Usuario' }] }],
                        from: { email: senderEmail, name: senderName || 'VetExóticos' },
                        subject: subject,
                        content: [{ type: 'text/html', value: html }]
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`SendGrid HTTP ${response.status}: ${errorText}`);
                }

                console.log(`✅ Correo enviado con éxito vía SendGrid`);
                return { success: true, provider: 'sendgrid' };
            } catch (err) {
                clearTimeout(timeoutId);
                const isTimeout = err.name === 'AbortError';
                const msg = isTimeout ? 'Tiempo de espera agotado (7s) conectando con SendGrid' : err.message;
                console.error(`❌ Error al enviar correo vía SendGrid: ${msg}`);
                throw new Error(`Fallo en SendGrid API: ${msg}`);
            }
        }

        // -----------------------------------------------------------------------------------
        // OPCIÓN 3: RESEND API (REST HTTPS - Puerto 443)
        // -----------------------------------------------------------------------------------
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

        // -----------------------------------------------------------------------------------
        // OPCIÓN 4: SMTP CON NODEMAILER (Con timeout estricto de 5 segundos)
        // -----------------------------------------------------------------------------------
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

        // -----------------------------------------------------------------------------------
        // SI ESTAMOS EN PRODUCCIÓN Y NINGÚN PROVEEDOR ESTÁ CONFIGURADO
        // -----------------------------------------------------------------------------------
        if (process.env.NODE_ENV === 'production') {
            const errorMsg = 'El servicio de correo no está configurado en producción. Para enviar códigos a cualquier usuario sin necesidad de dominio propio, agrega las variables BREVO_API_KEY y EMAIL_FROM en Railway.';
            console.error(`🛑 ${errorMsg}`);
            throw new Error(errorMsg);
        }

        // -----------------------------------------------------------------------------------
        // MODO DESARROLLO LOCAL (Si no hay credenciales configuradas)
        // -----------------------------------------------------------------------------------
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
