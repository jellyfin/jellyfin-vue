import RemotePluginAuthInstance from './auth';
import RemotePluginAxiosInstance from './axios';
import RemotePluginSDKInstance from './sdk';

export interface RemotePlugin {
  axios: typeof RemotePluginAxiosInstance;
  sdk: typeof RemotePluginSDKInstance;
  auth: typeof RemotePluginAuthInstance;
}
