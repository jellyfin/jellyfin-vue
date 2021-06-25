import { Plugin } from 'vue';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export const AxiosSymbol = Symbol('axios-instance');

export function createAxios(options: AxiosRequestConfig): Plugin {
  const instance: AxiosInstance = axios.create({
    baseURL: options.baseURL
  });

  const axiosPlugin: Plugin = {
    install(app) {
      app.provide(AxiosSymbol, instance);
    }
  };

  return axiosPlugin;
}
