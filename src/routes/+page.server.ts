import { RATE_LIMIT_SECRET } from '$env/static/private';
import { db } from '$lib/db.js';
import { clicks } from '$lib/schema.js';
import { sql } from 'drizzle-orm';
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

	const [avg, category_average] = await db.batch([
		db.select({ average_duration: sql<number>`AVG(duration)`, count: sql`COUNT(*)` }).from(clicks),
		db
			.select({
				pointer_type: clicks.pointer_type,
				average_duration: sql<number>`AVG(duration)`,
				count: sql<number>`COUNT(*)`,
			})
			.from(clicks)
			.groupBy(clicks.pointer_type),
	]);

	return { average: avg[0], category_average };
};

export const actions = {
	default: async (event) => {
		if (await limiter.isLimited(event)) {
			return { success: false, message: 'Rate limit exceeded' };
		}

		const formdata = await event.request.formData();
		const time = formdata.get('duration');
		const pointer_type = formdata.get('pointer-type');

		try {
			await db.insert(clicks).values({
				id: nanoid(15),
				duration: time,
				pointer_type: pointer_type,
			});

			return { success: true, message: 'Click recorded 🦄' };
		} catch {
			return { success: false, message: 'Failed to record click' };
		}
	},
};
