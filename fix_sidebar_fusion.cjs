const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

if (!code.includes('Bàn Dung Hợp')) {
  // Add an icon like Cpu or Sparkle? Let's use Component or Orbit. Oh we have `Layers` or `Sparkles`. Let's import `Wand2` from lucide-react.
  if (!code.includes('Wand2')) {
    code = code.replace(
      'import { \n  LayoutDashboard,',
      'import { \n  LayoutDashboard,\n  Wand2,'
    );
  }

  const fusionMenuItem = `    { 
      id: "fusion", 
      label: "Bàn Dung Hợp", 
      mobileLabel: "Dung hợp",
      icon: Wand2, 
      color: "text-fuchsia-500", 
      bg: "hover:bg-fuchsia-50/50 hover:text-fuchsia-600" 
    },
    { 
      id: "shop",`;

  code = code.replace(
    '    { \n      id: "shop",',
    fusionMenuItem
  );

  fs.writeFileSync('src/components/Sidebar.tsx', code);
}
