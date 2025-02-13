
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from '../config/app.config';

const sql = neon(config.DATABASE_URL)

export const db = drizzle({client: sql});
