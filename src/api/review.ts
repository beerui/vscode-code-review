import request from "../utils/request";

export async function queryPosts (params: { cursor: string }): Promise<any> {
  // 这里我们根据 vscode 配置动态取的用户 id
  const { cursor } = params;
  const data = await request.post('/article/query_list', {
    cursor: `${cursor}`,
    sort_type: 2,
    user_id: '6932086619055130124',
  });
  return data;
};
