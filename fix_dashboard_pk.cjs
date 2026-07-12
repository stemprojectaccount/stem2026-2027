const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// Import FriendChallenge and Swords
if (!code.includes('import FriendChallenge')) {
  code = code.replace(
    'import {',
    'import FriendChallenge from "./FriendChallenge";\nimport {'
  );
}

if (!code.includes('Swords')) {
  code = code.replace(
    'import {',
    'import { Swords, '
  );
}

// Add state for PK Modal
if (!code.includes('showPKModal')) {
  code = code.replace(
    'export default function Dashboard({',
    'export default function Dashboard({\n  showPKModal: _showPKModal = false,\n'
  );
  code = code.replace(
    'const [chartMode, setChartMode] = useState<"weekly" | "daily">("weekly");',
    'const [chartMode, setChartMode] = useState<"weekly" | "daily">("weekly");\n  const [showPKModal, setShowPKModal] = useState(false);'
  );
}

// Add the PK button
if (!code.includes('Thách Đấu PK ⚔️')) {
  code = code.replace(
    /Vào Thách Đố 🧠\s*<\/button>/,
    `Vào Thách Đố 🧠
            </button>
            <button 
              onClick={() => setShowPKModal(true)}
              className="px-6 py-3.5 bg-rose-500/30 backdrop-blur text-white rounded-xl font-extrabold text-sm border border-white/20 hover:bg-rose-500/40 transition-all flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              Thách Đấu PK ⚔️
            </button>`
  );
}

// Add the modal component at the end of the root div
if (!code.includes('<FriendChallenge')) {
  // Find the last </div> return
  const lastDivIndex = code.lastIndexOf('</div>');
  code = code.substring(0, lastDivIndex) + `
      {showPKModal && <FriendChallenge onClose={() => setShowPKModal(false)} />}
    </div>
  `;
}

fs.writeFileSync('src/components/Dashboard.tsx', code);
