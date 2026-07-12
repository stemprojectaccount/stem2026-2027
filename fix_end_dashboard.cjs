const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

if (!code.endsWith(');\\n}')) {
  // Try to see if it just ends with '</div>'
  code = code.trim();
  if (code.endsWith('</div>')) {
    code += '\\n  );\n}';
  } else if (!code.includes(');\\n}')) {
      code += '\\n  );\n}';
  }
}
fs.writeFileSync('src/components/Dashboard.tsx', code);
