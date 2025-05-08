import express from 'express';

const router = express.Router();

/**
 * GET /api/match
 * 
 * Gets match recommendations
 */
router.get('/', (req, res) => {
  res.json({
    matches: [
      {
        id: '1',
        name: 'Sample Match 1',
        score: 95,
        status: 'pending'
      },
      {
        id: '2',
        name: 'Sample Match 2',
        score: 87,
        status: 'pending'
      }
    ]
  });
});

/**
 * GET /api/match/:id
 * 
 * Gets details for a specific match
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    id,
    name: `Match ${id}`,
    score: Math.floor(Math.random() * 100),
    status: 'pending',
    details: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  });
});

export default router;