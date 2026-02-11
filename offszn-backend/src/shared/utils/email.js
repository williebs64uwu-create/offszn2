import {
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
    EMAILJS_PRIVATE_KEY
} from '../config/config.js';

export const sendReceiptEmail = async (data) => {
    const { service_id, template_id, ...templateParams } = data;
    try {
        const payload = {
            service_id: service_id || EMAILJS_SERVICE_ID,
            template_id: template_id || EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            accessToken: EMAILJS_PRIVATE_KEY,
            template_params: templateParams
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EmailJS Error: ${response.status} - ${errorText}`);
        }

        return { success: true };
    } catch (err) {
        console.error('[EmailJS] Failed to send email:', err.message);
        return { success: false, error: err.message };
    }
};
