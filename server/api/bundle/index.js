import express from 'express';

const router = express.Router();

/**
 * GET /api/bundle
 * 
 * Gets available bundles
 */
router.get('/', (req, res) => {
  res.json({
    bundles: [
      {
        id: '1',
        name: 'Starter Bundle',
        description: 'Perfect for getting started with basic features',
        price: 399,
        features: ['Email campaigns', 'Basic reporting']
      },
      {
        id: '2',
        name: 'Pro Bundle',
        description: 'Enhanced features for serious businesses',
        price: 799,
        features: ['Email campaigns', 'Advanced reporting', 'Social media integration']
      }
    ]
  });
});

/**
 * GET /api/bundle/:id
 * 
 * Gets details for a specific bundle
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    id,
    name: id === '1' ? 'Starter Bundle' : 'Pro Bundle',
    description: id === '1' 
      ? 'Perfect for getting started with basic features'
      : 'Enhanced features for serious businesses',
    price: id === '1' ? 399 : 799,
    features: id === '1' 
      ? ['Email campaigns', 'Basic reporting']
      : ['Email campaigns', 'Advanced reporting', 'Social media integration'],
    details: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  });
});

export default router;