import Comp from './Comp.svelte';
import { read } from '$app/server';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { html as toReactNode } from 'satori-html';
import sourceSerifPro from './Satoshi-Bold.ttf';
import { get_stats } from '$lib/server/stats';

const fontData = read(sourceSerifPro).arrayBuffer();

export async function GET() {
	const width = 1200;
	const height = 600;

	const result = Comp.render({ data: await get_stats() });
	const markup = toReactNode(`${result.html}<style>${result.css.code}</style>`);
	const svg = await satori(markup, {
		fonts: [
			{
				name: 'Satoshi',
				data: await fontData,
				style: 'normal',
			},
		],
		height: +height,
		width: +width,
	});

	const resvg = new Resvg(svg, {
		fitTo: {
			mode: 'width',
			value: +width,
		},
	});

	const png = resvg.render();

	return new Response(png.asPng(), {
		headers: {
			'content-type': 'image/png',
		},
	});
}
