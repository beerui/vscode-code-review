import { Uri, ExtensionContext } from "vscode";
import * as path from 'path';
import * as fs from 'fs';

export function updateWebviewHtmlContent(context: ExtensionContext, reviewInfo: any) {
  console.log(reviewInfo);
  const htmlTemplate = getWebViewContent(context, 'src/view/code-review.html')
  const bodyHtml = htmlTemplate
    .replaceAll('{{nonce}}', reviewInfo.nonce)
    .replaceAll('{{cspSource}}', reviewInfo.cspSource)
    .replace('{{scriptUri}}', reviewInfo.scriptUri)
    .replace('{{stylesResetUri}}', reviewInfo.stylesResetUri)
    .replace('{{stylesMainUri}}', reviewInfo.stylesMainUri)
    .replace('{{file-path}}', reviewInfo.filePath)
    .replace('{{file-name}}', reviewInfo.fileName)
    .replace('{{language-id}}', reviewInfo.languageId)
    .replace('{{total-lines}}', reviewInfo.totalLines.toString())
    .replace('{{start-line}}', reviewInfo.startLine.toString())
    .replace('{{start-column}}', reviewInfo.startColumn.toString())
    .replace('{{end-line}}', reviewInfo.endLine.toString())
    .replace('{{end-column}}', reviewInfo.endColumn.toString())
    .replace('{{selected-lines}}', reviewInfo.selectedLines.toString())
    .replace('{{selected-chars}}', reviewInfo.selectedChars.toString())
    .replace('{{git-user-name}}', reviewInfo.gitUserName)
    .replace('{{git-user-email}}', reviewInfo.gitUserEmail)
    .replace('{{current-branch}}', reviewInfo.currentBranch)
    .replace('{{selected-code}}', reviewInfo.selectedText.toString());
  return `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>代码评审</title>
        <meta http-equiv="Content-Security-Policy" 
            content="default-src 'self' vscode-resource: https:; 
            script-src 'self' vscode-resource: 'unsafe-inline' 'unsafe-eval'; 
            style-src 'self' vscode-resource: 'unsafe-inline';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${reviewInfo.stylesResetUri}" rel="stylesheet">
        <link href="${reviewInfo.stylesMainUri}" rel="stylesheet">
      </head>

      <body>
        ${bodyHtml}  
        <script nonce="${reviewInfo.nonce}" src="${reviewInfo.scriptUri}"></script>
      </body>
    </html>
  `
}
/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
function getWebViewContent(context: ExtensionContext, templatePath: string) {
  const resourcePath = path.join(context.extensionPath, templatePath);
  const dirPath = path.dirname(resourcePath);
  let html = fs.readFileSync(resourcePath, 'utf-8');
  // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
  html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
    return $1 + Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
  });
  return html;
}

export function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}