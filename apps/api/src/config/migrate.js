import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const { Client } = pg;

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  
  try {
    const migrationsDir = path.join(__dirname, '../../../../db/migrations'); // Adjust path based on project root
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).sort();
      for (const file of files) {
        if (file.endsWith('.sql')) {
          console.log(`Running migration: ${file}`);
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
          await client.query(sql);
        }
      }
      console.log('Migrations complete');
    } else {
      console.log('No migrations folder found at', migrationsDir);
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
