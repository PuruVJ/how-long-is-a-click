import { dev } from '$app/environment';
import { RATE_LIMIT_SECRET } from '$env/static/private';
import { db } from '$lib/db.js';
import { clicks, stats_table } from '$lib/schema.js';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { RateLimiter } from 'sveltekit-rate-limiter/server';

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

	return { rows: data };
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

		try {
			console.time('txn');
			await db.transaction(async (tx) => {
				await tx.insert(clicks).values({
					// @ts-expect-error I dont know why this is erroring
					id: nanoid(15),
					duration,
					pointer_type,
				});

				// Update all stats
				await tx
					.insert(stats_table)
					.values({
						type: 'all',
						average_duration: +duration?.toString()!,
						count: 1,
					})
					.onConflictDoUpdate({
						target: stats_table.type,
						set: {
							average_duration: sql<number>`(average_duration * count + ${duration}) / (count + 1)`,
							count: sql<number>`count + 1`,
						},
						setWhere: eq(stats_table.type, 'all'),
					});

				// Now update the row whose type is point_type, then update that too
				await tx
					.insert(stats_table)
					.values({
						type: pointer_type?.toString()!,
						average_duration: +duration?.toString()!,
						count: 1,
					})
					.onConflictDoUpdate({
						target: stats_table.type,
						set: {
							average_duration: sql<number>`(average_duration * count + ${duration}) / (count + 1)`,
							count: sql<number>`count + 1`,
						},
						setWhere: eq(stats_table.type, pointer_type?.toString()!),
					});
			});
			console.timeEnd('txn');

			return { success: true, message: 'Click recorded 🦄' };
		} catch (e) {
			console.log(e);
			return { success: false, message: 'Failed to record click' };
		}
	},
};
