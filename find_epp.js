import fs from 'fs';
const historyDir = 'migrated_prompt_history';
const files = fs.readdirSync(historyDir);

for (const file of files) {
  const content = fs.readFileSync(historyDir + '/' + file, 'utf8');
  const index = content.indexOf('export const getEPPAdvice =');
  if (index !== -1) {
    console.log(content.substring(index, index + 1500));
    break;
  }
}
