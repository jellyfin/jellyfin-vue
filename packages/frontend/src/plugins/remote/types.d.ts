import type RemotePluginAuthInstance from './auth.ts';
import type RemotePluginSDKInstance from './sdk/index.ts';
import type RemotePluginSocketInstance from './socket.ts';

export interface RemotePlugin {
  sdk: typeof RemotePluginSDKInstance;
  auth: typeof RemotePluginAuthInstance;
  socket: typeof RemotePluginSocketInstance;
}
