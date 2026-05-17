import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  UserCircle2, 
  Home, 
  BookOpen, 
  Calendar as CalendarIcon, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Heart,
  PlusCircle,
  FileText,
  AlertCircle,
  Shield
} from 'lucide-react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, getDocs } from 'firebase/firestore';
import { cn } from './lib/utils';

import { Logo } from './components/Logo';
import Dashboard from './components/Dashboard';
import GirlsList from './components/GirlsList';
import VisitsList from './components/VisitsList';
import SchoolAttendance from './components/SchoolAttendance';
import CalendarModule from './components/CalendarModule';
import StaffModule from './components/StaffModule';
import RolesPermissions from './components/RolesPermissions';
import Login from './components/Login';

type ViewPath = 'dashboard' | 'perfiles' | 'registro' | 'visitas' | 'apoyo-escolar' | 'calendario' | 'staff' | 'roles';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewPath>('dashboard');
  const [targetGirlId, setTargetGirlId] = useState<string | null>(null);

  const navigateToAttendance = (girlId: string) => {
    setTargetGirlId(girlId);
    setCurrentView('apoyo-escolar');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amparo-navy">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'perfiles', label: 'Perfiles de Niñas', icon: UserCircle2 },
    { id: 'registro', label: 'Registro de Niñas', icon: PlusCircle },
    { id: 'visitas', label: 'Visitas Familiares', icon: Home },
    { id: 'apoyo-escolar', label: 'Apoyo Escolar', icon: BookOpen },
    { id: 'calendario', label: 'Calendario', icon: CalendarIcon },
    { id: 'staff', label: 'Gestión de Usuarios', icon: Users },
    { id: 'roles', label: 'Roles y Permisos', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-amparo-navy text-white hidden lg:flex flex-col shrink-0">
        <div className="p-8 flex flex-col items-center border-b border-white/5">
          <Logo variant="light" className="h-14 mb-4" />
          <div className="text-center">
            <h1 className="font-bold text-lg leading-tight tracking-tight uppercase">Amparo Bolivia</h1>
            <p className="text-[10px] text-slate-500 tracking-widest font-bold uppercase">Prevención</p>
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          <div className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Menú Principal</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewPath)}
              className={cn(
                "w-full flex items-center gap-3 px-8 py-3.5 transition-all duration-200 border-l-4",
                currentView === item.id 
                  ? "bg-white/5 text-brand-primary border-brand-primary font-bold" 
                  : "hover:bg-white/[0.02] text-slate-400 hover:text-white border-transparent"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-colors",
                currentView === item.id ? "text-brand-primary" : "text-slate-600"
              )} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-slate-950 border-t border-slate-900">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <UserCircle2 size={18} />
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-xs font-bold truncate">{user.email}</p>
               <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Administrador</p>
             </div>
             <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors">
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Scrollable for more items */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-amparo-navy border-t border-white/20 z-50 px-2 py-2 flex items-center overflow-x-auto no-scrollbar shadow-[0_-8px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <div className="flex items-center gap-1 min-w-max">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewPath)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 min-w-[70px]",
                currentView === item.id 
                  ? "text-brand-primary" 
                  : "text-slate-300"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg mb-0.5 transition-colors",
                currentView === item.id ? "bg-brand-primary/10" : "bg-transparent"
              )}>
                <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-tight truncate max-w-[64px]",
                currentView === item.id ? "text-brand-primary" : "text-slate-400"
              )}>{item.label === 'Roles y Permisos' ? 'Permisos' : item.label === 'Gestión de Usuarios' ? 'Usuarios' : item.label}</span>
            </button>
          ))}
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-1 px-3 text-rose-400 transition-colors active:scale-95 min-w-[70px]"
          >
            <div className="p-1.5 bg-rose-400/10 rounded-lg mb-0.5">
              <LogOut size={20} />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-tight">Salir</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 lg:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <Logo variant="dark" className="h-8 w-auto" />
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 truncate max-w-[150px] lg:max-w-none">
              {navItems.find(n => n.id === currentView)?.label || currentView}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
              onClick={() => setCurrentView('registro')}
              className="p-2 lg:px-4 lg:py-2 bg-amparo-purple text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
              title="Registrar Niña"
             >
               <PlusCircle size={18} />
               <span className="hidden lg:inline">Registrar Niña</span>
             </button>
             <button 
              onClick={() => setCurrentView('visitas')}
              className="p-2 lg:px-4 lg:py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary-dark transition-all shadow-sm flex items-center gap-2"
              title="Nueva Visita"
             >
               <Home size={18} />
               <span className="hidden lg:inline">Nueva Visita</span>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {currentView === 'dashboard' && <Dashboard onNavigate={(view: any) => setCurrentView(view)} />}
          {currentView === 'perfiles' && <GirlsList viewType="perfiles" onSelectStats={navigateToAttendance} />}
          {currentView === 'registro' && <GirlsList viewType="registro" />}
          {currentView === 'visitas' && <VisitsList />}
          {currentView === 'apoyo-escolar' && <SchoolAttendance initialGirlId={targetGirlId} onCloseStats={() => setTargetGirlId(null)} />}
          {currentView === 'calendario' && <CalendarModule />}
          {currentView === 'staff' && <StaffModule />}
          {currentView === 'roles' && <RolesPermissions />}
        </div>
      </main>
    </div>
  );
}
