const fs = require('fs');
const path = require('path');

const START_ID = 681;
const END_ID = 827;
const SOURCE_README = '/tmp/gpt4o-image-prompts/README.md';
const OUTPUT_FILE = path.join(__dirname, '../data/prompts-681-827.json');

const readme = fs.readFileSync(SOURCE_README, 'utf-8');

// 按案例分割
const caseBlocks = readme.split(/(?=<a id="prompt-\d+">\s*\n## 案例 \d+)|(?=## 案例 \d+：)/);

const items = [];

for (const block of caseBlocks) {
  // 匹配案例标题
  const titleMatch = block.match(/## 案例 (\d+)：(.+?) \(来源/);
  if (!titleMatch) continue;
  
  const id = parseInt(titleMatch[1]);
  if (id < START_ID || id > END_ID) continue;
  
  const title = titleMatch[2].trim();
  
  // 提取所有代码块中的提示词
  const prompts = [];
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match;
  while ((match = codeBlockRegex.exec(block)) !== null) {
    const content = match[0].replace(/```/g, '').trim();
    if (content && content.length > 10) {
      prompts.push(content);
    }
  }
  
  // 提取来源信息
  const sourceMatch = block.match(/\(来源 \[@([^\]]+)\]\(([^)]+)\)\)/);
  const source = sourceMatch ? {
    name: `@${sourceMatch[1]}`,
    url: sourceMatch[2]
  } : { name: "gpt4o-image-prompts", url: "https://github.com/songguoxs/gpt4o-image-prompts" };
  
  items.push({
    id,
    slug: `prompt-${id}`,
    title,
    source,
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

// 按 ID 排序
items.sort((a, b) => a.id - b.id);

// 统计
const emptyCount = items.filter(i => i.prompts.length === 0).length;
console.log(`总计: ${items.length} 条`);
console.log(`有提示词: ${items.length - emptyCount} 条`);
console.log(`空提示词: ${emptyCount} 条`);

if (emptyCount > 0) {
  console.log('\n空提示词的 ID:');
  items.filter(i => i.prompts.length === 0).slice(0, 10).forEach(i => console.log(`  ${i.id}: ${i.title}`));
}

const output = {
  generatedAt: new Date().toISOString(),
  total: items.length,
  items
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`\n✅ 已保存到 ${OUTPUT_FILE}`);
