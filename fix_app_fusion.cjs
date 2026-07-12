const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Import FusionTable
if (!code.includes('import FusionTable')) {
  code = code.replace(
    'import Shop from "./components/Shop";',
    'import Shop from "./components/Shop";\nimport FusionTable from "./components/FusionTable";'
  );
}

// Render FusionTable
if (!code.includes('<FusionTable />')) {
  const fusionRender = `          {activeTab === "fusion" && (
            <div className="p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
              <FusionTable />
            </div>
          )}

          {activeTab === "shop" && (`;
          
  code = code.replace(
    /          {activeTab === "shop" && \(/g,
    fusionRender
  );

  fs.writeFileSync('src/App.tsx', code);
}
