const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// Remove the showPKModal: _showPKModal = false from props
code = code.replace('showPKModal: _showPKModal = false,', '');

// Add the useState
code = code.replace(
  'const [chartMode',
  'const [showPKModal, setShowPKModal] = useState(false);\n  const [chartMode'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
