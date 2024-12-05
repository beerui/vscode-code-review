const vscode = require('vscode');

class MyWebviewViewProvider {
  constructor(context) {
    this.context = context;
  }

  resolveWebviewView(webviewView) {
    // 配置 Webview
    webviewView.webview.options = {
      enableScripts: true, // 启用 JS
    };

    // 设置 HTML 内容
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // 如果需要处理消息
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'alert':
          vscode.window.showInformationMessage(message.text);
          break;
      }
    });
  }

  getHtmlForWebview(webview) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Webview in Sidebar</title>
      </head>
      <body>
        <h1>Hello from the Sidebar!</h1>
        <button onclick="sendMessage()">Click me</button>
        <script>
          const vscode = acquireVsCodeApi();
          function sendMessage() {
            vscode.postMessage({ command: 'alert', text: 'Hello from Webview!' });
          }
        </script>
      </body>
      </html>
    `;
  }
}

// 在扩展激活时注册 WebviewView
function activate(context) {
  const provider = new MyWebviewViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('myWebviewView', provider)
  );
}

module.exports = {
  activate,
};