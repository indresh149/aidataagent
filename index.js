import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { formatQuery } from './utils/sqlFormatter.js';
import { generateResponse } from './services/agent.js';
import { initializeDatabase } from './utils/databaseInitializer.js';

// Ensure the data directory exists
const dbPath = './server/data/analytics.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3001;

// Set up middleware
app.use(cors({
  origin: 'https://aidataagentweb.vercel.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to SQLite database
const db = new Database(dbPath, {
  verbose: console.log
});
db.pragma('journal_mode = WAL');

// Initialize the database
initializeDatabase(db);

// Routes
app.post('/api/query', async (req, res) => {
  try {
    const { query, history } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    console.log('Received query:', query);
    
    // Generate response using our agent service
    const response = await generateResponse(query, history, db);
    
    return res.json(response);
  } catch (error) {
    console.error('Error processing query:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your query',
      details: error.message
    });
  }
});

// Get schema information
app.get('/api/schema', (req, res) => {
  try {
    // Get all tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const schema = {};
    
    // Get columns for each table
    tables.forEach(table => {
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
      schema[table.name] = columns.map(column => ({
        name: column.name,
        type: column.type,
        notnull: column.notnull === 1,
        dflt_value: column.dflt_value,
        pk: column.pk === 1
      }));
    });
    
    return res.json(schema);
  } catch (error) {
    console.error('Error fetching schema:', error);
    return res.status(500).json({ error: 'Failed to fetch database schema' });
  }
});

// Execute raw SQL query (for development/testing only)
app.post('/api/execute', (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }
    
    console.log('Executing SQL:', sql);
    
    const formattedSql = formatQuery(sql);
    let result;
    
    // Check if it's a SELECT query
    if (formattedSql.trim().toLowerCase().startsWith('select')) {
      result = db.prepare(formattedSql).all();
    } else {
      // For non-SELECT queries, run them
      const statement = db.prepare(formattedSql);
      result = statement.run();
    }
    
    return res.json({
      result,
      query: formattedSql
    });
  } catch (error) {
    console.error('Error executing SQL:', error);
    return res.status(500).json({ 
      error: 'Error executing SQL query',
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});