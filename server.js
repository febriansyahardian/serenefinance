require('dotenv').config(); // Untuk membaca file .env di lokal
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Membulatkan angka (menghindari bug desimal JS)
const sanitizeAmount = (amount) => Math.round(parseFloat(amount) * 100) / 100;

// Helper: Kalkulasi sisa uang aktif dari DB
const getAvailableMoney = async () => {
  const { data, error } = await supabase.from('money_entries').select('type, amount');
  if (error || !data) return 0;
  
  const totalIncome = data.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = data.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const totalSavings = data.filter(e => e.type === 'saving').reduce((sum, e) => sum + e.amount, 0);
  
  return sanitizeAmount(totalIncome - totalExpenses - totalSavings);
};

/* ================= ROUTES: WISHLIST ================= */

app.get('/api/wishlists', async (req, res) => {
  const { data: wishlists, error: wError } = await supabase.from('wishlists').select('*');
  const { data: savings, error: sError } = await supabase.from('savings').select('wishlistId, amount');
  
  if (wError) return res.status(500).json({ error: wError.message });
  
  const wishlistsWithProgress = (wishlists || []).map(wishlist => {
    const wishlistSavings = (savings || []).filter(s => s.wishlistId === wishlist.id);
    const totalSaved = sanitizeAmount(wishlistSavings.reduce((sum, s) => sum + s.amount, 0));
    
    return {
      ...wishlist,
      totalSaved,
      progress: Math.min((totalSaved / wishlist.price) * 100, 100)
    };
  });
  
  res.json(wishlistsWithProgress);
});

app.post('/api/wishlists', async (req, res) => {
  const { name, price, description, image } = req.body;
  if (!name || isNaN(price) || price <= 0) return res.status(400).json({ error: 'Input tidak valid' });

  const wishlist = {
    id: uuidv4(),
    name: name.trim(),
    price: sanitizeAmount(price),
    description: description ? description.trim() : '',
    image: image ? image.trim() : '',
    createdAt: new Date().toISOString()
  };

  const { data, error } = await supabase.from('wishlists').insert([wishlist]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.put('/api/wishlists/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, description, image } = req.body;
  
  const { data, error } = await supabase.from('wishlists').update({
    name: name.trim(),
    price: sanitizeAmount(price),
    description: description ? description.trim() : '',
    image: image ? image.trim() : ''
  }).eq('id', id).select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/wishlists/:id', async (req, res) => {
  const { id } = req.params;
  await supabase.from('savings').delete().eq('wishlistId', id); // Hapus relasi tabungan
  const { error } = await supabase.from('wishlists').delete().eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

/* ================= ROUTES: SAVINGS ================= */

app.get('/api/savings', async (req, res) => {
  const { data, error } = await supabase.from('savings').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/savings', async (req, res) => {
  const { wishlistId, amount, note } = req.body;
  const parsedAmount = sanitizeAmount(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'Jumlah tidak valid' });

  const { data: wishlist } = await supabase.from('wishlists').select('id, name').eq('id', wishlistId).single();
  if (!wishlist) return res.status(404).json({ error: 'Wishlist tidak ditemukan' });

  const available = await getAvailableMoney();
  if (parsedAmount > available) {
    return res.status(400).json({ error: 'Dana tidak mencukupi', available, requested: parsedAmount });
  }

  const now = new Date().toISOString();
  
  const savingEntry = {
    id: uuidv4(),
    wishlistId,
    amount: parsedAmount,
    note: note ? note.trim() : '',
    date: now,
    createdAt: now
  };

  const moneyEntry = {
    id: uuidv4(),
    type: 'saving',
    amount: parsedAmount,
    category: 'Saving',
    note: note ? note.trim() : `Saving for ${wishlist.name}`,
    date: now,
    createdAt: now
  };

  // Simpan ke dua tabel secara paralel
  await Promise.all([
    supabase.from('savings').insert([savingEntry]),
    supabase.from('money_entries').insert([moneyEntry])
  ]);

  res.status(201).json(savingEntry);
});

/* ================= ROUTES: MONEY ENTRIES ================= */

app.get('/api/money-entries', async (req, res) => {
  const { data, error } = await supabase.from('money_entries').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/money-entries', async (req, res) => {
  const { type, amount, note, description, category, date } = req.body;
  const parsedAmount = sanitizeAmount(amount);

  if (!['income', 'expense'].includes(type) || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Input transaksi tidak valid' });
  }

  if (type === 'expense') {
    const available = await getAvailableMoney();
    if (parsedAmount > available) {
      return res.status(400).json({ error: 'Dana tidak mencukupi', available, requested: parsedAmount });
    }
  }

  const entry = {
    id: uuidv4(),
    type,
    amount: parsedAmount,
    category: category ? category.trim() : 'Other',
    note: (note || description || '').trim(),
    date: date || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('money_entries').insert([entry]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.delete('/api/money-entries/:id', async (req, res) => {
  const { error } = await supabase.from('money_entries').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

/* ================= ROUTES: DASHBOARD ================= */

app.get('/api/dashboard', async (req, res) => {
  const availableMoney = await getAvailableMoney();
  
  const { data: entries } = await supabase.from('money_entries').select('*');
  const { data: savingsData } = await supabase.from('savings').select('amount');
  
  const totalIncome = sanitizeAmount((entries || []).filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0));
  const totalExpenses = sanitizeAmount((entries || []).filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0));
  const totalSaved = sanitizeAmount((savingsData || []).reduce((sum, s) => sum + s.amount, 0));

  res.json({
    availableMoney,
    totalIncome,
    totalExpenses,
    totalSaved,
    moneyEntries: (entries || []).slice(-10) // 10 transaksi terakhir
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log
