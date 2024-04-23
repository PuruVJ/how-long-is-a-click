import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.Dxat8iL_.js","_app/immutable/chunks/scheduler.Dxh7RUl2.js","_app/immutable/chunks/index.DoRAvCSG.js","_app/immutable/chunks/Toaster.svelte_svelte_type_style_lang.lV58C8Wx.js","_app/immutable/chunks/index.Cqf3cM5M.js","_app/immutable/chunks/entry.CXLUh8pS.js"];
export const stylesheets = ["_app/immutable/assets/2.CjLyvlLs.css","_app/immutable/assets/Toaster.CLpmFrbv.css"];
export const fonts = [];
