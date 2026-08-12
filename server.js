require('dotenv').config();
// BACKEND NODE.JS - CONEKTA REAL - Ajolotl Game Store
// Instalar: npm install express conekta cors
// Ejecutar: node server.js
// Este archivo usa tu LLAVE PRIVADA - NUNCA lo subas a GitHub público ni al frontend

const express = require('express');
const conekta = require('conekta');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 TU LLAVE PRIVADA - PRODUCCIÓN
// Esta es la que me diste: key_0OWIRtYYPyJogry9tVGIgXc
// En producción, guárdala en variable de entorno: process.env.CONEKTA_PRIVATE_KEY
conekta.api_key = process.env.CONEKTA_PRIVATE_KEY || 'key_0OWIRtYYPyJogry9tVGIgXc';
conekta.locale = 'es';

app.post('/crear-orden-conekta', async (req, res) => {
  try {
    const { carrito, cliente, envio, metodoPago, totalConEnvio } = req.body;

    console.log('Creando orden Conekta Real para:', cliente.nombre, 'Total:', totalConEnvio, 'Método:', metodoPago);

    // Calcular line_items con precio final (ya incluye comisión)
    const line_items = carrito.map(item => ({
      name: item.nombre,
      unit_price: item.precioPublico * 100, // Conekta usa centavos
      quantity: item.qty,
      sku: item.serie || 'SKU-'+item.id
    }));

    // Agregar envío como line_item si hay
    if(envio.costo > 0){
      line_items.push({
        name: `Envío ${envio.tipo}`,
        unit_price: envio.costo * 100,
        quantity: 1,
        sku: 'ENVIO'
      });
    }

    let payment_method = {};
    if(metodoPago === 'OXXO'){
      payment_method = { type: 'oxxo_cash', expires_at: Math.floor(Date.now()/1000) + 24*3600 }; // 24h
    } else if(metodoPago === 'SPEI'){
      payment_method = { type: 'spei', expires_at: Math.floor(Date.now()/1000) + 24*3600 };
    } else if(metodoPago === 'Tarjeta'){
      // Para tarjeta, el frontend debe enviar token creado con llave pública key_fZ4imwYAGvG5iB0qIZZ0VAF
      // Aquí usarías: payment_method = { type: 'card', token_id: req.body.tokenId }
      payment_method = { type: 'card' };
    }

    const order = await conekta.Order.create({
      currency: 'MXN',
      customer_info: {
        name: cliente.nombre,
        email: cliente.email,
        phone: cliente.telefono
      },
      line_items: line_items,
      charges: [{ payment_method: payment_method }],
      shipping_contact: {
        address: {
          street1: cliente.direccion,
          postal_code: cliente.cp,
          country: 'MX'
        }
      },
      metadata: {
        tienda: 'Ajolotl Game Store',
        productos: carrito.length,
        tipo_envio: envio.tipo
      }
    });

    console.log('✅ Orden Conekta creada:', order.id, 'Monto:', order.amount/100);

    // Respuesta con datos reales de Conekta
    const respuesta = {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      payment_status: order.payment_status,
      charges: order.charges.data.map(c => ({
        id: c.id,
        amount: c.amount,
        payment_method: {
          type: c.payment_method.type,
          reference: c.payment_method.reference || null, // Referencia OXXO REAL
          receiving_account_number: c.payment_method.receiving_account_number || null, // CLABE SPEI REAL
          receiving_account_bank: c.payment_method.receiving_account_bank || null,
          expires_at: c.payment_method.expires_at ? new Date(c.payment_method.expires_at*1000).toLocaleString() : null
        }
      })),
      // Para OXXO: referencia válida en 20k tiendas
      // Para SPEI: CLABE BBVA real
    };

    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error Conekta:', error);
    res.status(500).json({ error: error.message, details: error.details });
  }
});

// Webhook para cuando Conekta confirme pago (cuando cliente pague en OXXO/SPEI)
app.post('/webhook-conekta', (req, res) => {
  const evento = req.body;
  console.log('Webhook Conekta recibido:', evento.type);
  
  if(evento.type === 'order.paid'){
    console.log('✅ Pago confirmado:', evento.data.object.id);
    // Aquí: actualiza tu BD, envía ticket por WhatsApp, genera boletos, descuenta stock
  }
  
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.send('Conekta Backend Ajolotl Game Store - Llave Pública: key_fZ4imwYAGvG5iB0qIZZ0VAF - Privada: key_0OWI...Xc activa');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend Conekta corriendo en http://localhost:${PORT}`);
  console.log(`🔑 Llave pública: key_fZ4imwYAGvG5iB0qIZZ0VAF`);
  console.log(`🔑 Llave privada: key_0OWI...Xc (oculta por seguridad)`);
  console.log(`💰 Comisiones: OXXO 2.9%+8, SPEI 2%+0, Tarjeta 3.6%+3`);
});
