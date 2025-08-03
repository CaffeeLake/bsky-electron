// Packages
import { app, BrowserWindow } from 'electron';
import Store from 'electron-store';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-features', 'WaylandWindowDecorations');
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
  app.commandLine.appendSwitch('enable-wayland-ime');
}

const store = new Store({
  configFileMode: 0o755,
  defaults: {
    x: undefined,
    y: undefined,
    width: 1280,
    height: 720,
  },
});

// Prepare the renderer once the app is ready
app.on('ready', async () => {
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    x: store.get('x'),
    y: store.get('y'),
    width: store.get('width'),
    height: store.get('height'),
  });

  const url = 'https://bsky.app/';

  mainWindow.loadURL(url);

  mainWindow.once('close', () => {
    const { x, y, width, height } = mainWindow.getBounds();
    store.set('x', x);
    store.set('y', y);
    store.set('width', width);
    store.set('height', height);
  });
});

// Quit the app once all windows are closed
app.on('window-all-closed', app.quit);
