import express from 'express';

const router = express.Router();

/**
 * GET /api/offer
 * 
 * Gets available offers
 */
router.get('/', (req, res) => {
  res.json({
    offers: [
      {
        id: '1',
        title: 'Summer Promotion',
        description: 'Special summer rates for athletes',
        discountPercentage: 15,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Early Bird Special',
        description: 'Sign up early for additional benefits',
        discountPercentage: 10,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  });
});

/**
 * GET /api/offer/:id
 * 
 * Gets details for a specific offer
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    id,
    title: id === '1' ? 'Summer Promotion' : 'Early Bird Special',
    description: id === '1' 
      ? 'Special summer rates for athletes'
      : 'Sign up early for additional benefits',
    discountPercentage: id === '1' ? 15 : 10,
    expiresAt: new Date(Date.now() + (id === '1' ? 30 : 15) * 24 * 60 * 60 * 1000).toISOString(),
    details: {
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      termsAndConditions: 'Standard terms apply, see documentation for details.'
    }
  });
});

export default router;