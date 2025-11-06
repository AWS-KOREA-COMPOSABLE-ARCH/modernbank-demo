/**
 * 모든 React 컴포넌트 파일에 useLanguage 훅을 자동으로 추가하는 스크립트
 */

const fs = require('fs');
const path = require('path');

// File extensions to process
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build'];

// useLanguage import statement
const USE_LANGUAGE_IMPORT = `import { useLanguage } from "@/contexts/LanguageContext";`;

// useLanguage hook usage declaration
const USE_LANGUAGE_HOOK = `  const { t } = useLanguage();`;

/**
 * 디렉토리를 재귀적으로 탐색하여 React 컴포넌트 파일들을 찾음
 */
function findReactFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !EXCLUDE_DIRS.includes(item)) {
      findReactFiles(fullPath, files);
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(item))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 파일이 React 컴포넌트인지 확인
 */
function isReactComponent(content) {
  return (
    content.includes('export default function') ||
    content.includes('export function') ||
    content.includes('const ') && content.includes('= () =>') ||
    content.includes('function ') && content.includes('() {')
  ) && (
    content.includes('return (') ||
    content.includes('return <')
  );
}

/**
 * 파일에 이미 useLanguage가 있는지 확인
 */
function hasUseLanguage(content) {
  return content.includes('useLanguage') || content.includes("from '@/contexts/LanguageContext'");
}

/**
 * 파일에 한글이 포함되어 있는지 확인
 */
function hasKorean(content) {
  return /[\u3131-\u318E\uAC00-\uD7A3]/.test(content);
}

/**
 * 파일에 useLanguage 지원을 추가
 */
function addUseLanguageSupport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if not a React component or already has useLanguage
  if (!isReactComponent(content) || hasUseLanguage(content) || !hasKorean(content)) {
    return false;
  }
  
  console.log(`Processing: ${filePath}`);
  
  // Add import statement
  const importMatch = content.match(/import.*from.*['"][^'"]+['"];?\s*\n/g);
  if (importMatch) {
    const lastImport = importMatch[importMatch.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;
    
    content = content.slice(0, insertIndex) + USE_LANGUAGE_IMPORT + '\n' + content.slice(insertIndex);
  }
  
  // Add useLanguage hook
  const functionMatch = content.match(/export default function \w+\([^)]*\)\s*{/);
  if (functionMatch) {
    const hookInsertIndex = content.indexOf('{', content.indexOf(functionMatch[0])) + 1;
    content = content.slice(0, hookInsertIndex) + '\n' + USE_LANGUAGE_HOOK + '\n' + content.slice(hookInsertIndex);
  }
  
  // Save file
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

/**
 * 메인 실행 함수
 */
function main() {
  const appDir = path.join(__dirname, '../app');
  const componentDir = path.join(__dirname, '../components');
  
  console.log('Finding React component files...');
  
  const files = [
    ...findReactFiles(appDir),
    ...findReactFiles(componentDir)
  ];
  
  console.log(`Found ${files.length} files to process`);
  
  let processedCount = 0;
  
  for (const file of files) {
    try {
      if (addUseLanguageSupport(file)) {
        processedCount++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\nProcessed ${processedCount} files successfully!`);
}

// Execute script
if (require.main === module) {
  main();
}

module.exports = { addUseLanguageSupport, findReactFiles };