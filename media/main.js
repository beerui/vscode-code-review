// @ts-nocheck
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  const submitBtn = document.querySelector('#submitBtn')
  const cancelBtn = document.querySelector('#cancelBtn')
  const commentText = document.querySelector('#commentText')
  console.log('submitBtn', submitBtn);
  function submit() {
    const comment = commentText.value;
    vscode.postMessage({
      command: 'submit',
      comment: comment
    });
  }
  
  function cancel() {
    vscode.postMessage({ command: 'cancel' });
  }
  
  submitBtn.addEventListener('click', submit)
  cancelBtn.addEventListener('click', cancel)
}());

