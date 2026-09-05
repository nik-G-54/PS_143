
import { MaritimeMap } from '../map/MaritimeMap';
import '../styles/maritime-map.css';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Header } from '../../../components/layout/Header';

export function MaritimeMapPage() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <div className="maritime-map-page-content flex-1 w-full min-h-0 overflow-y-auto relative bg-background">
          <MaritimeMap />
        </div>
      </main>
    </div>
  );
}

export default MaritimeMapPage;
