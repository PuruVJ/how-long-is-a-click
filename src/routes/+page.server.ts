import { dev } from '$app/environment';
import { RATE_LIMIT_SECRET } from '$env/static/private';
import { db } from '$lib/db.js';
import { clicks, stats_table } from '$lib/schema.js';
import { count, eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { RateLimiter } from 'sveltekit-rate-limiter/server';

const pointer_types = ['mouse', 'touch', 'pen', 'eraser', 'other'];

const limiter = new RateLimiter({
	// A rate is defined as [number, unit]
	IP: [1000, 'd'], // IP address limiter
	IPUA: [100, 'h'], // IP + User Agent limiter
	cookie: {
		// Cookie limiter
		name: 'limiterid', // Unique cookie name for this limiter
		secret: RATE_LIMIT_SECRET, // Use $env/static/private
		rate: [10, 'm'],
		preflight: true, // Require preflight call (see load function)
	},
});

export const load = async (event) => {
	await limiter.cookieLimiter?.preflight(event);

	const data = await db.select().from(stats_table);

	let average_duration_sum = 0;
	let total_count = 0;
	for (const row of data) {
		average_duration_sum += row.count * row.average_duration;
		total_count += row.count;
	}

	return {
		rows: [
			{
				type: 'all',
				average_duration: Math.floor(average_duration_sum / total_count),
				count: total_count,
			},
			...data.map((r) => ({ ...r, type: pointer_types[r.type] })),
		],
	};
};

export const actions = {
	default: async (event) => {
		if (!dev && (await limiter.isLimited(event))) {
			return { success: false, message: 'Rate limit exceeded' };
		}

		const formdata = await event.request.formData();
		const duration = formdata.get('duration')?.toString();
		const pointer_type = formdata.get('pointer-type')?.toString();

		if (!duration || !pointer_type)
			return {
				success: false,
				message: 'Missing required fields',
			};

		if (+duration > 1000 || +duration < 0) {
			return {
				success: false,
				message: 'Who clicks for more than a second? 🤔',
			};
		}

		const pointer_type_num =
			(pointer_types.indexOf(pointer_type!) + pointer_types.length) % pointer_types.length;

		try {
			console.time('txn');
			await db.batch([
				db.insert(clicks).values({
					id: ulid(Date.now()),
					duration: +duration,
					pointer_type: +pointer_type_num,
				}),

				// Now update the row whose type is point_type, then update that too
				db
					.insert(stats_table)
					.values({
						type: pointer_type_num,
						average_duration: +duration,
						count: 1,
					})
					.onConflictDoUpdate({
						target: stats_table.type,
						set: {
							average_duration: sql<number>`floor((average_duration * count + ${duration}) / (count + 1))`,
							count: sql<number>`count + 1`,
						},
						setWhere: eq(stats_table.type, pointer_type_num),
					}),
			]);
			console.timeEnd('txn');

			return { success: true, message: 'Click recorded 🦄' };
		} catch (e) {
			console.log(e);
			return { success: false, message: 'Failed to record click' };
		}
	},
};
