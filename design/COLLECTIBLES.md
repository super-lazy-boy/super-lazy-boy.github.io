# 新增收藏 · 建模与摆放

本轮加入三件原创建模的参考作品。源文件保存在 `design/collectibles/`，网页资产保存在 `public/models/collectibles/`。三件模型与现有 TARDIS、《星空》共用折叠收藏菜单、旋转、缩放与重置角度功能；也可点击房间中的模型查看。

## 莫妮卡的公寓

采用开放剖面的微缩房间，约 45 × 28 × 12.8 cm。包含紫色墙壁、带黄色窥孔框的门、青蓝色厨房、冰箱及磁贴、炉灶、吊锅、水槽、橱柜、圆餐桌与不同颜色的餐椅、客厅窗户、奶油色沙发、绿色脚凳、茶几和电视。

这是一件手工微缩风格的公寓场景，不是将 LEGO 10292 整套公寓直接导入。参考其公开展示的经典布景和道具。摆放在书架顶层，原有三件陶器重新排列，保留间隔。

参考：[LEGO Friends Apartments 官方展示](https://www.lego.com/en-us/product/the-friends-apartments-10292)。

## 千年隼

参照 LEGO UCS 75192 的外观与约 84 × 60 × 21 cm 的尺寸比例制作，保留积木与展示模型的质感。包含双叉舰艏、偏置驾驶舱、分块船壳、积木凸点、六处散热口、外围机械结构、后部蓝色发动机条、雷达碟、四联炮与七处起落支撑。

这是针对网页制作的外观研究模型，不是官方套装的逐砖数字复制。原生文件保留独立部件与共享基础网格；网页导出时按材质合并。尺寸根据真实顶点包络校准，避免旋转圆柱的局部包围盒造成比例误差。

放置于新增的胡桃木低展示台上，长轴朝房间横向。展示台位于前景中部，避开地面书籍、猫咪未来可能使用的行走通道、座椅和投影光路。

参考：[LEGO 75192 官方展示与尺寸](https://www.lego.com/en-us/product/millennium-falcon-75192)。

## 许愿柳

按《痴迷》宣传网站的 One Wish Willow 包装外观制作：白色三角锥形纸盒与红色三行字样，旁边保留暗色柳枝、细分枝、表面纤维与中间黑色部位。印刷贴图为重新排版绘制，三角形各高度的可用宽度独立留出边距，防止文字被侧边裁掉。

摆放在影音柜右侧台面，低于投影幕底边；保留与播放器、抽屉、录像带和植物的间隔。

参考：[One Wish Willow 官方宣传站](https://www.onewishwillow.com/)、[Focus Features 影片介绍](https://www.focusfeatures.com/article/obsession-s-filmmaker-takes-horror-to-the-next-scary-level)。没有采用非官方仿品商店的商品说明。

## 重建与校验

```powershell
python scripts/blender/make_collectible_textures.py
& 'D:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe' --background --factory-startup --python scripts/blender/build_collectibles.py
node scripts/optimize-collectibles.mjs
```

`room_collectible_display.py` 在房间重建流程中安装展示台并重新排列书架陶器。`lib/collectibles.ts` 定义摆放位置和物理尺度；模型使用米，房间既有尺寸约为每单位 0.45 m。

碰撞检查将三件最终 GLB 按网页中的真实变换加入房间 BVH，检查独立摆件与全部房间物件、取书、插带、抽屉、相邻摆件和镜头的路径。版本校验同时核对三个文件的 SHA-256。离线完整房间预览从原生源文件加载这些模型，不把它们烘焙成背景图。

夜间背景根据最新要求改为近黑色，白天仍为纯白。黑猫本轮仅提供 [设计方案](BLACK-CAT-PROPOSAL.md)，没有制作或接入模型、动画和行为代码。
