#!/usr/bin/env node
/**
 * 从原项目 README.md 提取 421-493 案例，生成 prompts-1.json
 */

const fs = require('fs');
const path = require('path');

// 读取中文标题
const zhTitles = require('../../../nanobananapro/src/i18n/pages/prompts/cases/zh.json');

// 读取原项目 README
const readmePath = '/tmp/gpt4o-image-prompts/README.md';
const readme = fs.readFileSync(readmePath, 'utf-8');

// 解析案例数据
const items = [];
const caseRegex = /## 案例 (\d+)：(.+?) \(来源 \[(.+?)\]\((.+?)\)\)/g;
let match;

while ((match = caseRegex.exec(readme)) !== null) {
  const id = parseInt(match[1]);

  // 只处理 421-493
  if (id < 421 || id > 493) continue;

  const title = match[2];
  const sourceName = match[3];
  const sourceUrl = match[4];

  // 查找图片
  const imageBasePath = '/tmp/gpt4o-image-prompts/images';
  let coverImage = null;

  // 尝试 jpeg 和 png
  if (fs.existsSync(path.join(imageBasePath, `${id}.jpeg`))) {
    coverImage = `images/${id}.jpeg`;
  } else if (fs.existsSync(path.join(imageBasePath, `${id}.png`))) {
    coverImage = `images/${id}.png`;
  }

  items.push({
    id,
    slug: `prompt-${id}`,
    title: zhTitles[id.toString()] || title,
    source: {
      name: sourceName,
      url: sourceUrl
    },
    images: coverImage ? [coverImage] : [],
    prompts: [],
    examples: [],
    notes: [],
    originFile: "README.md",
    description: {
      en: "",
      zh: ""
    },
    tags: [],
    coverImage: coverImage || ""
  });
}

// 按 id 降序排序
items.sort((a, b) => b.id - a.id);

// 生成输出
const output = {
  generatedAt: new Date().toISOString(),
  total: items.length,
  items
};

// 写入文件
const outputPath = path.join(__dirname, '../data/prompts-1.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`✅ 已生成 ${items.length} 个增量案例到 prompts-1.json`);
console.log(`   案例范围: ${items[items.length - 1].id} - ${items[0].id}`);
