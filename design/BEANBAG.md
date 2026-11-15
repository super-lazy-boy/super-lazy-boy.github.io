# 棉质豆袋懒人沙发

2026-11-15，依据用户提供的米色豆袋沙发照片重建，并根据「表面像橡胶」的反馈进一步调整棉质表面。

## 形体与织物

- 一块闭合的软包曲面连接靠背、侧翼、坐窝和贴地底部，撤去原木质框架、分离靠背和脚凳。中央坐窝明显下陷，靠背与前缘保持充足填充，底部形成受重压扁的接触面。
- 主软包含 48,898 个顶点、97,792 个三角面、48 组不规则大褶皱；靠背中央与坐面前缘收拢，褶皱过渡到坐窝，轮廓保留轻微不对称。
- 燕麦色棉布由原创 1024 × 1024 色彩、法线和粗糙度贴图组成。经纬线交错、纱线粗细起伏和细小棉纤维共同表现干爽织物；贴图直接打包到原生文件与 GLB。
- 降低表面反射，原生 Principled Specular IOR Level 为 0.20，Sheen Weight 为 0.34，纤维光泽使用宽而柔和的响应；关闭清漆和透射。网页导出保留相应的 specular、sheen 和法线参数。
- 缝合改为间断双排棉线，后侧保留隐藏式闭合拉链。苔绿抱枕与芥末色毛毯重新按真实软包曲面摆放，地面抱枕、地毯、边几与游戏手柄沿用原位置。

## 原模型与布局保护

原生 Blender 文件中，座椅更新范围外的 1,640 个物件逐项保留网格、UV、材质绑定与世界变换。发布文件只替换 lounge 与 soft furnishings，其他 199 个网页模型组保持原顶点、UV、材质、贴图及变换，避免重新量化整间房间。六个收藏摆件文件保持原哈希。

主房间 GLB 当前为 14,974,372 字节、567,377 个三角面、206 组图元；七个 GLB 合计 27,649,396 字节、1,297,305 个三角面、275 组图元。新增成本用于软包曲面、缝线及三张棉布贴图；渲染清晰度、光照和阴影设置不变。Meshopt 编码逐项核对解码后的顶点、朝向、原始图像、材质及场景变换，不做减面。

## 验证与渲染

原生网格检查确认软包闭合、法线朝外、零自相交；抱枕、毛毯与地面抱枕三个独立组件不穿过软包或彼此相交。流苏与毛毯缝合为同一织物组件，缝线属于软包的连接部件。底部最低点 Y=0.04407，位于地毯表面以上；坐窝中心 Y=0.485，靠背最高约 Y=1.64385。

原生检查同时核对三张打包棉布图片与磁盘原图哈希，防止重用旧的光滑材质缓存。网页 GLB 检查织物分辨率、坐窝深度和比例、粗糙度、法线及低反射参数。88 项自动检查通过，包含完整房间内的书本、录像带、抽屉、窗帘、投影与镜头路径校验。

`render_beanbag.py` 生成实际原生模型的裸沙发近景及房间昼夜近景，输出位于忽略提交的 `work/qa/beanbag-*.png`。这些是 Blender 渲染，未作为 Chrome / Edge 实机截图或 GPU 性能结果。

## 重建

```powershell
python scripts/blender/beanbag_textures.py
& 'D:/Program Files (x86)/Steam/steamapps/common/Blender/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/update_beanbag.py
& 'D:/Program Files (x86)/Steam/steamapps/common/Blender/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/check_beanbag.py
node scripts/install-beanbag.mjs
node scripts/compress-models.mjs
npm run test:clearance
npm run build
```

原生源文件为 `design/sunlit-room.blend`，软包生成逻辑位于 `scripts/blender/beanbag_surface.py` 与 `floor_lounge.py`。完整房间重建仍调用同一个软包生成器。
