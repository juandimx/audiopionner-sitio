# AudioPionner — Documento de traspaso del proyecto

Sitio web de muebles de **AudioPionner** (tienda de tecnología, hogar y electrodomésticos en Santa Marta y Ciénaga, Colombia).
Responsable: **Juan Diego Palacio**. Comunicación: instrucciones cortas y directas en español; espera que los cambios se implementen sin mucha ida y vuelta.

## 1. Dónde vive todo
- **Código:** GitHub `juandimx/audiopionner-sitio`, rama `main`.
- **Publicación:** Netlify publica automáticamente cada `push` a `main`.
- **URLs:**
  - Tienda con precios y pagos: https://audiopionnerdemo.netlify.app/
  - **Catálogo sin precios ni pagos** (el que más se usa ahora): https://audiopionnerdemo.netlify.app/catalogo/
- Sitio estático (HTML + CSS + JS, sin framework ni paso de compilación).

## 2. Estructura
| Archivo / carpeta | Qué es |
|---|---|
| `products.js` | **Fuente única de productos** (los usan la tienda y el catálogo). |
| `index.html` | Página de inicio de la tienda (landing). |
| `muebles.html`, `producto.html`, `tiendas.html` | Catálogo por categorías, ficha de producto, sedes (tienda). |
| `carrito.html`, `checkout.html`, `success.html` | Carrito y pago con Stripe (solo tienda). |
| `main.js` | Encabezado, pie, carrito, tarjeta de producto, botón de WhatsApp (tienda). |
| `styles.css` | Estilos compartidos por tienda y catálogo. |
| `espacio.js` | Módulo "Ver en tu espacio": abre la cámara con el mueble recortado; la foto se descarga, se guarda en "Mis fotos" (IndexedDB) y se puede compartir/guardar. |
| `catalogo/` | Versión catálogo: `index.html`, `muebles.html`, `producto.html`, `tiendas.html`, `main.js` (copia sin carrito), `data.js` (quita precios y ajusta rutas a `../`). |
| `catalogo/p/` | Una página por producto/color con `og:image` para que el enlace en WhatsApp muestre la foto. **Se genera** con `node tools/generar-enlaces-catalogo.js`. |
| `cutouts/` | Recortes PNG→WebP sin fondo de cada producto/color (para la cámara). Se generan con `tools/recortar.py`. |
| `landing/` | Imágenes de la página de inicio (transición, banners, nueva colección). |
| `netlify/functions/create-checkout-session.js` | Pago Stripe (solo tienda). Lee precios del servidor desde `products.js`; COP se envía ×100. Clave en variable de entorno `STRIPE_SECRET_KEY`. |

## 3. Formato de un producto (`products.js`)
```js
{
  id: 112, slug: "cama-isabella-1-60", name: "Cama Isabella 1,60 m",
  category: "muebles", subcategory: "camas", subcategoryLabel: "Camas",
  image: "cama-isabella-160.jpg", cutout: "cutouts/cama-isabella-160.webp",
  price: null,            // null = "Cotizar por WhatsApp" (sin carrito)
  compareAtPrice: null, brand: "AudioPionner",
  description: "...", specs: { "Medida": "1,60 m", "Garantía": "12 meses" },
  pickup: true, stock: null,
  // opcionales:
  colors: [{ name: "Negro", hex: "#1E1E1E", image: "x.jpg", cutout: "cutouts/x.webp" }],
  gallery: ["foto1.jpg", "foto2.jpg"],   // miniaturas en la ficha
  sizes: ["Sencillo 100 × 190 cm", ...], // selector de medida (colchones, bases)
  nueva: true                            // marca de nueva colección
}
```
Subcategorías: `sala`, `comedor`, `camas`, `colchones`, `bases`, `closets`, `organizadores`, `tocadores`, `consolas` (bifés/espejos), `centro-mesa`.
Al editar con Node: leer `require("./products.js")`, modificar y volver a escribir conservando la cabecera del archivo y el bloque final `module.exports`.

