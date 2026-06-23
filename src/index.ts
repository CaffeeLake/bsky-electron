// Packages
import { app, BrowserWindow, dialog, Menu, MenuItem, net } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import Store from 'electron-store';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch(
    'enable-features',
    'AcceleratedVideoDecodeLinuxGL,AcceleratedVideoEncoder,TouchpadOverscrollHistoryNavigation,UseOzonePlatform,WaylandWindowDecorations',
  );
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

  mainWindow.webContents.on('context-menu', (event, params) => {
    event.preventDefault();

    const menu = new Menu();

    if (params.mediaType === 'image' && params.srcURL) {
      menu.append(
        new MenuItem({
          label: 'Download Image',
          click: async () => {
            let suggestedName = 'image';
            try {
              const url = new URL(params.srcURL);
              suggestedName = path.posix.basename(decodeURIComponent(url.pathname)) || 'image';
            } catch (error) {
              console.error('Failed to parse image URL:', error);
            }

            try {
              const { filePath } = await dialog.showSaveDialog(mainWindow, {
                defaultPath: suggestedName,
              });

              if (!filePath) {
                return;
              }

              const response = await net.fetch(params.srcURL);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }

              const buffer = Buffer.from(await response.arrayBuffer());
              await fs.promises.writeFile(filePath, buffer);
            } catch (error) {
              console.error('Failed to download image:', error);
            }
          },
        }),
      );

      menu.append(new MenuItem({ type: 'separator' }));
    }

    menu.append(
      new MenuItem({
        label: 'Back',
        enabled: mainWindow.webContents.navigationHistory.canGoBack(),
        click: () => {
          mainWindow.webContents.navigationHistory.goBack();
        },
      }),
    );

    menu.append(
      new MenuItem({
        label: 'Forward',
        enabled: mainWindow.webContents.navigationHistory.canGoForward(),
        click: () => {
          mainWindow.webContents.navigationHistory.goForward();
        },
      }),
    );

    menu.append(
      new MenuItem({
        label: 'Reload',
        click: () => {
          mainWindow.webContents.reload();
        },
      }),
    );

    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(
      new MenuItem({
        label: 'Cut',
        enabled: params.isEditable,
        click: () => {
          mainWindow.webContents.cut();
        },
      }),
    );

    menu.append(
      new MenuItem({
        label: 'Copy',
        enabled: params.selectionText.length > 0,
        click: () => {
          mainWindow.webContents.copy();
        },
      }),
    );

    menu.append(
      new MenuItem({
        label: 'Paste',
        enabled: params.isEditable,
        click: () => {
          mainWindow.webContents.paste();
        },
      }),
    );

    menu.append(
      new MenuItem({
        label: 'Select All',
        click: () => {
          mainWindow.webContents.selectAll();
        },
      }),
    );

    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(
      new MenuItem({
        label: 'Inspect Element',
        click: () => {
          mainWindow.webContents.inspectElement(params.x, params.y);
        },
      }),
    );

    menu.popup();
  });

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
