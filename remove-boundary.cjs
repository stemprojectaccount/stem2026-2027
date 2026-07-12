const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/<ErrorBoundary name="FusionTable"><FusionTable \/><\/ErrorBoundary>/, '<FusionTable />');
code = code.replace(/<ErrorBoundary name="Shop"><Shop([\s\S]*?)\/><\/ErrorBoundary>/g, '<Shop$1/>');
code = code.replace(/<ErrorBoundary name="Dashboard"><Dashboard([\s\S]*?)\/><\/ErrorBoundary>/g, '<Dashboard$1/>');

const boundaryRegex = /class ErrorBoundary extends React\.Component[\s\S]*?}\n\n/g;
code = code.replace(boundaryRegex, '');

fs.writeFileSync('src/App.tsx', code);
