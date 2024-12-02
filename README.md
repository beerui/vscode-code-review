const vscode = require('vscode');

function getRelativePath() {
    // 获取当前活动的编辑器
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('没有打开任何文件');
        return;
    }

    // 获取当前文件的完整路径
    const filePath = editor.document.uri.fsPath;

    // 获取工作区的根目录
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('当前文件不在任何工作区中');
        return;
    }

    // 计算相对路径
    const relativePath = vscode.workspace.asRelativePath(filePath, false);

    // 显示结果
    vscode.window.showInformationMessage(`相对路径: ${relativePath}`);
    return relativePath;
}

module.exports = {
    getRelativePath
};