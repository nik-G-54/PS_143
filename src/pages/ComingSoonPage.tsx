import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Video, 
  Clock, 
  Sparkles
} from 'lucide-react';

interface ComingSoonPageProps {
  title?: string;
  description?: string;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ 
  title, 
  description 
}) => {
  const location = useLocation();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/live-map':
        return {
          pageTitle: title || 'Live Map',
          icon: <Map size={40} className="text-primary" />,
          desc: description || 'Real-time satellite oil spill tracking, CMEMS ocean drift vectors, and interactive GIS mapping module is currently under development.'
        };
      case '/incidents':
        return {
          pageTitle: title || 'Incidents Directory',
          icon: <AlertTriangle size={40} className="text-primary" />,
          desc: description || 'Comprehensive marine incident database, historical anomaly records, and multi-filter investigation records are coming soon.'
        };
      case '/incident-reconstruction':
        return {
          pageTitle: title || '3D Incident Reconstruction',
          icon: <Video size={40} className="text-primary" />,
          desc: description || 'High-fidelity 3D marine physics simulation, hydrodynamic ocean surface modeling, and vessel trajectory replay feature is in development.'
        };
      default:
        return {
          pageTitle: title || 'Page Under Construction',
          icon: <Clock size={40} className="text-primary" />,
          desc: description || 'This feature module is currently under active development and will be available in upcoming system updates.'
        };
    }
  };

  const { pageTitle, icon, desc } = getPageInfo();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
          <div className="max-w-md w-full space-y-6 bg-card border border-border p-8 rounded-2xl shadow-xl relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            {/* Icon Header */}
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
              {icon}
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase">
              <Sparkles size={12} />
              <span>Coming Soon</span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all duration-150 active:scale-95"
              >
                <LayoutDashboard size={16} />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComingSoonPage;
