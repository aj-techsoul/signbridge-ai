import fs from 'fs';
import path from 'path';
const pdf = require('pdf-parse');

interface SignDictionaryItem {
  id: string;
  word: string;
  category: 'alphabet' | 'numbers' | 'common' | 'emergency';
  description: string;
  handsDescription: string;
  emoji: string;
  fingerSpelling: string[];
}

async function extractDataset() {
  const pdfPath = path.join(__dirname, '../src/dataset for sign language.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);
  
  console.log('Parsing PDF...');
  const data = await pdf(dataBuffer);
  const text = data.text;
  
  console.log('Extracting signs...');
  const lines = text.split('\n');
  const signs: SignDictionaryItem[] = [];
  
  // Regex to match a word definition line
  // Example: "ABANDON (meaning: throw away). With both closed..."
  // Example: "ABSENT. Make signs for SIT and NO."
  const wordRegex = /^([A-Z][A-Z\s\-]+)(?:\s*\([^)]+\))?[\.\:]\s*(.*)/;
  
  let currentWord = '';
  let currentDesc = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if line looks like a new word definition
    const match = trimmed.match(wordRegex);
    if (match && match[1].length > 1 && !match[1].includes('INDIAN SIGN LANGUAGE')) { // basic filter to avoid headers
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
  const fileContent = `// Automatically generated from dataset for sign language.pdf\n\nexport const DATASET_DICTIONARY: any[] = ${JSON.stringify(signs, null, 2)};\n`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log('Saved to src/lib/datasetDictionary.ts');
}

function createSignItem(word: string, description: string): SignDictionaryItem {
  // Convert word to Title Case
  const titleCaseWord = word.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  return {
    id: word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    word: titleCaseWord,
    category: 'common',
    description: 'Indian Sign Language gesture',
    handsDescription: description.trim(),
    emoji: '🙌', // Default emoji
    fingerSpelling: word.replace(/[^A-Z]/g, '').split('') // simple finger spelling array
  };
}

extractDataset().catch(console.error);
