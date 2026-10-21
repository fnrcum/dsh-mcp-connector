# 数据源 MCP 候选证据模板

本模板用于把自动发现结果整理成可复核的候选证据包。它不是 Connector 描述文件，也不构成上架批准；只有完成真实只读运行验收并取得具名人工批准后，才能在独立 Registry 仓库创建卡片。

## 1. 候选身份

- 候选 ID：
- 名称：
- 提供方：
- 国内/海外属性：
- 数据用途与目标用户：
- Official MCP Registry 记录：
- 官方网站：
- 官方仓库：
- 软件包或远程端点：
- 与现有 Connector 的稳定身份去重结果：

先按 Registry 名、包名、仓库 URL 和远程端点 URL 检查重复；不得仅凭显示名称判断。

## 2. 接入与商业边界

- 传输：`streamable-http` / `stdio` / 其他
- 鉴权：免密 / OAuth / API Key / Bearer / PAT
- 凭据最小权限：
- 成本：免费 / 免费额度 / 付费 / 未确认
- 代码许可证：
- 数据许可证或服务条款：
- 可否批量导出、系统入库、转售或平台分发：
- 隐私、日志、速率限制与地域限制：

代码许可证不能替代数据许可证或服务条款。未知项必须写 `未确认`，不能推断。

## 3. 维护与安全

- 仓库是否归档：
- 最近真实提交时间：
- 当前服务版本：
- 工具数：
- `readOnlyHint` / `destructiveHint` / `idempotentHint`：
- 写入、删除、发送、交易或反馈工具：
- 已知安全与合规限制：

## 4. 可复现只读验收

在 `duhu2000/dsh-mcp-connector-registry` 的已核验提交上运行：

```bash
node scripts/run-runtime-acceptance.mjs \
  --url https://example.com/mcp \
  --tool one_explicitly_read_only_tool \
  --args '{}' \
  --reviewer reviewer-name
```

记录：

- 检查时间（UTC）：
- Registry / 仓库提交：
- 协议版本：
- Server 名称与版本：
- `tools/list` 数量：
- 最小只读工具：
- 调用结果：
- 响应 SHA-256：
- 凭据扫描：
- 原始响应是否保存：必须为 `否`

如果需要凭据但没有获得服务方或用户授权的专用最小权限测试凭据，只能记录协议发现和鉴权边界，并标记 `DEFERRED`；不得猜测、复用或记录真实凭据。

## 5. 决策

- 状态：`PASS` / `SKIP` / `FAIL` / `DEFERRED`
- 评分与理由：
- 阻断项：
- 下一步：
- 审核人：
- 审核时间：

`PASS` 只表示证据与只读运行门槛通过，可以进入人工卡片评审；它不表示已批准或已上架。

## 6. 禁止项

- 不记录 Token、API Key、Cookie、Client Secret、授权码、个人数据或客户数据。
- 不保存原始 MCP 响应正文、Session ID 或带值鉴权 Header。
- 不因一次失败自动删除候选。
- 不自动生成、合并、上架或下架 Connector。
- 先核对 Registry 的 `discovery-sources/exclusions.json` 与 `docs/DEFERRED-CONNECTORS.md`；明确 `do-not-list` 的项目不得重新进入候选。
