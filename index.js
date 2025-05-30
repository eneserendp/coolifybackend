const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// CORS ayarları
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// PostgreSQL bağlantısı
const pool = new Pool({
  connectionString: 'postgresql://deneme_user:GizliSifre123@193.111.125.236:5432/deneme'
});

// Bağlantı kontrolü
pool.on('connect', () => {
  console.log('Veritabanına bağlantı başarılı');
});

// Tablo oluşturma
const createTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL
      )
    `;
    await pool.query(createTableQuery);
    console.log('Tablo başarıyla oluşturuldu');
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Kullanıcı ekleme endpoint'i
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    console.log('Yeni kullanıcı eklendi:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Kullanıcı ekleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcıları getirme endpoint'i
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Server başlatma
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  await createTable();
});

// Global hata yakalama
process.on('unhandledRejection', (error) => {
  console.error('Beklenmeyen hata:', error);
});
