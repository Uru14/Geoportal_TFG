// const express = require('express');
// const { createProxyMiddleware } = require('http-proxy-middleware');
// const path = require('path');
//
//
//
//
// const app = express();
//
//
// app.use(
//   '/proxy/wms',
//   createProxyMiddleware({
//     target: 'https://ovc.catastro.meh.es/',
//     secure: false,
//     changeOrigin: true,
//     pathRewrite: {
//       '^/proxy/wms': 'cartografia/INSPIRE/spadgcwms.aspx',
//     },
//   })
// );
//
//
// app.use(express.static(path.join(__dirname, 'src')));
//
//
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'src', 'index.html'));
// });
//
//
// app.listen(3000, () => {
//   console.log('Servidor proxy en ejecución en http://localhost:3000');
// });
//
//
