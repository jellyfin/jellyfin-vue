import { decode, isBlurhashValid } from 'blurhash';

const ctx: Worker = self as any;
ctx.addEventListener('message', event => {
    const data = event.data;
    if (isBlurhashValid(data.hash)) {
        const pixels = decode(data.hash, data.width, data.height);
        ctx.postMessage({ pixels });
    } else {
        throw TypeError('Blurhash is not valid');
    }
});