## 4. Cómo agregar un producto (checklist)
1. Foto a la raíz en JPG (máx. 1000 px, calidad ~82), nombre en minúsculas con guiones.
2. Agregar el objeto en `products.js` (id = máximo + 1).
3. Recorte: `python tools/recortar.py foto.jpg` → revisar `cutouts/` → poner `cutout` en el producto.
4. `node tools/generar-enlaces-catalogo.js` (vista previa de WhatsApp en el catálogo).
5. Si va en **Nueva colección**: editar el bloque `<section class="nc" id="nuevos">` en **`index.html` y `catalogo/index.html`** (en el catálogo sin la línea de precio y con rutas `../landing/`), y guardar la imagen en `landing/nc-*.webp`.
6. Actualizar los contadores de categorías ("39 diseños", etc.) en ambas páginas de inicio si cambian.
7. Commit y push a `main`.

> Importante: la plantilla con la que se generaron las páginas de inicio ya no existe; **`index.html` y `catalogo/index.html` son ahora la fuente** y cualquier cambio de la landing debe hacerse en los dos.

## 5. Reglas de negocio vigentes
- **WhatsApp:** tienda → 573163845802; **catálogo → 573024919445** (302 491 9445). En el catálogo el botón dice **"Comprar ahora por WhatsApp"** y envía: "Hola AudioPionner 👋 Quiero comprar este producto: *Nombre* (color, medida) + enlace de `catalogo/p/` con foto".
- **Catálogo sin precios ni pagos.** Medios de pago solo informativos: Addi, Sistecrédito, Alo Credit, Banco de Bogotá, PSE, tarjeta.
- Botón flotante de WhatsApp **arriba a la derecha** con burbuja "¿Tienes una pregunta? Escríbenos" (abajo tapaba la marca de Netlify).
- **Colchones:** un solo producto "Colchones en todas las medidas" (varios tipos; el asesor explica por WhatsApp). Bases cama en blanco, negro y gris.
- Productos del mismo modelo en varios colores = **una ficha con colores** (ej. tocadores Villini/Hollywood, Comedor Tainer, Comedor Luciana).
- Sedes: Santa Marta (Cra 5ta con Calle 13; Cra 5ta con Calle 11 y 12; San Andresito Local 160; Calle 22 No. 5-21 Local 2) y Ciénaga (Calle 17 #18-05).
- Estilo: tipografía Montserrat, colores AudioPionner (navy #09447E, rojo #E20004, crema #FAF7F1, dorado #C9A24B), diseño claro y minimalista.

## 6. Página de inicio (secciones, en orden)
1. **Transición** de muebles sobre base con fondo de sala real desenfocada: Sala Mónaco, Cama Habana, Comedor Luciana, Villini con Luces (tocadores), Bifé Solari, Closet Moka, Mesa de centro. Avanza sola (~7 s), se desliza con el dedo, tocar el mueble abre su ficha. Botón "Ver en tu espacio".
2. **Nueva colección** (Tayrona, Gabanna 4 puestos, Eclis, Cama Isabella 1,60 m, Cama Alondra).
3. **Banner "Mira todo nuestro catálogo"** con 8 accesos por categoría.
4. **Banner de colchones** ("Colchones en todas las medidas").
5. **Arma tu espacio**: el cliente elige productos de cualquier categoría y envía la lista por WhatsApp.
6. Banner Sala Maritza, categorías, beneficios, pie.

## 7. Pendientes / notas
- En algunas camas el recorte automático no incluye el cabecero (se corrige con un rectángulo sobre la zona).
- Existen dos "Cama Isabella" distintas (la antigua de madera y la nueva 1,60 m): confirmar con Juan si se unen.
- Fotos de colchones de referencia con la marca Ramguiflex visible.
- El acceso a GitHub se hizo con un token temporal de Juan; quien continúe debe pedir **su propio acceso** (o usar Claude Code / conector de GitHub).
