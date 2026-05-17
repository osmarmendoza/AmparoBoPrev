import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Users, Home, BookOpen, AlertTriangle, TrendingUp, Calendar, AlertCircle, BarChart3, PlusCircle, Search } from 'lucide-react';

interface Props {
  onNavigate: (view: 'dashboard' | 'perfiles' | 'registro' | 'visitas' | 'apoyo-escolar' | 'calendario' | 'staff' | 'roles') => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState({
    totalGirls: 0,
    totalVisits: 0,
    riskRed: 0,
    riskAmber: 0,
    avgAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const gSnap = await getDocs(collection(db, 'girls'));
        const vSnap = await getDocs(collection(db, 'visits'));
        
        const girlsData = gSnap.docs.map(d => d.data());
        
        setStats({
          totalGirls: gSnap.size,
          totalVisits: vSnap.size,
          riskRed: girlsData.filter(g => g.codigoRiesgo === 'rojo').length,
          riskAmber: girlsData.filter(g => g.codigoRiesgo === 'amarillo').length,
          avgAttendance: 0 // Would calculate from attendance collection
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'multiple_collections');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mock data for initial layout - in real app, these would be aggregated from Firestore
  const visitsPerStaffData = [
    { name: 'Maria G.', visits: 12 },
    { name: 'Juan P.', visits: 19 },
    { name: 'Elena R.', visits: 15 },
    { name: 'Carlos M.', visits: 8 },
    { name: 'Ana S.', visits: 22 },
  ];

  const riskFactorsData = [
    { name: 'Disfuncional', value: 45 },
    { name: 'Pobreza', value: 30 },
    { name: 'Abuso', value: 15 },
    { name: 'Adicciones', value: 10 },
  ];

  const attendanceTrend = [
    { month: 'Ene', p: 85, a: 10, c: 5 },
    { month: 'Feb', p: 88, a: 8, c: 4 },
    { month: 'Mar', p: 82, a: 12, c: 6 },
    { month: 'Abr', p: 90, a: 5, c: 5 },
    { month: 'May', p: 92, a: 4, c: 4 },
  ];

  const COLORS = ['#f25b0a', '#10b981', '#ef4444', '#3b82f6', '#0f172a'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Quick Actions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Acceso Directo</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onNavigate('registro')}
            className="flex flex-col items-center justify-center p-6 bg-amparo-purple text-white rounded-3xl shadow-lg shadow-purple-100 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
              <PlusCircle size={24} />
            </div>
            <span className="text-sm font-bold">Registrar Niña</span>
          </button>

          <button 
            onClick={() => onNavigate('visitas')}
            className="flex flex-col items-center justify-center p-6 bg-brand-primary text-white rounded-3xl shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
              <Home size={24} />
            </div>
            <span className="text-sm font-bold">Nueva Visita</span>
          </button>

          <button 
            onClick={() => onNavigate('apoyo-escolar')}
            className="flex flex-col items-center justify-center p-6 bg-amparo-navy text-white rounded-3xl shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
              <BookOpen size={24} />
            </div>
            <span className="text-sm font-bold">Apoyo Escolar</span>
          </button>

          <button 
            onClick={() => onNavigate('perfiles')}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 text-slate-700 rounded-3xl shadow-sm hover:border-brand-primary hover:text-brand-primary hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-400 group-hover:text-brand-primary">
              <Search size={24} />
            </div>
            <span className="text-sm font-bold">Buscar Niña</span>
          </button>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Niñas" 
          value={stats.totalGirls.toString()} 
          subValue="Activas" 
          icon={Users} 
          color="bg-amparo-orange" 
        />
        <StatCard 
          label="Semanas Visitas" 
          value={stats.totalVisits.toString()} 
          subValue="Total histórico" 
          icon={Home} 
          color="bg-amparo-navy" 
        />
        <StatCard 
          label="Código Rojo" 
          value={stats.riskRed.toString()} 
          subValue="Prioridad alta" 
          icon={AlertTriangle} 
          color="bg-amparo-red" 
        />
        <StatCard 
          label="Código Amarillo" 
          value={stats.riskAmber.toString()} 
          subValue="Seguimiento preventivo" 
          icon={AlertCircle} 
          color="bg-amparo-amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visits Per Staff */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Visitas por Staff</h3>
            <BarChart3 size={18} className="text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsPerStaffData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 4}}
                  contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="visits" fill="#f25b0a" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Factors Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Distribución Factores de Riesgo</h3>
            <AlertTriangle className="text-slate-400" size={18} />
          </div>
          <div className="h-80 flex items-center">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskFactorsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskFactorsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3 pr-4">
              {riskFactorsData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{item.name}</span>
                  <span className="text-xs text-brand-primary font-bold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Trends */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-serif text-2xl text-slate-800">Tendencia de Asistencia</h3>
            <p className="text-slate-400 text-sm">Registro mensual de apoyo escolar</p>
          </div>
          <TrendingUp className="text-amparo-green" size={24} />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line name="Presente (%)" type="monotone" dataKey="p" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{ r: 8 }} />
              <Line name="Ausente (%)" type="monotone" dataKey="a" stroke="#ef4444" strokeWidth={2} dot={{r: 4}} />
              <Line name="Licencia (%)" type="monotone" dataKey="c" stroke="#f59e0b" strokeWidth={2} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-slate-300 transition-all">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-3xl font-bold text-slate-800 tracking-tight mt-1">{value}</h4>
        <p className="text-[10px] font-medium text-slate-400 mt-1">{subValue}</p>
      </div>
    </div>
  );
}
