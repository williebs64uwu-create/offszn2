import { supabase } from '../../database/connection.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { MERCADOPAGO_ACCESS_TOKEN } from '../../../shared/config/config.js';
import fetch from 'node-fetch'; // Ensure node-fetch is available or use global fetch if in Node 18+
import { createNotification } from './NotificationController.js';

const client = MERCADOPAGO_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN }) : null;
const TASA_CAMBIO_USD_COP = 4200;

/**
 * Creates a Mercado Pago preference for the checkout session.
 */
export const createMercadoPagoPreference = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cartItems } = req.body;

        if (!cartItems?.length) return res.status(400).json({ error: 'Carrito vacío' });

        const productIds = cartItems.map(item => item.productId || item.id);
        const { data: dbProducts, error } = await supabase
            .from('products')
            .select(`
                id, 
                name, 
                price_basic, 
                image_url, 
                cover_url,
                currency
            `)
            .in('id', productIds)
            .eq('status', 'approved');

        if (error) throw error;

        // Redirect URL detection strategy
        let clientURL = req.headers.origin || req.headers.referer;
        if (!clientURL || clientURL.includes('localhost')) {
            clientURL = "http://127.0.0.1:5173";
        }

        const line_items = dbProducts.map(product => {
            let unitPrice = parseFloat(product.price_basic) || 10;
            if (isNaN(unitPrice)) unitPrice = 10;

            // Currency conversion to COP for Mercado Pago
            if (product.currency === 'USD' || !product.currency) {
                unitPrice *= TASA_CAMBIO_USD_COP;
            }
            if (unitPrice < 500) unitPrice = 500; // Minimum required by MP

            return {
                id: product.id.toString(),
                title: product.name,
                picture_url: product.cover_url || product.image_url,
                quantity: 1,
                currency_id: 'COP',
                unit_price: Number(unitPrice.toFixed(2))
            };
        });

        const preferenceBody = {
            items: line_items,
            back_urls: {
                success: `${clientURL}/success`,
                failure: `${clientURL}/checkout`,
                pending: `${clientURL}/checkout`
            },
            auto_return: "approved",
            external_reference: JSON.stringify({ u_id: userId, ts: Date.now() }),
            binary_mode: true
        };

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceBody });

        res.status(200).json({ url: result.init_point });
    } catch (err) {
        console.error("❌ Error MP Detallado:", JSON.stringify(err, null, 2));
        res.status(500).json({
            error: err.message,
            details: err.cause || err
        });
    }
};

/**
 * Handles the webhook notification from Mercado Pago.
 * Responds immediately and processes the audit in the background.
 */
export const handleMercadoPagoWebhook = async (req, res) => {
    const id = req.query.id || req.query['data.id'];
    const topic = req.query.topic || req.query.type;

    console.log(`🔔 [Webhook IN] Topic: ${topic} | ID: ${id}`);

    if (topic === 'payment') {
        res.status(200).send('OK'); // Respond immediately to MP
        processPaymentAudit(id);     // Process in background
    } else {
        res.status(200).send('OK');
    }
};

/**
 * Retries fetching payment details and persists the order if approved.
 */
