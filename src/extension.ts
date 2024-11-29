import * as vscode from 'vscode';
import registerCodeViewBtn from "./utils/code_review";


export function activate(context: vscode.ExtensionContext) {
	console.log('activate');
	// 绑定右键菜单，代码审查按钮
	registerCodeViewBtn(context)
}

export function deactivate() {
	console.log('deactivate');
}