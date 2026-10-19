// Catálogo sin pasarela de pago: usa los mismos productos de la tienda (../products.js)
// y ajusta las rutas de las fotos porque esta versión vive en la carpeta /catalogo/.
PRODUCTS.forEach((p) => {
  p.image = "../" + p.image;
  if (p.cutout) p.cutout = "../" + p.cutout;
  (p.colors || []).forEach((c) => {
    c.image = "../" + c.image;
    if (c.cutout) c.cutout = "../" + c.cutout;
  });
});
