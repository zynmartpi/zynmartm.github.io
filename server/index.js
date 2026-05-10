const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { LowSync } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup (using lowdb for local JSON storage)
const adapter = new JSONFileSync('db.json');
const db = new LowSync(adapter);
db.read();
db.data ||= { users: [], products: [], orders: [], transactions: [], promocodes: [] };

// API Routes
app.get('/', (req, res) => {
  res.send('ZYNMART Local Server Running');
});

// Users
app.get('/api/users/:id', (req, res) => {
  const user = db.data.users.find((u) => u.id === req.params.id);
  if (user) res.json(user);
  else res.status(404).send('User not found');
});

app.post('/api/users', (req, res) => {
  const { id } = req.body;
  const idx = db.data.users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    db.data.users[idx] = { ...db.data.users[idx], ...req.body };
  } else {
    db.data.users.push(req.body);
  }
  db.write();
  res.json({ success: true });
});

// Products
app.get('/api/products', (req, res) => {
  res.json(db.data.products);
});

// Orders
app.get('/api/orders', (req, res) => {
  const { userId } = req.query;
  if (userId) {
    res.json(db.data.orders.filter((o) => o.userId === userId));
  } else {
    res.json(db.data.orders);
  }
});

app.post('/api/orders', (req, res) => {
  const newOrder = { ...req.body, id: Date.now().toString() };
  db.data.orders.push(newOrder);
  db.write();
  res.json(newOrder);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`To use with Pi Browser, run: ngrok http ${PORT}`);
});
