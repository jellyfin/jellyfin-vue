import RemotePluginAuthInstance from './auth';
import RemotePluginSDKInstance from './sdk';
import RemotePluginSocketInstance from './socket';

export interface RemotePlugin {
  sdk: typeof RemotePluginSDKInstance;
  auth: typeof RemotePluginAuthInstance;
  socket: typeof RemotePluginSocketInstance;
}
