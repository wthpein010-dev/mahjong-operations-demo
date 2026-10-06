# 原型交互约定

业务来源为用户2026-10-06提供的四角色后台需求。未确认口径在网页权限说明中可见。无真实财务、认证或外部数据写入。

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | native select | app.js controls / regionSelect | OS-owned popup accepted | 浏览器键盘与切换 |
| Form | modal shared form | app.js modal / invalid | create, edit | 新增、空值、比例边界 |
| Scrollbar | global CSS | style.css | viewport responsive | 窄屏横向表格 |
| Toast | notify | app.js | status | aria-live |
| CRUD | create / save / bind | app.js | local demo only | 新增回列表、刷新保留 |

弹窗统一使用原生dialog提供模态、Escape及焦点恢复，显式保存与取消。所有表格共用table渲染、8条分页、空结果与搜索清空；筛选后重置分页。搜索仅本地即时执行并支持IME，搜索词与页码为临时浏览状态，不写入共享URL；页面、角色、区域、周期写入URL。

区域身份数据固定成都。总部客服可全区域开设代理，业绩归公司。区域代理与区域客服无转卡功能。角色切换只是演示，不能作为安全边界。

静态数据立即加载，无远程请求，因此不模拟异步加载、离线错误或会话过期。localStorage失败显示提示，应用保持可操作。清除演示数据必须经应用弹窗确认。
