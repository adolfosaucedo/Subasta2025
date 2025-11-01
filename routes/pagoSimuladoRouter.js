// routes/pagoSimuladoRouter.js
import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
  const { pujaId, monto } = req.body;
  // Simulación de pago exitoso
  res.json({
    status: 'success',
    message: 'Pago simulado exitosamente',
    data: { pujaId, monto, fecha: new Date() }
  });
});

export default router;
