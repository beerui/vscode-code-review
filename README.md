
步骤 2：Git 服务层实现
src/git-service.ts


import * as vscode from 'vscode';

export class GitService {
  private gitAPI: vscode.GitExtension | undefined;

  constructor() {
    this.initGitAPI();
  }

  private initGitAPI() {
    try {
      this.gitAPI = vscode.extensions.getExtension<vscode.GitExtension>('vscode.git')?.exports;
    } catch (error) {
      vscode.window.showErrorMessage('Git extension not found');
    }
  }

  get repository(): vscode.Repository | undefined {
    if (!this.gitAPI?.enabled) return undefined;
    return this.gitAPI?.API.getRepository(vscode.Uri.file(vscode.workspace.rootPath || ''));
  }

  async getCommitHistory(maxEntries = 100): Promise<vscode.Commit[] | undefined> {
    const repo = this.repository;
    if (!repo) return undefined;
    
    try {
      const log = await repo.log({ maxEntries });
      return log;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get commit history: ${error}`);
      return undefined;
    }
  }

  async getFileDiff(uri: vscode.Uri): Promise<string | undefined> {
    const repo = this.repository;
    if (!repo) return undefined;

    try {
      const diff = await repo.diffWithHEAD(uri.fsPath);
      return diff;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get file diff: ${error}`);
      return undefined;
    }
  }
}



步骤 3：TreeView 完整实现
src/commit-tree.ts
import * as vscode from 'vscode';
import { GitService } from './git-service';

export class CommitTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private gitService: GitService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const commits = await this.gitService.getCommitHistory(50);
    if (!commits) return [];

    return commits.map(commit => {
      const item = new vscode.TreeItem(
        `${commit.message} (${commit.hash.slice(0, 7)})`,
        vscode.TreeItemCollapsibleState.None
      );
      
      item.tooltip = [
        `Author: ${commit.authorName}`,
        `Date: ${new Date(commit.authorDate).toLocaleString()}`,
        `Hash: ${commit.hash}`
      ].join('\n');

      item.command = {
        command: 'showCommitDetail',
        title: 'Show Commit Detail',
        arguments: [commit]
      };

      return item;
    });
  }
}
步骤 4：Webview 面板实现
src/webview-panel.ts
import * as vscode from 'vscode';
import { GitService } from './git-service';

export class GitWebview {
  private static currentPanel: GitWebview | undefined;
  private readonly panel: vscode.WebviewPanel;

  constructor(private context: vscode.ExtensionContext, private gitService: GitService) {
    this.panel = vscode.window.createWebviewPanel(
      'gitHistory',
      'Git History',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    this.setupWebview();
    this.updateContent();
  }

  private setupWebview() {
    this.panel.webview.html = this.getWebviewContent();
    
    this.panel.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'loadMore':
          this.appendCommits(await this.gitService.getCommitHistory(message.pageSize));
          break;
        case 'requestDiff':
          const diff = await this.gitService.getFileDiff(vscode.Uri.file(message.filePath));
          this.sendDiff(message.filePath, diff);
          break;
      }
    });
  }

  private async updateContent() {
    const commits = await this.gitService.getCommitHistory();
    this.panel.webview.postMessage({
      type: 'updateCommits',
      commits: commits?.map(c => ({
        hash: c.hash,
        message: c.message,
        author: c.authorName,
        date: c.authorDate
      }))
    });
  }

  private sendDiff(filePath: string, diff?: string) {
    this.panel.webview.postMessage({
      type: 'updateDiff',
      filePath,
      diff: diff || 'No changes'
    });
  }

  private appendCommits(commits?: vscode.Commit[]) {
    // 增量更新逻辑
  }

  private getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .commit { padding: 10px; border-bottom: 1px solid #eee; }
          .diff { font-family: monospace; white-space: pre; }
        </style>
      </head>
      <body>
        <div id="commits"></div>
        <button id="loadMore">Load More</button>
        <div id="diffViewer"></div>

        <script>
          const vscode = acquireVsCodeApi();
          let currentPage = 1;

          window.addEventListener('message', event => {
            const data = event.data;
            if (data.type === 'updateCommits') {
              renderCommits(data.commits);
            } else if (data.type === 'updateDiff') {
              document.getElementById('diffViewer').innerText = data.diff;
            }
          });

          function renderCommits(commits) {
            const container = document.getElementById('commits');
            commits.forEach(commit => {
              const div = document.createElement('div');
              div.className = 'commit';
              div.innerHTML = \`
                <h3>\${commit.message}</h3>
                <p>Author: \${commit.author}</p>
                <p>Date: \${new Date(commit.date).toLocaleString()}</p>
              \`;
              div.onclick = () => vscode.postMessage({
                command: 'requestDiff',
                filePath: '${vscode.workspace.rootPath}/example.txt'
              });
              container.appendChild(div);
            });
          }

          document.getElementById('loadMore').onclick = () => {
            vscode.postMessage({ command: 'loadMore', pageSize: 20 });
          };
        </script>
      </body>
      </html>
    `;
  }
}
步骤 5：主入口集成
src/extension.ts
import * as vscode from 'vscode';
import { GitService } from './git-service';
import { CommitTreeProvider } from './commit-tree';
import { GitWebview } from './webview-panel';

export function activate(context: vscode.ExtensionContext) {
  const gitService = new GitService();
  
  // 注册 TreeView
  const treeProvider = new CommitTreeProvider(gitService);
  vscode.window.registerTreeDataProvider('gitCommitsView', treeProvider);

  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand('showGitHistory', () => {
      new GitWebview(context, gitService);
    }),
    
    vscode.commands.registerCommand('showCommitDetail', (commit: vscode.Commit) => {
      vscode.window.showInformationMessage(
        \`Commit Details:
        Hash: \${commit.hash}
        Author: \${commit.authorName}
        Date: \${new Date(commit.authorDate).toLocaleString()}
        Message: \${commit.message}\`
      );
    })
  );

  // 自动刷新
  gitService.repository?.state.onDidChange(() => treeProvider.refresh());
}
