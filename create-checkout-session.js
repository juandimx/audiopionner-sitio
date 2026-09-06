// Netlify Function — crea una sesión real de Stripe Checkout.
// La Secret Key NUNCA sale de aquí: vive en las variables de entorno de Netlify.
// Configúrala en: Netlify → Site settings → Environment variables → STRIPE_SECRET_KEY

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items, successUrl, cancelUrl } = JSON.parse(event.body);

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Carrito vacío" }) };
    }

    // COP es una moneda "zero-decimal" en Stripe: el monto va tal cual, sin multiplicar por 100.
    const line_items = items.map((item) => ({
      price_data: {
        currency: "cop",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price),
      },
      quantity: item.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
