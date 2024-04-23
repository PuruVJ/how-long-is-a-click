import { createClient } from '@libsql/client';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/lib/schema';
import { eq } from 'drizzle-orm';

const { DB_TOKEN, DB_URL } = process.env;

const libsql_client = createClient({
	url: DB_URL!,
	authToken: DB_TOKEN,
});

const db = drizzle(libsql_client, { schema });

// Write a query to read from clicks, make aggregates based on the type column, then merge them with existing
// stats table data.

await db.transaction(async (tx) => {
	const query = await db.select().from(schema.clicks).all();

	const mouse_clicks = query.filter((row) => row.pointer_type === 'mouse');
	const touch_clicks = query.filter((row) => row.pointer_type === 'touch');

	// Calculate the average duration of mouse clicks
	const mouse_average =
		mouse_clicks.reduce((acc, row) => acc + row.duration, 0) / mouse_clicks.length;

	// Calculate the average duration of touch clicks
	const touch_average =
		touch_clicks.reduce((acc, row) => acc + row.duration, 0) / touch_clicks.length;

	await tx
		.update(schema.stats_table)
		.set({
			average_duration: mouse_average,
			count: mouse_clicks.length,
		})
		.where(eq(schema.stats_table.type, 'mouse'));

	await tx
		.update(schema.stats_table)
		.set({
			average_duration: touch_average,
			count: touch_clicks.length,
		})
		.where(eq(schema.stats_table.type, 'touch'));

	// Also set type === 'all' to the average of all clicks
	const all_average = query.reduce((acc, row) => acc + row.duration, 0) / query.length;
	await tx
		.update(schema.stats_table)
		.set({
			average_duration: all_average,
			count: query.length,
		})
		.where(eq(schema.stats_table.type, 'all'));
});
