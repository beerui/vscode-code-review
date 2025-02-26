import * as vscode from 'vscode';

export class GitService {
  private _gitAPI: vscode.GitExtension | null = null;
  private _initializationPromise: Promise<void>;

  constructor() {
    this._initializationPromise = this.initializeGitAPI();
  }

  private async initializeGitAPI(): Promise<void> {
    try {
      const extension = vscode.extensions.getExtension<vscode.GitExtension>('vscode.git');
      if (!extension) {
        throw new Error('VS Code Git extension not found');
      }

      if (!extension.isActive) {
        await extension.activate();
      }

      this._gitAPI = extension.exports;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to initialize Git: ${error}`);
      this._gitAPI = null;
    }
  }

  async getRepository(): Promise<vscode.Repository | undefined> {
    await this._initializationPromise;
    
    if (!this._gitAPI?.enabled) {
      vscode.window.showErrorMessage('Git is not enabled');
      return undefined;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder open');
      return undefined;
    }

    try {
      // 获取第一个工作区的仓库
      const repo = this._gitAPI.getRepository(workspaceFolders[0].uri);
      if (!repo) {
        vscode.window.showErrorMessage('No Git repository found in workspace');
      }
      return repo;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get repository: ${error}`);
      return undefined;
    }
  }

  // 修改后的获取提交历史方法
  async getCommitHistory(maxEntries = 100): Promise<vscode.Commit[] | undefined> {
    const repo = await this.getRepository();
    if (!repo) return undefined;

    try {
      return await repo.log({ maxEntries });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get history: ${error}`);
      return undefined;
    }
  }
}


// 在扩展激活函数中
const gitService = new GitService();

// 安全获取仓库并刷新 UI
async function refreshGitView() {
  const repo = await gitService.getRepository();
  if (repo) {
    repo.state.onDidChange(() => {
      treeProvider.refresh();
      webview.updateContent();
    });
  }
}

// 初始化完成后再注册命令
context.subscriptions.push(
  vscode.commands.registerCommand('showGitHistory', async () => {
    if (await gitService.getRepository()) {
      new GitWebview(context, gitService);
    }
  })
);
