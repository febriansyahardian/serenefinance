const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (in production, use a database)
let wishlists = [];
let savings = [];
let moneyEntries = [];

// Helper functions
const calculateWishlistProgress = (wishlistId) => {
  const wishlistSavings = savings.filter(s => s.wishlistId === wishlistId);
  const totalSaved = wishlistSavings.reduce((sum, saving) => sum + saving.amount, 0);
  return totalSaved;
};

const calculateTotalAvailableMoney = () => {
  const totalIncome = moneyEntries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  const totalExpenses = moneyEntries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  const totalSavings = moneyEntries
    .filter(entry => entry.type === 'saving')
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  return totalIncome - totalExpenses - totalSavings;
};

// Routes

// Wishlists
app.get('/api/wishlists', (req, res) => {
  const wishlistsWithProgress = wishlists.map(wishlist => ({
    ...wishlist,
    totalSaved: calculateWishlistProgress(wishlist.id),
    progress: (calculateWishlistProgress(wishlist.id) / wishlist.price) * 100
  }));
  res.json(wishlistsWithProgress);
});

app.post('/api/wishlists', (req, res) => {
  const { name, price, description } = req.body;
  const wishlist = {
    id: uuidv4(),
    name,
    price: parseFloat(price),
    description: description || '',
    createdAt: new Date().toISOString()
  };
  wishlists.push(wishlist);
  res.status(201).json(wishlist);
});

app.put('/api/wishlists/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  const wishlistIndex = wishlists.findIndex(w => w.id === id);
  
  if (wishlistIndex === -1) {
    return res.status(404).json({ error: 'Wishlist not found' });
  }
  
  wishlists[wishlistIndex] = {
    ...wishlists[wishlistIndex],
    name,
    price: parseFloat(price),
    description: description || ''
  };
  
  res.json(wishlists[wishlistIndex]);
});

app.delete('/api/wishlists/:id', (req, res) => {
  const { id } = req.params;
  const wishlistIndex = wishlists.findIndex(w => w.id === id);
  
  if (wishlistIndex === -1) {
    return res.status(404).json({ error: 'Wishlist not found' });
  }
  
  // Remove associated savings
  savings = savings.filter(s => s.wishlistId !== id);
  wishlists.splice(wishlistIndex, 1);
  
  res.status(204).send();
});

// Savings
app.get('/api/savings', (req, res) => {
  res.json(savings);
});

app.post('/api/savings', (req, res) => {
  const { wishlistId, amount, description } = req.body;
  const saving = {
    id: uuidv4(),
    wishlistId,
    amount: parseFloat(amount),
    description: description || '',
    createdAt: new Date().toISOString()
  };
  savings.push(saving);
  res.status(201).json(saving);
});

app.delete('/api/savings/:id', (req, res) => {
  const { id } = req.params;
  const savingIndex = savings.findIndex(s => s.id === id);
  
  if (savingIndex === -1) {
    return res.status(404).json({ error: 'Saving not found' });
  }
  
  savings.splice(savingIndex, 1);
  res.status(204).send();
});

// Money Entries
app.get('/api/money-entries', (req, res) => {
  res.json(moneyEntries);
});

app.post('/api/money-entries', (req, res) => {
  const { type, amount, description, category } = req.body;
  const entry = {
    id: uuidv4(),
    type,
    amount: parseFloat(amount),
    description: description || '',
    category: category || '',
    createdAt: new Date().toISOString()
  };
  moneyEntries.push(entry);
  res.status(201).json(entry);
});

app.put('/api/money-entries/:id', (req, res) => {
  const { id } = req.params;
  const { type, amount, description, category } = req.body;
  const entryIndex = moneyEntries.findIndex(e => e.id === id);
  
  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  
  moneyEntries[entryIndex] = {
    ...moneyEntries[entryIndex],
    type,
    amount: parseFloat(amount),
    description: description || '',
    category: category || ''
  };
  
  res.json(moneyEntries[entryIndex]);
});

app.delete('/api/money-entries/:id', (req, res) => {
  const { id } = req.params;
  const entryIndex = moneyEntries.findIndex(e => e.id === id);
  
  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  
  moneyEntries.splice(entryIndex, 1);
  res.status(204).send();
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const totalWishlistValue = wishlists.reduce((sum, w) => sum + w.price, 0);
  const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);
  const availableMoney = calculateTotalAvailableMoney();
  
  const totalIncome = moneyEntries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  const totalExpenses = moneyEntries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  const wishlistsWithProgress = wishlists.map(wishlist => ({
    ...wishlist,
    totalSaved: calculateWishlistProgress(wishlist.id),
    progress: (calculateWishlistProgress(wishlist.id) / wishlist.price) * 100
  }));
  
  res.json({
    wishlists: wishlistsWithProgress,
    totalWishlistValue,
    totalSaved,
    availableMoney,
    totalIncome,
    totalExpenses,
    moneyEntries: moneyEntries.slice(-10) // Last 10 entries
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
