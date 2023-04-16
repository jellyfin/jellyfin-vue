import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { isEdgeUWP, isFirefox, isPs4, isTv, isXbox } from './browser-detection';

export interface DownloadableFile {
  // The file URL
  url: string;
  // The filename, including the file extension
  fileName: string;
}

/**
 * Check if the url is on the same domain as the current page.
 *
 * @param url - The url to check.
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
 *
 * @param file - An object with `url` and `fileName` properties.
 */
function downloadBrowser(file: DownloadableFile): void {
  const a = document.createElement('a');

  a.download = file.fileName;
  a.href = file.url;
  // firefox doesn't support `a.click()`...
  a.dispatchEvent(new MouseEvent('click'));
}

/**
 * Check if the browser are able to download the item.
 *
 * @param item - The item to check.
 */
export function canBrowserDownloadItem(item: BaseItemDto): boolean {
  return (
    !isEdgeUWP() && !isTv() && !isXbox() && !isPs4() && item.Type !== 'Book'
  );
}

/**
 * Download multiple files.
 *
 * @param filesToDownload - An array of objects with `url` and `fileName` properties.
 */
export async function downloadFiles(
  filesToDownload: DownloadableFile | DownloadableFile[]
): Promise<void> {
  if (!filesToDownload) {
    throw new Error('`filesToDownload` required');
  }

  const files = Array.isArray(filesToDownload)
    ? filesToDownload
    : [filesToDownload];

  if (files.length === 0) {
    throw new Error(
      '`filesToDownload` must be an array with at least one item'
    );
  }

  if (document.createElement('a').download === undefined) {
    throw new Error('Browser does not support downloading files');
  }

  let delay = 0;

  for (const file of files) {
    if (isFirefox() && !sameDomain(file.url)) {
      // the download init has to be sequential for firefox if the urls are not on the same domain
      setTimeout(downloadBrowser.bind(undefined, file), 100 * ++delay);
    } else {
      downloadBrowser(file);
    }
  }
}
