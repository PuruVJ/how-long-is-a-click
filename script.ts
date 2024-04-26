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

	const mouse_clicks = query.filter((row) => row.pointer_type === 0);
	const touch_clicks = query.filter((row) => row.pointer_type === 1);
	const pen_clicks = query.filter((row) => row.pointer_type === 2);

	// Calculate the average duration of mouse clicks
	const mouse_average =
		mouse_clicks.reduce((acc, row) => acc + row.duration, 0) / mouse_clicks.length;

	// Calculate the average duration of touch clicks
	const touch_average =
		touch_clicks.reduce((acc, row) => acc + row.duration, 0) / touch_clicks.length;

	// Calculate the average duration of pen clicks
	const pen_average = pen_clicks.reduce((acc, row) => acc + row.duration, 0) / pen_clicks.length;

	await tx
		.update(schema.stats_table)
		.set({
			average_duration: mouse_average,
			count: mouse_clicks.length,
		})
		.where(eq(schema.stats_table.type, 0));

	await tx
		.update(schema.stats_table)
		.set({
			average_duration: touch_average,
			count: touch_clicks.length,
		})
		.where(eq(schema.stats_table.type, 1));

	await tx
		.update(schema.stats_table)
		.set({
			average_duration: pen_average,
			count: pen_clicks.length,
		})
		.where(eq(schema.stats_table.type, 2));
});
