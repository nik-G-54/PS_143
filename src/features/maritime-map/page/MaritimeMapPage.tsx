import { MaritimeMap } from '../map/MaritimeMap';
import '../styles/maritime-map.css';
import { Sidebar } from '../../../components/layout/Sidebar';

export function MaritimeMapPage() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar showThemeToggle />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Map fills the entire remaining viewport — no overflow-y-auto so nothing scrolls */}
        <div className="maritime-map-page-content flex-1 w-full h-full min-h-0 relative bg-background">
          <MaritimeMap />
        </div>
      </main>
    </div>
  );
}

export default MaritimeMapPage;
