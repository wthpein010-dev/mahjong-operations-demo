# 原型交互约定

业务来源为既有V1.4需求、2026-10-10截图及参考站可见功能，修订对应V1.5文档。无真实财务、认证或外部数据写入。

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | native select | app.js regionField / demo-account / mobile-page | OS-owned popup accepted | 账号、身份、手机导航切换 |
| Date | native date input | app.js controls / bind | 起止日期、7天、30天 | 同一日期区间汇总 |
| Table Selection | native checkbox fieldset | app.js controls / scope | 多区域筛选、负责人授权 | 全部、单区、多区及撤权 |
| Form | modal shared form | app.js modal / invalid | create, edit | 新增、空值、比例边界 |
| Scrollbar | global CSS | style.css | viewport responsive | 窄屏横向表格 |
| Toast | notify | app.js | status | aria-live |
| CRUD | create / save / bind | app.js | local demo only | 新增回列表、刷新保留 |

弹窗统一使用原生dialog提供模态、Escape及焦点恢复，显式保存与取消。所有表格共用table渲染、8条分页、空结果与搜索清空；筛选后重置分页。搜索仅本地即时执行并支持IME，搜索词与页码为临时浏览状态，不写入共享URL；页面、角色、账号、区域集合和起止日期写入URL。

地区负责人示例各管两个区域，区域客服只管一个区域。总部客服可全区域开户但仅看本人当前服务经营数据及个人奖励。地区负责人含区域客服开户职责。所有身份均无转卡入口，余额和转卡流水只读。角色切换只是演示，不能作为安全边界。

区域多选为空表示全部授权区域，URL参数只能缩小当前身份范围；无授权账号不返回区域经营数据。日期按稳定虚构事件过滤，金额不再倍数推算；玩家跨区域合计去重。迁区改变代理和茶馆当前关系，不改历史事件区域；总部客服绑定保留，区域客服按目标区重配。奖励配置次日生效，演示仅存待生效值，不重算历史订单。

静态数据立即加载，无远程请求，因此不模拟异步加载、离线错误或会话过期。localStorage失败显示提示，应用保持可操作。清除演示数据必须经应用弹窗确认。

## V1.6 · 2026-10-11

工单可见范围同时校验授权区域、当前服务关系和分配/创建身份；总部客服服务关系解除后不再查询关联工单。任务须本人所有且全部区域获授权，总部在当前范围内查询。未发布公告仅创建人或总部可看。区域负责人只读系统配置。告警关注不修正来源记录，同步说明不提供资产补写入口。
