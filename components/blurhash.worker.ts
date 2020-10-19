import { decode } from 'blurhash';

const ctx: Worker = self as any;
ctx.addEventListener('message', event => {
    const data = event.data;
    const pixels = decode(data.hash, data.width, data.height);
    ctx.postMessage({ pixels });
});
