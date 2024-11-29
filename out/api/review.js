"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryPosts = queryPosts;
const request_1 = require("../utils/request");
async function queryPosts(params) {
    // 这里我们根据 vscode 配置动态取的用户 id
    const { cursor } = params;
    const data = await request_1.default.post('/article/query_list', {
        cursor: `${cursor}`,
        sort_type: 2,
        user_id: '6932086619055130124',
    });
    return data;
}
;
//# sourceMappingURL=review.js.map