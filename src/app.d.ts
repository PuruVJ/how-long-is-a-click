declare module '*.svelte' {
	import { SvelteComponent } from 'svelte';
	const value: SvelteComponent;
	export default value;
}

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
