import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class Database {
  private db: sqlite3.Database;
  private initialized: boolean = false;

  constructor() {
    const dbPath = process.env.NODE_ENV === 'production' 
      ? '/tmp/ecommerce.db'  // Use /tmp in production
      : './ecommerce.db';    // Use local path in development
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      }
    });
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    this.initialized = true;
    
    try {
      // Create users table
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create products table
      await this.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          category TEXT NOT NULL,
          image_url TEXT,
          stock INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create cart table
      await this.run(`
        CREATE TABLE IF NOT EXISTS cart (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (product_id) REFERENCES products (id),
          UNIQUE(user_id, product_id)
        )
      `);

      // Insert sample products
      await this.insertSampleData();
      this.initialized = true;
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  private async insertSampleData() {
    const get = promisify(this.db.get.bind(this.db));


    // Check if products already exist
    const existingProduct = await get('SELECT id FROM products LIMIT 1');
    if (existingProduct) return;

    const sampleProducts = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 199.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        stock: 50
      },
      {
        name: 'Smart Watch',
        description: 'Feature-rich smartwatch with health monitoring',
        price: 299.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        stock: 30
      },
      {
        name: 'Coffee Maker',
        description: 'Automatic coffee maker with programmable settings',
        price: 89.99,
        category: 'Home & Kitchen',
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        stock: 25
      },
      {
        name: 'Running Shoes',
        description: 'Comfortable running shoes for all terrains',
        price: 129.99,
        category: 'Sports',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        stock: 40
      },
      {
        name: 'Laptop Backpack',
        description: 'Durable laptop backpack with multiple compartments',
        price: 59.99,
        category: 'Accessories',
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        stock: 35
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable Bluetooth speaker with excellent sound quality',
        price: 79.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        stock: 60
      }
    ];

    for (const product of sampleProducts) {
      await this.run(
        'INSERT INTO products (name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)',
        [product.name, product.description, product.price, product.category, product.image_url, product.stock]
      );
    }
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T | null);
      });
    });
  }

  async run(sql: string, params: unknown[] = []): Promise<{ id: number; changes: number }> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
}

export const db = new Database();