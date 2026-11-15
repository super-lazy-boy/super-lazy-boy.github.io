# 低矮棉质豆袋沙发 · 轮廓重建

2026-11-15：根据用户「形状不像参考图、没有沙发质感」的反馈，重新构造填充体，不再沿用上一版高背薄围边的参数曲面。

## 体块与布面

- 外壳采用压在地毯上的宽圆填充体，坐窝作为偏心压陷进入整体。前缘形成两个厚实的鼓包和中间收拢凹缝，坐面保留略微起伏的填充层，不形成空洞式硬质碗面。
- 靠背最高点从上一版约 1.644 降到 1.29405，整体降低约两成；坐窝采样高度 0.58438，底部最低点 0.04400。主软包含 48,898 个顶点、97,792 个三角面、37 组不规则大褶皱。
- 棉布改为暖燕麦色的细密混色纱线，去除抢眼的条纹网格。三张 1024 × 1024 贴图分别控制色彩、法线与粗糙度。72 组更细的受压褶皱写入独立法线图集，用第二套 UV 保持位置稳定；第一套 UV 保留细密纤维的物理重复频率。
- 原生 Specular IOR Level 为 0.18，Sheen Weight 为 0.25，关闭清漆和透射。导出的 GLB 保留低反射、粗糙度、纤维光泽及独立法线 UV。
- 保留前后中央的间断双排缝线与隐藏拉链，去除侧面的连续围边感。绿色抱枕移到地毯上，移除遮挡前缘的搭毯，让完整轮廓与坐窝露出；原有地面抱枕、篮筐、边几与手柄保留。

## 保护现有房间

座椅范围外的 1,640 个原生网格保留顶点、UV、材质绑定及世界变换。网页只替换 lounge 与 soft furnishings，其他 199 个模型组保留原始几何、纹理和变换；六件收藏 GLB 保持原哈希。

主房间为 14,559,980 字节、553,945 个三角面、206 组图元。七个 GLB 合计 27,235,004 字节、1,283,873 个三角面、275 组图元。保留无损 Meshopt 编码和解码一致性核对，不更改 DPR、SMAA、灯光、阴影与环境遮蔽设置。

## 检查

原生模型检查软包闭合、法线朝外、零自相交，并核对实际打包棉布图片与原图哈希。地面两个独立抱枕不穿过软包、地毯或彼此。网页 GLB 检查低矮比例、压陷坐窝、织物分辨率、低反射参数，以及独立法线图集 UV。

88 项自动检查通过，包括既有的书籍、录像带、抽屉、窗帘、投影和镜头路径。原生渲染检查裸模型轮廓与房间昼夜近景；这些是 Blender 渲染，不是 Chrome / Edge 实机截图或 GPU 性能录制。

## 重建与预览

```powershell
python scripts/blender/beanbag_textures.py
& 'D:/Program Files (x86)/Steam/steamapps/common/Blender/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/update_beanbag.py
& 'D:/Program Files (x86)/Steam/steamapps/common/Blender/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/check_beanbag.py
node scripts/install-beanbag.mjs
node scripts/compress-models.mjs
npm run test:clearance
npm run build
```

`update_beanbag.py -- --prototype` 只写入忽略提交的 `work/qa/beanbag-prototype.blend`，不替换房间源文件或发布资产。`render_beanbag.py -- bare --prototype` 用于先比较裸模型；确认轮廓后再生成发布模型。实际原生源文件是 `design/sunlit-room.blend`。
