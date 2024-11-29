"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const code_review_1 = require("./utils/code_review");
function activate(context) {
    console.log('activate');
    // 绑定右键菜单，代码审查按钮
    (0, code_review_1.default)(context);
}
function deactivate() {
    console.log('deactivate');
}
//# sourceMappingURL=extension.js.map