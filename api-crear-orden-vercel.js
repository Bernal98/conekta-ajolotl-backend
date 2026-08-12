
// /api/crear-orden.js - Vercel Serverless Function
// Para deploy en Vercel: vercel --prod

const conekta = require('conekta');
conekta.api_key = process.env.CONEKTA_PRIVATE_KEY || 'key_0OWIRtYYPyJogry9tVGIgXc';
conekta.locale = 'es';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  try {
    const {carrito, cliente, envio, metodoPago, totalConEnvio} = req.body;
    
    const line_items = carrito.map(item => ({
      name: item.nombre,
      unit_price: item.precioPublico * 100,
      quantity: item.qty
    }));

    if(envio.costo > 0){
      line_items.push({name: `Envío ${envio.tipo}`, unit_price: envio.costo*100, quantity:1});
    }

    let payment_method = {};
    if(metodoPago==='OXXO') payment_method = {type:'oxxo_cash', expires_at: Math.floor(Date.now()/1000)+24*3600};
    else if(metodoPago==='SPEI') payment_method = {type:'spei', expires_at: Math.floor(Date.now()/1000)+24*3600};

    const order = await conekta.Order.create({
      currency: 'MXN',
      customer_info: {name: cliente.nombre, email: cliente.email, phone: cliente.telefono},
      line_items,
      charges: [{payment_method}],
      shipping_contact: {address:{street1:cliente.direccion, postal_code:cliente.cp, country:'MX'}}
    });

    res.json(order);
  } catch(e){
    res.status(500).json({error:e.message});
  }
};
