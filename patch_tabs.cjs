const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/pages/matches/Matches.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// Find and replace the narrow tab bar with a full-width one
const oldLines = [
  '        {/* Editorial Tab Navigation */}',
  '        <div className="max-w-7xl mx-auto mb-4">',
  '          <div className="max-w-lg mx-auto bg-zinc-900/50 p-1.5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/[0.05] flex justify-around shadow-xl overflow-hidden">',
].join('\n');

const newLines = [
  '        {/* Tab Navigation */}',
  '        <div className="max-w-4xl mx-auto">',
  '          <div className="w-full bg-zinc-900/60 p-1 rounded-xl border border-white/[0.05] flex gap-1">',
].join('\n');

// Also fix ending div structure
const oldEnd = '         </div>\n       </div>';
const newEnd = '          </div>\n        </div>';

if (c.includes(oldLines)) {
  c = c.replace(oldLines, newLines);
  console.log('Tab container: REPLACED');
} else {
  console.log('Tab container: NOT FOUND');
  const idx = c.indexOf('Editorial Tab');
  if (idx >= 0) console.log('Context:', JSON.stringify(c.slice(idx - 5, idx + 200)));
}

if (c.includes(oldEnd)) {
  c = c.replace(oldEnd, newEnd);
  console.log('Tab end: REPLACED');
} else {
  console.log('Tab end: NOT FOUND');
}

fs.writeFileSync(filePath, c, 'utf8');
console.log('Done');
