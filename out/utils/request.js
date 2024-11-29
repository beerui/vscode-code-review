"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-param-reassign */
const axios_1 = require("axios");
const vscode_1 = require("vscode");
const qs = require("qs");
// 中文文档: http://t.cn/ROfXFuj
// 创建实例
const request = axios_1.default.create({
    baseURL: 'https://api.juejin.cn/content_api/v1/',
    timeout: 10000,
});
// 添加请求拦截器
request.interceptors.request.use(config => {
    console.log('config', config);
    if (config.method === 'get') {
        config.paramsSerializer = params => qs.stringify(params, { arrayFormat: 'repeat' });
    }
    return config;
}, error => {
    vscode_1.window.showErrorMessage(error.message);
    return Promise.reject(error);
});
// 添加响应拦截器
request.interceptors.response.use(response => {
    console.log('response', response);
    const { data } = response;
    return data;
}, error => {
    vscode_1.window.showErrorMessage(error.message);
    return Promise.reject(error);
});
exports.default = request;
//# sourceMappingURL=request.js.map