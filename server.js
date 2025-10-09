const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
// Supabase integration disabled
const supabase = null;
async function supabaseExec() { /* no-op */ }

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
  const { name, price, description, image } = req.body;
  const wishlist = {
    id: uuidv4(),
    name,
    price: parseFloat(price),
    description: description || '',
    image: image || '',
    createdAt: new Date().toISOString()
  };
  wishlists.push(wishlist);
  // supabase disabled
  res.status(201).json(wishlist);
});

app.put('/api/wishlists/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, description, image } = req.body;
  const wishlistIndex = wishlists.findIndex(w => w.id === id);
  
  if (wishlistIndex === -1) {
    return res.status(404).json({ error: 'Wishlist not found' });
  }
  
  wishlists[wishlistIndex] = {
    ...wishlists[wishlistIndex],
    name,
    price: parseFloat(price),
    description: description || '',
    image: image || ''
  };
  
  res.json(wishlists[wishlistIndex]);
  // supabase disabled
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
  // supabase disabled
});

// Savings
app.get('/api/savings', (req, res) => {
  res.json(savings);
});

app.post('/api/savings', (req, res) => {
  const { wishlistId, amount, note } = req.body;
  const parsedAmount = parseFloat(amount);

  // Validate wishlist exists
  const wishlist = wishlists.find(w => w.id === wishlistId);
  if (!wishlist) {
    return res.status(400).json({ error: 'Wishlist not found' });
  }

  // Funds validation against available money
  const available = calculateTotalAvailableMoney();
  if (parsedAmount > available) {
    return res.status(400).json({ error: 'Insufficient funds for saving', available, requested: parsedAmount });
  }

  const now = new Date().toISOString();
  const saving = {
    id: uuidv4(),
    wishlistId,
    amount: parsedAmount,
    note: note || '',
    date: now,
    // keep legacy fields for compatibility
    description: note || '',
    createdAt: now
  };
  savings.push(saving);

  // Also record as a money entry of type 'saving' so history and available funds align
  moneyEntries.push({
    id: uuidv4(),
    type: 'saving',
    amount: parsedAmount,
    category: 'Saving',
    note: note || '',
    date: now,
    // legacy fields
    description: note || '',
    createdAt: now
  });
  res.status(201).json(saving);
  // supabase disabled
});

app.delete('/api/savings/:id', (req, res) => {
  const { id } = req.params;
  const savingIndex = savings.findIndex(s => s.id === id);
  
  if (savingIndex === -1) {
    return res.status(404).json({ error: 'Saving not found' });
  }
  
  savings.splice(savingIndex, 1);
  res.status(204).send();
  // supabase disabled
});

// Savings history by wishlist
app.get('/api/savings/wishlist/:wishlistId', (req, res) => {
  const { wishlistId } = req.params;
  const result = savings
    .filter(s => s.wishlistId === wishlistId)
    .map(s => ({ id: s.id, amount: s.amount, note: s.note || s.description || '', date: s.date || s.createdAt }));
  res.json(result);
});

// Money Entries
app.get('/api/money-entries', (req, res) => {
  // Ensure responses include note/date for frontend
  const result = moneyEntries.map(e => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    category: e.category || '',
    note: e.note || e.description || '',
    date: e.date || e.createdAt
  }));
  res.json(result);
});

app.post('/api/money-entries', (req, res) => {
  const { type, amount, note, description, category, date } = req.body;
  const parsedAmount = parseFloat(amount);

  if (!type || !parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid entry' });
  }

  // Funds validation for expenses
  if (type === 'expense') {
    const available = calculateTotalAvailableMoney();
    if (parsedAmount > available) {
      return res.status(400).json({ error: 'Insufficient funds', available, requested: parsedAmount });
    }
  }

  const entry = {
    id: uuidv4(),
    type,
    amount: parsedAmount,
    category: category || '',
    note: note || description || '',
    date: date || new Date().toISOString(),
    // legacy fields
    description: note || description || '',
    createdAt: date || new Date().toISOString()
  };
  moneyEntries.push(entry);
  res.status(201).json({
    id: entry.id,
    type: entry.type,
    amount: entry.amount,
    category: entry.category,
    note: entry.note,
    date: entry.date
  });
  // supabase disabled
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
