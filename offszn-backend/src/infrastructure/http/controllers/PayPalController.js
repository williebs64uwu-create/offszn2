import paypal from '@paypal/checkout-server-sdk';
import paypalClient from '../paypalClient.js';
import { supabase } from '../../database/connection.js';
import { PLATFORM_PAYPAL_EMAIL } from '../../../shared/config/config.js';
import { sendReceiptEmail } from '../../../shared/utils/email.js';

export const createPayPalOrder = async (req, res) => {
    try {
        const userId = req.user?.userId;
        let cartItems = [];

        if (userId) {
            const { data, error: cartError } = await supabase
                .from('cart_items')
                .select('product:products(id, name, price_basic, producer_id, image_url, mp3_url, wav_url, stems_url, kit_url), license_name, variant_price')
                .eq('user_id', userId);

            if (cartError) throw cartError;
            cartItems = data || [];
        } else {
            cartItems = req.body.cartItems || [];
        }

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'Carrito vacío' });
        }

        // Logic for recalculating grandTotal and commissions...
        // (Simplified for migration, keeping legacy logic structure)
        let grandTotal = 0;
        cartItems.forEach(item => {
            const price = parseFloat(item.variant_price) || 0;
            const commission = price < 20 ? 1.00 : price * 0.05;
            grandTotal += (price + commission);
        });

        const platformPayee = (!PLATFORM_PAYPAL_EMAIL || !PLATFORM_PAYPAL_EMAIL.includes('@'))
            ? { merchant_id: PLATFORM_PAYPAL_EMAIL || 'BK7AFKN36JSWW' }
            : { email_address: PLATFORM_PAYPAL_EMAIL };

        const purchaseUnits = [{
            reference_id: 'offszn_combined_order',
            amount: {
                currency_code: 'USD',
                value: grandTotal.toFixed(2)
            },
            description: `OFFSZN Purchase - ${cartItems.length} items`,
            payee: platformPayee
        }];

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: purchaseUnits
        });

        const response = await paypalClient.client().execute(request);
        res.status(200).json({ id: response.result.id });
    } catch (err) {
        console.error("PayPal Create Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const capturePayPalOrder = async (req, res) => {
    const { orderID, cartItems: guestItems } = req.body;
    let userId = req.user?.userId;

    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});

        const response = await paypalClient.client().execute(request);

        if (response.result.status === 'COMPLETED' || response.result.status === 'APPROVED') {
            let cartItems = [];
            if (userId) {
                const { data, error: cartFetchError } = await supabase
                    .from('cart_items')
                    .select('product:products(id, name, producer_id, image_url, mp3_url, wav_url, stems_url, kit_url), license_name, variant_price')
                    .eq('user_id', userId);
                if (cartFetchError) throw cartFetchError;
                cartItems = data || [];
            } else {
                cartItems = guestItems || [];
                const payerEmail = response.result.payer?.email_address;
                if (payerEmail) {
                    const { data: existingUser } = await supabase.from('users').select('id').eq('email', payerEmail).single();
                    if (existingUser) userId = existingUser.id;
                }
            }

            const totalPaid = response.result.purchase_units.reduce((acc, unit) => {
                const capture = unit.payments?.captures?.[0];
                return acc + (capture ? parseFloat(capture.amount.value) : 0);
            }, 0);

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: userId,
                    transaction_id: orderID,
                    status: 'completed',
                    total_price: totalPaid,
                    amount: totalPaid,
                    payer_email: response.result.payer?.email_address
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // record items, transactions, increment sales, send emails...
            // (Keeping logic simplified for migration)

            res.status(200).json({ ...response.result, supabaseOrder: order });
        } else {
            res.status(400).json({ error: 'Pago no completado', status: response.result.status });
        }
    } catch (err) {
        console.error("PayPal Capture Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const linkGuestOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.userId;

        const { error: updateError } = await supabase
            .from('orders')
            .update({ user_id: userId })
            .eq('id', orderId)
            .is('user_id', null);

        if (updateError) throw updateError;
        res.status(200).json({ message: 'Orden vinculada correctamente' });
    } catch (err) {
        console.error('[LinkOrder] Error:', err);
        res.status(500).json({ error: 'Error interno al vincular la orden' });
    }
};

export const getSecureDownloadUrl = async (req, res) => {
    // Logic for generating signed Supabase URLs...
    // (Keeping legacy logic structure)
    res.status(501).json({ error: 'Not implemented yet in new architecture' });
};
