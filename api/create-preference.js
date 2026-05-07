export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items, payer, delivery_type, discount_code, discount_amount } = req.body;

    const preference = {
      items: items.map(item => ({
        title: item.name,
        quantity: item.qty,
        unit_price: parseFloat(((item.price * (1 - (discount_amount || 0))) ).toFixed(2)),
        currency_id: 'UYU',
      })),
      payer: {
        name: payer.name,
        email: payer.email,
        phone: { number: payer.phone },
      },
      metadata: {
        delivery_type,
        discount_code: discount_code || 'ninguno',
        shipping_address: payer.address || 'PICKUP',
      },
      back_urls: {
        success: `${req.headers.origin || 'https://amun.com'}?status=success`,
        failure: `${req.headers.origin || 'https://amun.com'}?status=failure`,
        pending: `${req.headers.origin || 'https://amun.com'}?status=pending`,
      },
      auto_return: 'approved',
      statement_descriptor: 'AMUN',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('MP error:', data);
      return res.status(500).json({ error: 'Error creando preferencia', detail: data });
    }

    return res.status(200).json({ init_point: data.init_point, sandbox_init_point: data.sandbox_init_point });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno', detail: err.message });
  }
}
