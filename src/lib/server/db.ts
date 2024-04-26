import { dev } from '$app/environment';
import { DB_TOKEN, DB_URL } from '$env/static/private';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export const libsql_client = createClient({
	url: dev ? 'file:./db.sqlite' : `${DB_URL}`,
	authToken: DB_TOKEN,
});

export const db = drizzle(libsql_client, { schema });
