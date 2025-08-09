#!/usr/bin/env node

/**
 * Debug script to find React key issues
 * This will help identify which component is causing the key warning
 */

const fs = require('fs');
const path = require('path');

// Find all .map() calls in TSX files
function findMapCalls(dir) {
  const files = fs.readdirSync(dir);
  const results = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.')) {
      results.push(...findMapCalls(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('.map(') && line.includes('(')) {
          const lineNum = index + 1;
          const relativePath = path.relative(process.cwd(), filePath);
          
          // Check if this map call has a key
          const nextFewLines = lines.slice(index, index + 5).join('\n');
          const hasKey = nextFewLines.includes('key=');
          
          results.push({
            file: relativePath,
            line: lineNum,
            content: line.trim(),
            hasKey,
            context: nextFewLines
          });
        }
      });
    }
  }

  return results;
}

console.log('🔍 Searching for .map() calls without proper keys...\n');

const mapCalls = findMapCalls('./src');

console.log(`Found ${mapCalls.length} .map() calls:\n`);

mapCalls.forEach((call, index) => {
  console.log(`${index + 1}. ${call.file}:${call.line}`);
  console.log(`   ${call.content}`);
  console.log(`   Has key: ${call.hasKey ? '✅' : '❌'}`);
  
  if (!call.hasKey) {
    console.log('   ⚠️  POTENTIAL ISSUE - No key found in next 5 lines');
    console.log('   Context:');
    console.log(call.context.split('\n').map(l => `      ${l}`).join('\n'));
  }
  
  console.log('');
});

// Check for potential duplicate keys
console.log('\n🔍 Checking for potential duplicate key patterns...\n');

const keyPatterns = mapCalls
  .filter(call => call.hasKey)
  .map(call => {
    const keyMatch = call.context.match(/key=\{([^}]+)\}/);
    return keyMatch ? keyMatch[1] : null;
  })
  .filter(Boolean);

const duplicatePatterns = keyPatterns.filter((pattern, index) => 
  keyPatterns.indexOf(pattern) !== index
);

if (duplicatePatterns.length > 0) {
  console.log('⚠️  Found potential duplicate key patterns:');
  duplicatePatterns.forEach(pattern => console.log(`   ${pattern}`));
} else {
  console.log('✅ No obvious duplicate key patterns found');
}
