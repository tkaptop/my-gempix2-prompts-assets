const fs = require('fs');
const path = require('path');

const START_ID = 671;
const END_ID = 680;
const SOURCE_README = '/tmp/gpt4o-image-prompts/README.md';
const OUTPUT_FILE = path.join(__dirname, '../data/prompts-671-680.json');

// 读取 README
const readme = fs.readFileSync(SOURCE_README, 'utf-8');

// 解析案例
const items = [];
const caseRegex = /## 案例 (\d+)：(.+?) \(来源.+?\n([\s\S]*?)(?=## 案例 \d+|$)/g;

let match;
while ((match = caseRegex.exec(readme)) !== null) {
  const id = parseInt(match[1]);
  if (id >= START_ID && id <= END_ID) {
    const title = match[2].trim();
    const content = match[3];
    
    // 提取提示词
    const prompts = [];
    const promptBlocks = content.match(/```[\s\S]*?```/g) || [];
    promptBlocks.forEach(block => {
      const text = block.replace(/```/g, '').trim();
      if (text) prompts.push(text);
    });
    
    // 提取普通文本提示词（非代码块）
    const textPrompts = content.match(/(?:提示词|中文提示词)[:：]\s*\n*([\s\S]*?)(?=\n\n|提示词|中文提示词|$)/gi) || [];
    
    items.push({
      id,
      slug: `prompt-${id}`,
      title,
      source: { name: "gpt4o-image-prompts", url: `https://github.com/songguoxs/gpt4o-image-prompts` },
      images: [`images/${id}.jpeg`],
      prompts,
      examples: [],
      notes: [],
      originFile: "README.md",
      description: { zh: "", en: "" },
      tags: [],
      coverImage: `images/${id}.jpeg`
    });
  }
}

// 按 ID 排序
items.sort((a, b) => a.id - b.id);

const output = {
  generatedAt: new Date().toISOString(),
  total: items.length,
  items
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`✅ 生成 ${items.length} 条数据到 ${OUTPUT_FILE}`);
console.log(`   范围: ${items[0]?.id || 'N/A'} - ${items[items.length-1]?.id || 'N/A'}`);
