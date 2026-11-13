# 收藏摆件 · 精细建模与验收

三件收藏由 Blender 5.3 原生建模，保存可编辑的独立零件；网页导出按材质合并，再进行顶点去重和量化。它们与 TARDIS、《星空》共用左下角折叠收藏菜单，可独立旋转、缩放和重置视角。公寓与飞船的初始查看角度已经提高，便于直接看到内部陈设和上层结构。

| 收藏 | 宽 × 深 × 高 | 房间中的位置 |
| --- | --- | --- |
| 莫妮卡公寓 | 45 × 31 × 13.9 cm | 书架顶层 |
| 千年隼 | 60 × 84 × 21 cm | 前景胡桃木低展示台 |
| One Wish Willow | 26 × 8 × 7 cm | 影音柜右侧 |

## 莫妮卡公寓

以用户提供的平面图、剖面模型和电视剧布景为主要参考，制作客厅、厨房和后方窗区的开放式微缩场景。原生模型保留 1,212 个零件。

- 斜角砖墙厨房、真实窗洞、水槽开口、曲颈龙头、青蓝色框式橱柜与抽屉、木台面、开放餐具架、锅具吊杆、炉灶、烤箱、冰箱和照片磁贴。
- 紫色入口门、黄色曲线窥孔框与角部卷饰、门板线脚、门把手；后方走廊、卧室门、青绿门、抬高地台与地毯。
- 独立拼接并沿边界裁切的鱼骨木地板、落地大窗、窗格、竹木帘、束起的织物窗帘、绿坐垫窗台和小书桌。
- 奶油色三座沙发与单椅、独立填充坐垫、包边、拼布抱枕、带褶皱和流苏的红格毛毯、绿色脚凳、车木腿茶几、花纹地毯、显像管电视、台灯与边桌。
- 圆餐桌、四把不同颜色的细杆餐椅、水果、杯碟、锅壶、木勺、书刊、盆栽和白色小花。

织物与木材使用可导出的烘焙法线贴图；地毯、拼布、格纹、木纹与砖墙贴图由确定性脚本生成。模型呈现主生活区域，平面图中的卧室与浴室通过走廊门交代。

补充参考：[LEGO Friends Apartments 展示](https://www.lego.com/en-us/product/the-friends-apartments-10292)。

## 千年隼

以用户提供的俯视图、实物模型照片及 LEGO UCS 外观为参考。按照 84 × 60 × 21 cm 的展示尺寸比例制作，原生文件保留分层、命名的外壳和机械部件。

- 带中央货舱缺口的浅锥形船体、上下装甲边缘与裸露机械夹层。
- 三圈径向分块装甲、独立小瓦片、凸点、维修盖板、通风百叶、暗红与沙色补丁、绕开散热井的成组管线和固定夹。
- 斜面、逐段收窄的双叉舰艏，真实开孔的检修井、格栅、侧面接头与薄鼻端护板。
- 六座真实凹进的冷却井、双层井圈、逐片格栅与紧固件；后部连续蓝色驱动条和外围防护栅。
- 偏置驾驶舱、通道分段装甲、分片烟色玻璃与窗框、侧面多层停靠口、四联炮及炮口、带细刻线的凹面雷达碟、背部加强肋和铰接支架。
- 七组带轴销、液压杆、斜撑与脚垫纹路的起落支撑，以及底部维修盖板，支持翻到背面和底部查看。

这是针对网页制作的 UCS 风格外观模型。尺寸依据实际顶点包络校准；原生结构的编辑与网页导出彼此保留。补充参考：[LEGO UCS 75192 展示与尺寸](https://www.lego.com/en-us/product/millennium-falcon-75192)。

## One Wish Willow

以用户新指定的 [One Wish Willow 互动网站](https://onewishwillow.app/zh/) 为准，将旧的三角锥改为长条三棱柱纸套。纸套具有真实纸张厚度、内外表面、长边压痕、端部折片、开口和部分抽出的内托。柳枝保留不均匀轮廓、树皮沟纹、细分枝、节疤与端部年轮。

印刷使用参考站公开展示的完整包装展开图，通过独立 UV 窗口映射三个长面与端盖；转到背面时图文保持正向。包装图的出处记录在 [资产来源](../public/models/collectibles/ASSET-CREDITS.md)。参考站的三维网格没有导入本项目。

## 重建与检查

```powershell
python scripts/blender/make_collectible_textures.py
& 'D:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/build_collectibles.py
node scripts/optimize-collectibles.mjs
& 'D:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/check_collectible_clearance.py
npm run typecheck
npm run test:interaction
npm run test:clearance
npm run test:public
npm run build:github
```

原生文件在 `design/collectibles/`，GLB、布局与贴图在 `public/models/collectibles/`。`lib/collectibles.ts` 定义共享摆放变换，模型单位为米，既有房间每单位约为 0.45 m。保持原有陈列位置，增加公寓基座深度后仍由书架顶面支撑。

`check_collectible_clearance.py` 对原生网格建立 BVH，检查独立家具、杯碟、灯具、盆栽、墙体、毛毯与沙发坐垫及包边，并核对飞船管路与散热组件。结构连接、装甲固定件等同一装配内部的连接接触单独处理。本次 462 组检查通过，[验收记录](collectible-clearance.json) 保留原生文件 SHA-256；重新运行时输出在 `work/qa/miniature-clearance.json`。

完整房间检查使用最终量化 GLB 的实际三角网格，覆盖三件摆件与既有物品、185 条取放与镜头路径、306,185 个姿态及连续扫过体积。尺寸、归一化原点、顶点和着色属性的有限值、受光材质、文件体积与版本哈希另行校验。

`render_collectible_details.py` 渲染正面、背面、俯视、底部和近景；`render_details.py -- --records` 检查放回完整房间后的日夜效果。离线渲染是原生源文件的检查图，不能作为浏览器截图。浏览器预览权限在本会话中被拒绝，网站的浏览器视觉与端到端交互验收仍由用户审核；发布结果通过公开 HTTP 文件与资产哈希核对。

夜间黑色外部、白天纯白空间、五秒停留导航和折叠菜单继续保留。黑猫仍只保留 [设计方案](BLACK-CAT-PROPOSAL.md)。
