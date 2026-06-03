# 我的个人介绍网站

一个纯静态的多页个人主页，无需任何环境，**双击 `index.html` 即可打开**。

## 📁 结构

```
Myself/
├── index.html      首页 · 个人名片 + 选择「工作 / 生活」（清新明亮）
├── work.html       工作 · 学术页（优雅文艺风）
├── life.html       生活 · 思考页（活泼多彩风）
├── css/
│   ├── common.css  全站基础样式、动画
│   ├── home.css    首页样式
│   ├── work.css    工作页样式
│   └── life.css    生活页样式
├── js/
│   └── main.js     滚动入场动画、目录高亮、自动年份
└── assets/         放你的头像、照片（图片文件丢这里）
```

## ✏️ 如何修改成你自己的

所有需要替换的地方都写了**占位文字**和**注释提示**，直接搜索替换即可：

1. **名字 / 简介** —— 打开 `index.html`，把「你的名字」「一句话职业」「tagline」等改成你的。
2. **头像** —— 把照片放进 `assets/`（例如 `avatar.jpg`），再按 `index.html` 里的注释提示，把 `<div class="avatar">我</div>` 换成 `<div class="avatar"><img src="assets/avatar.jpg" alt="头像"></div>`。
3. **联系方式** —— 三个页面里的 `you@example.com`、GitHub、社交链接换成你的。
4. **工作页内容** —— `work.html`：教育、经历、技能、作品都是时间线/卡片，照着已有结构改文字即可。
5. **生活页内容** —— `life.html`：兴趣卡片、随笔便签、照片墙、喜欢的小事，按需增删。
   - 照片墙想放真实照片：把 `<div class="photo g1">☀️</div>` 换成 `<div class="photo g1"><img src="assets/1.jpg"></div>`。

## 🎨 配色在哪里调

每个 CSS 文件顶部的 `:root { ... }` 里集中定义了颜色变量，改那里就能整体换色。

## 🚀 部署（可选）

直接把整个 `Myself` 文件夹拖到 GitHub Pages / Vercel / Netlify 即可上线，无需构建。
