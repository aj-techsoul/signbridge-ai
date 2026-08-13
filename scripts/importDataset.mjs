import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractDataset() {
  const pdfPath = path.join(__dirname, '../src/dataset for sign language.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);
  
  console.log('Parsing PDF...');
  const data = await pdf(dataBuffer);
  const text = data.text;
  
  console.log('Extracting signs...');
  const lines = text.split('\n');
  const signs = [];
  
  // Regex to match a word definition line
  const wordRegex = /^([A-Z][A-Z\s\-]+)(?:\s*\([^)]+\))?[\.\:]\s*(.*)/;
  
  let currentWord = '';
  let currentDesc = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const match = trimmed.match(wordRegex);
    if (match && match[1].length > 1 && !match[1].includes('INDIAN SIGN LANGUAGE')) { 
      if (currentWord) {
        signs.push(createSignItem(currentWord, currentDesc));
      }
      currentWord = match[1].trim();
      currentDesc = match[2].trim() + ' ';
    } else if (currentWord) {
      currentDesc += trimmed + ' ';
    }
  }
  
  if (currentWord) {
    signs.push(createSignItem(currentWord, currentDesc));
  }
  
  console.log(`Extracted ${signs.length} signs.`);
  
  const outputPath = path.join(__dirname, '../src/lib/datasetDictionary.ts');
  const fileContent = `// Automatically generated from dataset for sign language.pdf\nimport { SignDictionaryItem } from './signData';\n\nexport const DATASET_DICTIONARY: SignDictionaryItem[] = ${JSON.stringify(signs, null, 2)};\n`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log('Saved to src/lib/datasetDictionary.ts');
}

function createSignItem(word, description) {
  const titleCaseWord = word.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    id: word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    word: titleCaseWord,
    category: 'common',
    description: 'Indian Sign Language gesture',
    handsDescription: description.trim(),
    emoji: '🙌',
    fingerSpelling: word.replace(/[^A-Z]/g, '').split('')
  };
}

extractDataset().catch(console.error);
