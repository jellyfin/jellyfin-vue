import type RemotePluginAuthInstance from './auth';
import type RemotePluginSDKInstance from './sdk';
import type RemotePluginSocketInstance from './socket';

export interface RemotePlugin {
  sdk: typeof RemotePluginSDKInstance;
  auth: typeof RemotePluginAuthInstance;
  socket: typeof RemotePluginSocketInstance;
}
