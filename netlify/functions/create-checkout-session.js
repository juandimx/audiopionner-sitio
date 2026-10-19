// Netlify Function — crea una sesión de Stripe Checkout.
// La Secret Key vive en las variables de entorno de Netlify (STRIPE_SECRET_KEY).
//
// Seguridad: el navegador solo envía IDs y cantidades. Los precios se leen aquí,
// en el servidor, desde products.js, para que nadie pueda cambiarlos desde el navegador.

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const PRODUCTS = require("../../products.js");

const SHIPPING_COP = 65000; // Debe coincidir con el valor mostrado en checkout.html
const MAX_QTY = 20;

// COP es una moneda de dos decimales en Stripe: $2.237.000 se envía como 223700000.
const toStripeAmount = (cop) => Math.round(cop) * 100;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items, fulfillment } = JSON.parse(event.body || "{}");

    if (!Array.isArray(items) || items.length === 0) {
      return json(400, { error: "Tu carrito está vacío." });
    }

    const origin = getOrigin(event);

    const line_items = [];
    for (const item of items) {
      const product = PRODUCTS.find((p) => p.id === Number(item.id));
      const qty = Math.floor(Number(item.qty));
      if (!product || product.price == null || !(qty >= 1 && qty <= MAX_QTY)) {
        return json(400, { error: "Hay un producto o una cantidad no válida en tu carrito." });
      }
      line_items.push({
        price_data: {
          currency: "cop",
          product_data: {
            name: product.name,
            images: [`${origin}/${product.image}`],
          },
          unit_amount: toStripeAmount(product.price),
        },
        quantity: qty,
      });
    }

    if (fulfillment === "delivery") {
      line_items.push({
        price_data: {
          currency: "cop",
          product_data: { name: "Envío nacional (estimado)" },
          unit_amount: toStripeAmount(SHIPPING_COP),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout.html`,
    });

    return json(200, { url: session.url });
  } catch (err) {
    console.error(err);
    return json(500, { error: "No se pudo iniciar el pago. Intenta de nuevo en unos minutos." });
  }
};

function getOrigin(event) {
  // URL pública del sitio que Netlify inyecta; si no existe, usa el host de la petición.
  if (process.env.URL) return process.env.URL.replace(/\/$/, "");
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  return `https://${host}`;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
