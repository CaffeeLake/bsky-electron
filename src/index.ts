// Packages
import { BrowserWindow, app } from 'electron';

// Prepare the renderer once the app is ready
app.on('ready', async () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
  });

  const url = 'https://staging.bsky.app/';

  mainWindow.loadURL(url);
});

// Quit the app once all windows are closed
app.on('window-all-closed', app.quit);
