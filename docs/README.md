# 商城 H5 数据模型与 Mock 接口说明

## 一、相关文件

| 位置                        | 说明                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| `docs/apifox.json`          | OpenAPI 3.0 接口定义，**可直接导入 Apifox**（含全部数据模型 Schema 与接口）  |
| `src/types/api.ts`          | 前端数据模型 / DTO，与 `apifox.json` 中的 Schema 一一对应                     |
| `src/api/*.ts`              | 接口定义（`request.ts` 请求层、`shop.ts` 商品/订单/用户、`auth.ts` 登录注册） |
| `src/mock/db.ts`            | 本地 mock 数据：商品种子数据 + 用户 / 订单（localStorage 持久化）             |
| `src/mock/server.ts`        | 本地 mock-api 路由，路径 / 入参 / 返回与 `apifox.json` 完全一致               |
| `src/utils/cartStorage.ts`  | 购物车本地存储（购物车不走接口）                                             |
| `src/hooks/useWeda/httpDataSource.ts` | 数据源适配层：`dataSourceName + methodName` → REST 接口             |

## 二、数据模型

| 模型           | 说明                                                     | 关键字段                                                                                       |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Product`      | 商品（列表 / 详情）                                       | id、name、price、originalPrice、image、images、category、sales、stock、isFeatured、progress     |
| `Favorite`     | 收藏的商品（商品快照 + 收藏时间），随用户信息返回         | Product 全部字段 + collectedAt                                                                  |
| `User`         | 用户信息（个人中心）                                     | id、username、nickname、phone、avatar、vipLevel、points、coupons、views、collection             |
| `CartItem`     | 购物车商品（**前端 localStorage 维护，无接口**）          | id、productId、name、image、price、quantity、spec、selected                                     |
| `Order`        | 订单                                                     | id、orderNo、status、items、totalAmount、freight、payAmount、address、payMethod、createTime     |
| `OrderItem`    | 订单商品明细                                             | id、productId、name、image、price、quantity、spec                                               |
| `OrderStatus`  | 订单状态枚举                                             | pending / paid / shipped / completed / cancelled                                                |
| `Address`      | 收货地址                                                 | name、phone、province、city、district、detail                                                    |
| 通用结构       | `{ code, message, data }`（code = 0 成功）、分页 `{ records, total, pageNumber, pageSize }` | —                                            |

## 三、接口列表（只使用 GET / POST）

| 方法 | 路径                     | 说明                          | 入参位置      |
| ---- | ------------------------ | ----------------------------- | ------------- |
| GET  | `/products`              | 商品列表                      | query         |
| GET  | `/products/detail`       | 商品详情                      | query（id）   |
| POST | `/auth/login`            | 登录                          | body          |
| POST | `/auth/register`         | 注册（成功即登录）            | body          |
| POST | `/user/create`           | 创建用户                      | body          |
| GET  | `/user/info`             | 获取用户信息（个人中心）      | query（id/phone） |
| POST | `/user/update`           | 更新用户信息（昵称/头像/收藏） | body          |
| POST | `/orders/create`         | 订单创建                      | body          |
| GET  | `/orders`                | 订单查询（列表）              | query         |
| GET  | `/orders/detail`         | 订单查询（详情）              | query（orderNo） |
| POST | `/orders/pay`            | 订单支付                      | body          |
| POST | `/orders/update-status`  | 更新订单状态（取消 / 收货）   | body          |
| POST | `/orders/remove`         | 删除订单                      | body          |

> 更新、删除类操作统一使用 POST（`/orders/update-status`、`/orders/remove`），不使用 PUT / DELETE。

## 四、从本地 mock 切换到 Apifox 云 mock

1. 打开 Apifox → 「导入数据」→ 选择 `OpenAPI / Swagger` → 上传 `docs/apifox.json`；
2. 导入后在项目里可以：查看数据模型（数据模型 / Schema 面板）、调试接口、生成云 mock；
3. 在 Apifox 中创建并复制 **云 Mock 地址**（形如 `https://mock.apifox.com/m1/xxxxx-0-default`）；
4. 修改前端 `.env.development`：

   ```bash
   VITE_USE_MOCK=false
   VITE_GLOB_API_URL=https://mock.apifox.com/m1/xxxxx-0-default
   ```

   此时请求链路变为：页面 → `src/api` → `fetch(API_URL + /api + path)`，本地 `src/mock` 不再参与；
5. 确认云 mock 正常后，可以删除 `src/mock` 目录（`src/api/request.ts` 中删掉 `isLocalMock` 分支即可）。

## 五、购物车策略

- 购物车**不调用任何接口**，全部使用 `localStorage`（key：`cart_items`），逻辑集中在 `src/utils/cartStorage.ts`：
  - 首页 / 商品列表 / 商品详情「加入购物车」→ `addCartItem(toCartItem(product, quantity, spec))`
  - 购物车页：读取 `readCart`、勾选 / 改数量 `updateCartItem`、全选 `setAllSelected`、删除 `removeCartItem`
  - 结算：页面读取已勾选商品 → `POST /orders/create` 创建订单 → 从本地购物车移除已下单商品
- 商品 / 用户 / 订单数据走接口（本地 mock 或 Apifox 云 mock / 真实后端）。

## 六、演示数据

- 演示账号：手机号 `13800000000`，密码 `123456`（本地 mock 默认用户，含 1280 积分 / 3 张优惠券 / 2 笔订单）
- 商品种子数据：8 个商品（`clothing`、`beauty`、`digital`、`home`、`mens`、`food`、`sports`、`books`）
- 本地 mock 的用户 / 订单会写入 `localStorage`（`mock_db_users`、`mock_db_orders`），
  需要重置时清除这两个 key（或浏览器 Local Storage）即可。
