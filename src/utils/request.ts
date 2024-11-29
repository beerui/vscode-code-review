/* eslint-disable no-param-reassign */
import axios from 'axios';
import { window } from 'vscode';
import * as qs from 'qs';

// 中文文档: http://t.cn/ROfXFuj
// 创建实例
const request = axios.create({
  baseURL: 'https://api.juejin.cn/content_api/v1/',
  timeout: 10000,
});

// 添加请求拦截器
request.interceptors.request.use(
  config => {
    console.log('config', config);
    if (config.method === 'get') {
      config.paramsSerializer = params => qs.stringify(params, { arrayFormat: 'repeat' });
    }
    return config;
  },
  error => {
    window.showErrorMessage(error.message);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
request.interceptors.response.use(
  response => {
    console.log('response', response);
    const { data } = response;
    return data;
  },
  error => {
    window.showErrorMessage(error.message);
    return Promise.reject(error);
  }
);

export default request;