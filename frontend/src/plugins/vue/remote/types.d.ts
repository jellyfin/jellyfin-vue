import RemotePluginAuthInstance from './auth';
import RemotePluginAxiosInstance from './axios';
import RemotePluginSDKInstance from './sdk';
import RemotePluginSocketInstance from './socket';

export interface RemotePlugin {
  axios: typeof RemotePluginAxiosInstance;
  sdk: typeof RemotePluginSDKInstance;
  auth: typeof RemotePluginAuthInstance;
  socket: typeof RemotePluginSocketInstance;
}
