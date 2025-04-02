require('dotenv').config(); // loads environment variables, if using a .env file
const express = require('express');
const { Pool } = require('pg');

// 1) Create an Express app
const app = express();
app.use(express.json());

// 2) Connect to the Supabase Postgres DB using our secret
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// 3) A test route to verify everything works
app.get('/', async (req, res) => {
  try {
    // Just test a basic query: SELECT NOW()
    const result = await pool.query('SELECT NOW() as current_time');
    res.send(`Hello from Node.js! Current time: ${result.rows[0].current_time}`);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).send('Database connection failed.');
  }
});

// 4) Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
