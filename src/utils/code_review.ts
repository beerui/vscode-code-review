import {
  commands,
  window,
  Uri,
  ViewColumn,
  WebviewPanel,
  ExtensionContext
} from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import { getGitInfo } from "./index";
import { updateWebviewHtmlContent, getNonce } from "./webview";
import { queryPosts } from "../api/review";

let codeReviewPanelOpened = false;
let currentCodeReviewPanel: WebviewPanel | null;
let reviewUrl: any = {
  cspSource: '',
  nonce: getNonce(),
  scriptUri: '',
  stylesResetUri: '',
  stylesMainUri: ''
}

export default function registerCodeViewBtn(context: ExtensionContext) {
  let disposable = commands.registerTextEditorCommand('code-review.start', async (editor) => {
		// 获取编辑器信息
		const document = editor.document;
		const selection = editor.selection;

		// 获取选中内容和行号信息
		const selectedText = document.getText(selection);
		const startLine = selection.start.line + 1;
		const endLine = selection.end.line + 1;

		// 获取Git信息
		let gitInfo = await getGitInfo(document)

    let reviewInfo: any = {
      // 基本代码信息
      filePath: document.uri.fsPath,
      fileName: path.basename(document.uri.fsPath),
      languageId: document.languageId,

      // 选中内容信息
      startLine,
      startColumn: selection.start.character + 1,
      endLine,
      endColumn: selection.end.character + 1,
      selectedText: selectedText,
      totalLines: document.lineCount,

      // Git信息
      gitUserName: gitInfo.userName,
      gitUserEmail: gitInfo.userEmail,
      currentBranch: gitInfo.currentBranch,

      // 额外信息
      文件大小: fs.statSync(document.uri.fsPath).size,
      selectedChars: selectedText.length,
      selectedLines: endLine - startLine + 1,
      ...reviewUrl
    };
    const createPanel = async () => {
      // 创建评审面板，并配置相关属性及解决CSP问题
      const panel = window.createWebviewPanel(
        'code-review',
        '代码评审',
        ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: false,
          localResourceRoots: [Uri.joinPath(context.extensionUri, 'media')],
          enableFindWidget: true,
          portMapping: [{
            webviewPort: 3000,
            extensionHostPort: 3000
          }]
        }
      );
      console.log([Uri.joinPath(context.extensionUri, 'media')]);
      console.log([context.extensionUri]);
      
		  const scriptUri = panel.webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'media', 'main.js'));
      const stylesResetUri = panel.webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'media', 'reset.css'));
      const stylesMainUri = panel.webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'media', 'vscode.css'));
      console.log('Script URI:', scriptUri);
      console.log('Styles Reset URI:', stylesResetUri);
      console.log('Styles Main URI:', stylesMainUri);
      reviewUrl = {
        ...reviewUrl,
        // @ts-ignore
        cspSource: panel.webview.cspSource,
        scriptUri,
        stylesResetUri,
        stylesMainUri
      }
      // 准备评审信息对象
      reviewInfo = {
        ...reviewInfo,
        ...reviewUrl
      };
      // 设置面板HTML内容
      panel.webview.html = updateWebviewHtmlContent(context, reviewInfo);
      
      // 处理webview消息
      panel.webview.onDidReceiveMessage(
        message => {
          console.log('webview message', message);
          switch (message.command) {
            case 'submit':
              if (message.comment) {
                queryPosts({ cursor: '1' }).then(res => {
                  console.log(res);
                  window.showInformationMessage(`评审已提交`);
                }).catch(err => {
                  console.log(err);
                  window.showErrorMessage(err);
                })
                panel.dispose();
              } else {
                window.showErrorMessage('请输入评审意见');
              }
              break;
            case 'cancel':
              panel.dispose();
              break;
          }
        },
        undefined,
        context.subscriptions
      );
      // 监听面板的关闭事件
      panel.onDidDispose(() => {
        console.log('Webview panel has been closed by the user.');
        currentCodeReviewPanel = null
        codeReviewPanelOpened = false;
      }, null, context.subscriptions);

      currentCodeReviewPanel = panel;
      codeReviewPanelOpened = true;
    }
		if (!codeReviewPanelOpened) {
			createPanel()
		} else {
      if (currentCodeReviewPanel && currentCodeReviewPanel.webview) {
        reviewInfo = {
          ...reviewInfo,
          ...reviewUrl
        }
        currentCodeReviewPanel.webview.html = updateWebviewHtmlContent(context, reviewInfo)
      }
    }
	});
	context.subscriptions.push(disposable);
}
