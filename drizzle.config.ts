import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const { DB_URL, DB_TOKEN, PROD } = process.env;

const is_prod = PROD === '1';

export default {
	schema: './src/lib/schema.ts',
	out: './migrations',
	driver: 'turso',
	dbCredentials: {
		url: is_prod ? DB_URL ?? '' : 'file:./db.sqlite',
		authToken: is_prod ? DB_TOKEN ?? '' : undefined,
	},
} satisfies Config;
