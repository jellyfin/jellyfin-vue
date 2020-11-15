import { decode, isBlurhashValid } from 'blurhash';

const ctx: Worker = self as never;
onmessage = function (event) {
  const data = event.data;
  if (isBlurhashValid(data.hash)) {
    const pixels = decode(data.hash, data.width, data.height);
    ctx.postMessage({ pixels, hash: data.hash });
  } else {
    throw new TypeError('Blurhash is not valid');
  }
};
