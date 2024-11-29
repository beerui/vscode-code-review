// 引入vscode模块里的WebviewOptions原始类型定义
import * as vscode from 'vscode';

// 扩展WebviewOptions类型，添加enableContentSecurityPolicy等属性
declare module 'vscode' {
    interface WebviewOptions {
        enableContentSecurityPolicy?: boolean;
        // 如果后续还有其他需要添加的相关自定义属性，可以继续在这里添加定义
    }
}