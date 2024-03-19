import type { PublicSystemInfo, UserDto } from '@jellyfin/sdk/lib/generated-client';

export interface ServerInfo extends BetterOmit<PublicSystemInfo, 'LocalAddress'> {
  PublicAddress: string;
  isDefault: boolean;
}

export interface AuthState {
  servers: ServerInfo[];
  currentServerIndex: number;
  currentUserIndex: number;
  users: UserDto[];
  rememberMe: boolean;
  /**
   * Key: userId. Value: Access token
   */
  accessTokens: { [key: string]: string };
}
