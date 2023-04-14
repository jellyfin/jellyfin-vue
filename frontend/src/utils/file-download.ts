// https://github.com/jellyfin/jellyfin-web/blob/master/src/scripts/multiDownload.js

import { save } from '@tauri-apps/api/dialog';
import { join } from '@tauri-apps/api/path';
import { exists, renameFile } from '@tauri-apps/api/fs';
import { download } from 'tauri-plugin-upload-api';
import { isFirefox, isTauri } from './browser-detection';
import { taskManagerStore } from '@/store';
import { RunningTask, TaskType } from '@/store/taskManager';

export interface DownloadableFile {
  // The file URL
  url: string;
  // The filename, including the file extension
  fileName: string;
}

/**
 * Download files using Tauri API.
 * https://github.com/tauri-apps/tauri/discussions/1579
 *
 * @param files - An array of objects with `url` and `fileName` properties.
 */
async function downloadWithTauri(files: DownloadableFile[]): Promise<void> {
  if (!isTauri()) {
    return;
  }

  const saveDir = await save({
    filters: [
      {
        name: 'All Files',
        extensions: ['*']
      }
    ]
  });

  if (saveDir === null) {
    return;
  }

  const taskManager = taskManagerStore();
  const currentTime = Date.now();

  for (const file of files) {
    const dmId = `dm-${file.fileName}_${currentTime}`;

    const runTask: RunningTask = {
      type: TaskType.FileDownload,
      id: dmId,
      data: `Downloading file '${file.fileName}'...`
    };

    // Stream the file to destination, also utilize callback.
    let progress = 0;

    taskManager.startTask({
      ...runTask,
      progress
    });

    const downloadPath = await join(saveDir, file.fileName);

    try {
      await download(file.url, downloadPath, (curent, total) => {
        progress = Math.floor((curent / total) * 100);
        taskManager.updateTask({
          ...runTask,
          // Floor the progress to avoid floating point errors.
          progress
        });
      });
    } catch (error) {
      console.error(error);

      // TODO: Error task announcement
      // taskManager.failureTask({
      //   ...runTask,
      //   error: `Failed to download file '${file.fileName}'`,
      //   progress
      // });

      // XXX: Maybe just delete the file instead of renaming it to .tmp?
      const tmpPath = await join(saveDir, `${file.fileName}.tmp`);

      if (await exists(downloadPath)) {
        await renameFile(downloadPath, tmpPath);
      }
    } finally {
      taskManager.finishTask(dmId);
    }
  }
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
 * Download multiple files.
 *
 * @param filesToDownload - An array of objects with `url` and `fileName` properties.
 */
export default async function downloadFiles(
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

  if (isTauri()) {
    return await downloadWithTauri(files);
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
