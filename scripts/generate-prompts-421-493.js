#!/usr/bin/env node
/**
 * 从原项目 README.md 提取 421-493 案例，生成 prompts-421-493.json
 * 包含 description 的 en 和 zh 翻译
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 读取中文标题
const zhTitlesPath = '/Users/lizhen/go/nextjs/nanobananapro/src/i18n/pages/prompts/cases/zh.json';
const zhTitles = JSON.parse(fs.readFileSync(zhTitlesPath, 'utf-8'));

// 读取原项目 README
const readmePath = '/tmp/gpt4o-image-prompts/README.md';
const readme = fs.readFileSync(readmePath, 'utf-8');

/**
 * 调用 DeepSeek API 生成描述
 */
async function generateDescription(title) {
  const prompt = `请为这个图片提示词案例生成一个简短的描述（约30-50字），包括中文和英文版本。
案例标题：${title}

请以 JSON 格式返回：
{
  "zh": "中文描述",
  "en": "English description"
}`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的AI图像提示词专家，擅长为创意案例编写简洁有吸引力的描述。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.choices && result.choices[0]) {
            const content = result.choices[0].message.content;
            // 尝试解析 JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const desc = JSON.parse(jsonMatch[0]);
              resolve(desc);
            } else {
              resolve({ zh: '', en: '' });
            }
          } else {
            resolve({ zh: '', en: '' });
          }
        } catch (error) {
          console.error(`❌ 解析失败: ${title}`, error.message);
          resolve({ zh: '', en: '' });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ API 请求失败: ${title}`, error.message);
      resolve({ zh: '', en: '' });
    });

    req.write(data);
    req.end();
  });
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('📊 开始提取案例 421-493...\n');

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

  console.log(`✅ 已提取 ${items.length} 个案例\n`);

  // 为每个案例生成 description
  if (DEEPSEEK_API_KEY) {
    console.log('🤖 开始生成 description（使用 DeepSeek API）...\n');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      process.stdout.write(`[${i + 1}/${items.length}] ID ${item.id}: ${item.title} ... `);

      try {
        const description = await generateDescription(item.title);
        item.description = description;
        console.log('✓');

        // 限速：每秒最多 2 个请求
        if (i < items.length - 1) {
          await delay(500);
        }
      } catch (error) {
        console.log(`✗ (${error.message})`);
      }
    }
    console.log('\n✅ Description 生成完成\n');
  } else {
    console.log('⚠️  未设置 DEEPSEEK_API_KEY，跳过 description 生成\n');
  }

  // 生成输出
  const output = {
    generatedAt: new Date().toISOString(),
    total: items.length,
    rangeStart: 421,
    rangeEnd: 493,
    items
  };

  // 写入文件
  const outputPath = path.join(__dirname, '../data/prompts-421-493.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`✅ 已生成文件: data/prompts-421-493.json`);
  console.log(`   案例数量: ${items.length}`);
  console.log(`   案例范围: ${items[items.length - 1].id} - ${items[0].id}`);
}

main().catch(console.error);
