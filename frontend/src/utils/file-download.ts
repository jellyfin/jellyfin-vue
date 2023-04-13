// https://github.com/noaione/jellyfin-web/blob/nao/src/scripts/multiDownload.js

import { isFirefox } from './browser-detection';

/**
 * Download a file using a hidden iframe.
 */
function fallbackIframeDownloader(urls: string[]): void {
  let i = 0;

  (function _createIframeDownloader(): void {
    const frame = document.createElement('iframe');

    frame.style.display = 'none';
    frame.src = urls[i++];
    document.documentElement.append(frame);

    const interval = setInterval(() => {
      if (
        frame.contentWindow?.document.readyState === 'complete' ||
        frame.contentWindow?.document.readyState === 'interactive'
      ) {
        clearInterval(interval);
        setTimeout(() => {
          frame.remove();
        });

        if (i < urls.length) {
          _createIframeDownloader();
        }
      }
    }, 100);
  })();
}

/**
 * Check if the url is on the same domain as the current page.
 */
function sameDomain(url: string): boolean {
  const a = document.createElement('a');

  a.href = url;

  return (
    window.location.hostname === a.hostname &&
    window.location.protocol === a.protocol
  );
}

/**
 * Use html <a> tag to download a file.
 */
function download(url: string): void {
  const a = document.createElement('a');

  a.download = '';
  a.href = url;
  // firefox doesn't support `a.click()`...
  a.dispatchEvent(new MouseEvent('click'));
}

/**
 * Download multiple files.
 */
export default function downloadFiles(urlOrUrls: string | string[]): void {
  if (!urlOrUrls) {
    throw new Error('`urlOrUrls` required');
  }

  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];

  if (document.createElement('a').download === undefined) {
    return fallbackIframeDownloader(urls);
  }

  let delay = 0;

  for (const url of urls) {
    // the download init has to be sequential for firefox if the urls are not on the same domain
    if (isFirefox() && !sameDomain(url)) {
      setTimeout(download.bind(undefined, url), 100 * ++delay);
      continue;
    }

    download(url);
  }
}
