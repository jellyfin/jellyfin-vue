import { createServer } from 'http';
import { join } from 'path';
import { app, BrowserWindow } from 'electron';
import { loadNuxt, build } from 'nuxt';

const isDev = process.env.NODE_ENV !== 'production';

async function createWindow(): Promise<void> {
  const nuxt = await loadNuxt({
    rootDir: join(__dirname, '../client/'),
    for: isDev ? 'dev' : 'start'
  });

  if (isDev) {
    await build(nuxt);
  }

  await nuxt.ready();

  const server = createServer(nuxt.render);

  server.listen(8000, '127.0.0.1');

  console.error(server.address());

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  win.loadURL('http://127.0.0.1:8000');
}

// eslint-disable-next-line promise/catch-or-return, promise/always-return
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
