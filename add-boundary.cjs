const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const boundary = `
class ErrorBoundary extends React.Component<{ children: React.ReactNode, name: string }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error in", this.props.name, error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4 bg-red-100 text-red-900 border border-red-500 rounded">Error in {this.props.name}: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}
`;

if (!code.includes('class ErrorBoundary')) {
  code = code.replace('export default function App() {', boundary + '\nexport default function App() {');
}

code = code.replace('<FusionTable />', '<ErrorBoundary name="FusionTable"><FusionTable /></ErrorBoundary>');
code = code.replace(/<Shop([\s\S]*?)\/>/, '<ErrorBoundary name="Shop"><Shop$1/></ErrorBoundary>');
code = code.replace(/<Dashboard([\s\S]*?)\/>/, '<ErrorBoundary name="Dashboard"><Dashboard$1/></ErrorBoundary>');

fs.writeFileSync('src/App.tsx', code);
