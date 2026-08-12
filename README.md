# Backend Conekta Real - Ajolotl Game Store

## Llaves activas
- Publica: key_fZ4imwYAGvG5iB0qIZZ0VAF
- Privada: key_0OWIRtYYPyJogry9tVGIgXc (GUARDAR EN .env, NO EN GIT)

## Deploy gratis en Render

1. Crea cuenta en https://render.com
2. New + -> Web Service -> Conecta tu GitHub repo
3. Build Command: npm install
4. Start Command: npm start
5. Environment Variables:
   CONEKTA_PRIVATE_KEY=key_0OWIRtYYPyJogry9tVGIgXc
   CONEKTA_PUBLIC_KEY=key_fZ4imwYAGvG5iB0qIZZ0VAF
6. Deploy -> Te da URL https://tu-app.onrender.com

## Uso desde frontend
fetch('https://tu-app.onrender.com/crear-orden-conekta', {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({carrito, cliente, envio, metodoPago, totalConEnvio})
})
.then(r=>r.json())
.then(orden=>{ 
  // orden.charges.data[0].payment_method.reference -> OXXO REAL
  // orden.charges.data[0].payment_method.receiving_account_number -> SPEI REAL
})
