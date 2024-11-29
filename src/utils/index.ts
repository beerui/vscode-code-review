import { workspace, TextDocument } from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import * as util from 'util';
const exec = util.promisify(cp.exec);

// 获取Git配置信息的函数
async function getGitConfig(workspaceRoot: string, configKey: string): Promise<string> {
  try {
    const { stdout } = await exec(`git config ${configKey}`, {
      cwd: workspaceRoot
    });
    return stdout.trim();
  } catch (error) {
    console.log(`获取 ${configKey} 失败:`, error);
    return '未知';
  }
}

interface GitInfo {
  userName: String;
  userEmail: String;
  currentBranch: String;
}

export function getGitInfo(document: TextDocument): Promise<GitInfo> {
  return new Promise(async (resolve) => {
    const workspaceFolders = workspace.workspaceFolders;
    const workspaceRoot = workspaceFolders ? workspaceFolders[0].uri.fsPath : path.dirname(document.uri.fsPath);
    // 获取Git信息
    let gitInfo = {
      userName: await getGitConfig(workspaceRoot, 'user.name'),
      userEmail: await getGitConfig(workspaceRoot, 'user.email'),
      currentBranch: '未知'
    };
  
    // 获取当前分支
    try {
      const { stdout } = await exec('git rev-parse --abbrev-ref HEAD', {
        cwd: workspaceRoot
      });
      gitInfo.currentBranch = stdout.trim();
    } catch (error) {
      console.log('获取当前分支失败:', error);
    }
    resolve(gitInfo)
  })
}