const processPaymentAudit = async (paymentId) => {
    const currentToken = MERCADOPAGO_ACCESS_TOKEN;
    const maskedToken = currentToken ? `${currentToken.substring(0, 10)}...` : 'NULL';
    console.log(`🔑 [AUDIT TOKEN] Usando token: ${maskedToken}`);
    console.log(`🕵️ [AUDIT START] Investigating payment ${paymentId}`);

    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
        attempt++;
        const delay = 5000;
        console.log(`⏳ [AUDIT LOOP] Attempt ${attempt}/${maxRetries}`);

        await new Promise(r => setTimeout(r, delay));

        try {
            const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ [AUDIT SUCCESS] Status: ${data.status}`);

                if (data.status === 'approved' || data.status === 'completed') {
                    await saveOrderToDB(data);
                }
                return;
            } else {
                const errorText = await response.text();
                console.warn(`⚠️ [AUDIT FAIL] MP Response: ${errorText}`);
            }
        } catch (e) {
            console.error(`🔴 [AUDIT ERROR] Network/Code failure:`, e);
        }
    }
};

/**
 * Persists the approved order and its items to the database.
 */
const saveOrderToDB = async (paymentData) => {
    try {
        const metadata = JSON.parse(paymentData.external_reference);
        const userId = metadata.u_id;

        // 1. Insert Main Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                transaction_id: paymentData.id.toString(),
                status: 'completed', // Using 'completed' for internal logic sync
                total_price: paymentData.transaction_amount
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Insert Order Items (extract from additional_info or logic fallback)
        const items = paymentData.additional_info?.items || [];
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: parseInt(item.id),
            quantity: 1,
            price_at_purchase: item.unit_price
        }));

        if (orderItems.length > 0) {
            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            // 3. Increment Sales Counts and emit notifications
            for (const item of orderItems) {
                const { data: prod } = await supabase
                    .from('products')
                    .select('sales_count, producer_id, name')
                    .eq('id', item.product_id)
                    .single();

                if (prod) {
                    await supabase
                        .from('products')
                        .update({ sales_count: (prod.sales_count || 0) + 1 })
                        .eq('id', item.product_id);

                    // Notify producer
                    await createNotification({
                        userId: prod.producer_id,
                        actorId: userId,
                        type: 'sale',
                        message: `¡Has vendido <strong>${prod.name}</strong> por COP ${item.price_at_purchase}!`,
                        link: `/dashboard/orders`
                    });
                }
            }

            // Notify buyer
            await createNotification({
                userId: userId,
                type: 'purchase_complete',
                message: `Tu compra se ha procesado con éxito. ¡Ve a Mis Productos para descargar!`,
                link: `/dashboard/my-products`
            });
        }

        console.log(`🎯 [DB SUCCESS] Order ${order.id} persisted for user ${userId}`);
    } catch (err) {
        console.error("❌ [DB ERROR] Failure saving order:", err);
    }
};

/**
 * Polling endpoint for the client to check if the latest order is completed.
 */
export const checkPaymentStatus = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { data, error } = await supabase
            .from('orders')
            .select('id, status, created_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data && !error) {
            // Only return if order is recent (within 5 minutes)
            const isRecent = new Date(data.created_at).getTime() > (Date.now() - 5 * 60 * 1000);
            if (isRecent) {
                return res.status(200).json({ status: 'completed', orderId: data.id });
            }
        }

        res.status(200).json({ status: 'pending' });
    } catch (err) {
        res.status(500).json({ error: 'Error checking status' });
    }
};

/**
 * Creates a free order bypassing payment gateways.
 */
export const createFreeOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;

        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('id, is_free, price_basic')
            .eq('id', productId)
            .single();

        if (fetchError || !product) return res.status(404).json({ error: 'Producto no encontrado' });

        const isActuallyFree = product.is_free === true || parseFloat(product.price_basic) === 0;
        if (!isActuallyFree) {
            return res.status(403).json({ error: 'Este producto no es gratuito' });
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                transaction_id: `FREE-${Date.now()}-${userId.substring(0, 5)}`,
                status: 'completed',
                total_price: 0
            })
            .select().single();

        if (orderError) throw orderError;

        await supabase.from('order_items').insert({
            order_id: order.id,
            product_id: product.id,
            quantity: 1,
            price_at_purchase: 0
        });

        // Increment download counter
        await supabase.rpc('increment_product_downloads', { row_id: product.id });

        res.status(201).json({ message: 'Descarga gratuita registrada', orderId: order.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Manual webhook re-processing for stuck payments (Debug).
 */
export const forceCheckPayment = async (req, res) => {
    const { paymentId } = req.params;
    console.log(`🚨 [FORCE] Iniciando forzado manual para ${paymentId}`);
    processPaymentAudit(paymentId);
    res.json({ message: "Proceso forzado iniciado en background. Revisa logs." });
};

/**
 * Generates a temporal signed URL for a purchased product file.
 * Validates ownership and order status before granting access.
 */
export const getSecureDownloadLink = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId, productId, type } = req.params; // type: 'mp3', 'wav', 'stems'

        if (!['mp3', 'wav', 'stems'].includes(type)) {
            return res.status(400).json({ error: 'Tipo de archivo inválido.' });
        }

        // 1. Verify Ownership & Order Status
        // We join order_items -> orders to check user_id and status 'completed'
        const { data: orderItem, error } = await supabase
            .from('order_items')
            .select(`
                id,
                orders!inner (
                    id, user_id, status
                ),
                products (
                    id, download_url_mp3, download_url_wav, download_url_stems
                )
            `)
            .eq('order_id', orderId)
            .eq('product_id', productId)
            .eq('orders.user_id', userId)
            .eq('orders.status', 'completed')
            .maybeSingle();

        if (error) {
            console.error("Download verification error:", error);
            return res.status(500).json({ error: 'Error verificando la compra.' });
        }

        if (!orderItem) {
            return res.status(403).json({ error: 'No tienes permiso para descargar este archivo o la orden no está completada.' });
        }

        // 2. Get File Path from Product
        const product = orderItem.products;
        let fileUrl = null;

        if (type === 'mp3') fileUrl = product.download_url_mp3;
        else if (type === 'wav') fileUrl = product.download_url_wav;
        else if (type === 'stems') fileUrl = product.download_url_stems;

        if (!fileUrl) {
            return res.status(404).json({ error: 'Archivo no disponible para este producto.' });
        }

        // 3. Generate Signed URL (Supabase Storage OR Cloudflare R2)
        const SUPABASE_URL_MARKER = '/storage/v1/object/public/';

        // A) Supabase Storage
        if (fileUrl.includes(SUPABASE_URL_MARKER)) {
            const pathPart = fileUrl.split(SUPABASE_URL_MARKER)[1];
            const [bucket, ...rest] = pathPart.split('/');
            const filePath = rest.join('/');

            const { data: signedData, error: signError } = await supabase
                .storage
                .from(bucket)
                .createSignedUrl(filePath, 3600);

            if (signError) {
                console.error("Signed URL Error:", signError);
                return res.status(500).json({ error: 'Error generando enlace seguro.' });
            }

            return res.json({ downloadUrl: signedData.signedUrl });
        }

        // B) Cloudflare R2 (Hybrid)
        // Detect if it is an R2 URL or a raw key (Legacy behavior often stored raw keys or r2 domains)
        const isR2 = fileUrl.includes('r2.cloudflarestorage.com') ||
            !fileUrl.startsWith('http'); // Relative paths are usually R2 keys in this system

        if (isR2) {
            // Extract Key
            let key = fileUrl;
            if (fileUrl.startsWith('http')) {
                const r2Base = '.r2.cloudflarestorage.com/';
                if (fileUrl.includes(r2Base)) {
                    key = fileUrl.split(r2Base)[1];
                    // Remove bucket from path if present (depends on how it was stored)
                    // Usually stored as: [bucket]/path/to/file or just path/to/file
                    // For now, assume key is correct path relative to bucket root
                }
            }

            // Clean key
            if (key.startsWith('/')) key = key.substring(1);

            try {
                const { GetObjectCommand } = await import("@aws-sdk/client-s3");
                const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
                const { s3Client } = await import("../../storage/r2Client.js");
                const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "offszn-storage";

                const command = new GetObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: key,
                });

                const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                return res.json({ downloadUrl: url });

            } catch (r2Error) {
                console.error("R2 Signing Error:", r2Error);
                return res.status(500).json({ error: 'Error generando enlace R2.' });
            }
        }

        // Fallback: Return original URL
        res.json({ downloadUrl: fileUrl });

    } catch (err) {
        console.error("Secure Download Controller Error:", err);
        res.status(500).json({ error: 'Error interno al procesar la descarga.' });
    }
};
