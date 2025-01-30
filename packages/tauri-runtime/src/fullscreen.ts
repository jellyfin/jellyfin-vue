import { getCurrentWindow } from '@tauri-apps/api/window';

Element.prototype.requestFullscreen = async () => getCurrentWindow().setFullscreen(true);
Document.prototype.exitFullscreen = async () => getCurrentWindow().setFullscreen(false);
