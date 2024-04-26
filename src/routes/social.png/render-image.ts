import { read } from '$app/server';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { html as toReactNode } from 'satori-html';
import type { SvelteComponent } from 'svelte';
import sourceSerifPro from './SatoshiVariable.ttf';

const fontData = read(sourceSerifPro).arrayBuffer();

export async function componentToPng<T extends Record<string, any>>(
	component: SvelteComponent<T>,
	props: T,
	height: number,
	width: number
) {
	const result = component.render(props);
	const markup = toReactNode(`${result.html}<style>${result.css.code}</style>`);
	const svg = await satori(markup, {
		fonts: [
			{
				name: 'Source Serif Pro',
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
