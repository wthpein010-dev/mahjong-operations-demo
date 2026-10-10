---
version: alpha
colors:
  primary: "#16765e"
  dark: "#142d28"
  background: "#f3f6f5"
  text: "#20352e"
  muted: "#687b73"
  border: "#e1e8e4"
typography:
  body:
    fontFamily: "Microsoft YaHei, PingFang SC, sans-serif"
  data:
    fontFamily: "Bahnschrift, Arial, sans-serif"
rounded:
  panel: "12px"
omitted:
  - section: spacing
    reason: "Spacing is owned by style.css for this static prototype."
  - section: components
    reason: "Shared primitives are documented in UX-CONTRACT.md."
---

## Overview
中文棋牌运营工具，以麻将牌的青绿色与米白牌面为识别。左侧深绿导航，白色经营面板，克制使用金色表示公司归属与排名。
## Colors
style.css 的 :root 是运行时唯一 token 来源；本文件记录同名值，调整时同步更新。primary 用于主要操作与流水图表，dark 用于导航，muted 用于次要信息。
## Typography
中文使用系统雅黑/苹方，数字使用 Bahnschrift，避免外部字体加载。正文14px，表格12px，标题26px。
## Layout
桌面222px侧栏，四个统计面板与双列图表。760px以下压缩侧栏，统计双列，图表与区域卡片单列。表格独立横向滚动。
## Shapes
面板12px圆角，控件7px圆角。品牌标记模拟麻将牌的厚度，其余组件保持平静。
# V1.5 revision 2026-10-10

沿用原型深绿、浅灰、白色面板的视觉系统。业务名称为麻溜后台管理系统，雀序是公开演示视觉标识。导航分工作空间、账号、游戏、资金查询、系统设置；全导航在自身容器内滚动。手机增加原生功能导航选择器，表格仅内部横向滚动。

首屏突出授权区域签名、多区域筛选、净充值、去重玩家、有效房间与房卡消耗。所有数值从有日期的虚构记录聚合；游戏统计、日活、充值退款和负责人汇总共享范围与时间过滤。参考站实际账号、联系电话、游戏ID与截图不进入公开项目。

## V1.6 · 2026-10-11

沿用现有视觉系统。新增服务协同、数据与监控导航组；九个页面复用表格、筛选、分页、对话框和状态提示。工单详情强调关联对象、受理客服和处理记录。表单退出使用内联未保存提示。
