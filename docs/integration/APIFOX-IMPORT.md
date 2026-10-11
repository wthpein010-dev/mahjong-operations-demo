# Apifox接口归档

当前状态：提供OpenAPI 3.0.3可导入JSON，尚未连接Apifox项目，未执行远端同步。

文件：`public/reference/openapi.json`。目录中有49项源系统待对接参考契约和6项公开演示接口；业务路径的服务器地址为api.example.invalid占位。

阿福先完善源路径、鉴权、字段、错误、权限、幂等和快照；Nirvana接入测试，核对后将OpenAPI、环境变量说明、虚构样例、测试集合与差异记录导入指定项目。项目与写权限到位后才执行同步并记录版本/时间/执行人。导入前对照operationId；人工测试用例不能被覆盖删除。真实token、密码、Cookie和真实玩家数据不得进入公开JSON、仓库或示例环境。

## 演示会话调用顺序

先调用GET /api/v1/demo/state取得匿名Cookie与sessionId，不创建个人快照；POST携带Cookie、X-Demo-Session、数字If-Match及{data}。sessionId为Cookie token的SHA-256指纹，不是Cookie或授权凭据。DELETE需相同会话校验，恢复后轮换Cookie并返回新sessionId；旧标签页409 SESSION_CONFLICT，重新读取后才能保存。POST版本409 REVISION_CONFLICT另含revision；428 SESSION_REQUIRED表示先读取会话。Apifox使用同一Cookie会话，不能仅复制sessionId绕过Cookie。
