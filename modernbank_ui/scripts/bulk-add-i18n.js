#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Page files to process
const pageFiles = [
  'app/(account)/retrieveTransactionHistory/page.tsx',
  'app/(customer)/retrieveCustomer/page.tsx',
  'app/(customer)/retrieveCustomerCQRS/page.tsx',
  'app/(product)/retrieveProduct/page.tsx',
  'app/(transfer)/retrieveTransferHistory/page.tsx',
  'app/(auth)/signup/page.tsx',
  'app/api-docs/page.tsx'
];

// Add useLanguage import
const addUseLanguageImport = (content) => {
  if (content.includes('useLanguage') || content.includes("from '@/contexts/LanguageContext'")) {
    return content;
  }

  // Find React import
  const reactImportMatch = content.match(/import.*from ['"]react['"];?\s*\n/);
  if (reactImportMatch) {
    const insertIndex = content.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
    return content.slice(0, insertIndex) + 
           'import { useLanguage } from "@/contexts/LanguageContext";\n' + 
           content.slice(insertIndex);
  }

  return content;
};

// Add useLanguage hook
const addUseLanguageHook = (content) => {
  if (content.includes('const { t } = useLanguage()')) {
    return content;
  }

  // Find function component
  const functionMatch = content.match(/export default function \w+\([^)]*\)\s*{/);
  if (functionMatch) {
    const hookInsertIndex = content.indexOf('{', content.indexOf(functionMatch[0])) + 1;
    return content.slice(0, hookInsertIndex) + 
           '\n  const { t } = useLanguage();\n' + 
           content.slice(hookInsertIndex);
  }

  return content;
};

// Replace common Korean texts
const replaceCommonKoreanTexts = (content) => {
  const replacements = [
    // Common texts
    ['"조회"', "t('common.search')"],
    ['"등록"', "t('common.create')"],
    ['"수정"', "t('common.edit')"],
    ['"삭제"', "t('common.delete')"],
    ['"확인"', "t('common.confirm')"],
    ['"취소"', "t('common.cancel')"],
    ['"저장"', "t('common.save')"],
    ['"처리중..."', "t('common.loading')"],
    ['"성공"', "t('common.success')"],
    ['"오류"', "t('common.error')"],
    ['"알림"', "t('common.info')"],
    
    // Account related
    ['"계좌 번호"', "t('account.number')"],
    ['"계좌명"', "t('account.name')"],
    ['"잔액"', "t('account.balance')"],
    ['"거래 내역"', "t('account.transactionHistory')"],
    ['"거래일시"', "t('account.transactionDate')"],
    ['"거래금액"', "t('account.transactionAmount')"],
    
    // Customer related
    ['"고객 ID"', "t('customer.id')"],
    ['"고객명"', "t('customer.name')"],
    ['"나이"', "t('customer.age')"],
    ['"성별"', "t('customer.gender')"],
    ['"주소"', "t('customer.address')"],
    ['"전화번호"', "t('customer.phone')"],
    
    // Transfer related
    ['"이체 금액"', "t('transfer.amount')"],
    ['"출금 계좌"', "t('transfer.fromAccount')"],
    ['"입금 계좌"', "t('transfer.toAccount')"],
    ['"이체 완료"', "t('transfer.completed')"],
    ['"이체 실패"', "t('transfer.failed')"],
    
    // Product related
    ['"상품명"', "t('product.name')"],
    ['"상품 설명"', "t('product.description')"],
    ['"가격"', "t('product.price')"],
    ['"상태"', "t('product.status')"]
  ];

  let result = content;
  for (const [korean, i18nKey] of replacements) {
    result = result.replace(new RegExp(korean, 'g'), `{${i18nKey}}`);
  }

  return result;
};

// Main processing function
const processFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Add useLanguage import
  content = addUseLanguageImport(content);
  
  // Add useLanguage hook
  content = addUseLanguageHook(content);
  
  // Replace common Korean texts
  content = replaceCommonKoreanTexts(content);
  
  // Save file
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Processed: ${filePath}`);
};

// Process all files
console.log('Starting bulk i18n application...\n');

pageFiles.forEach(processFile);

console.log('\n✅ Bulk i18n application completed!');
console.log('\nNote: You may need to manually adjust some translations for context-specific meanings.');