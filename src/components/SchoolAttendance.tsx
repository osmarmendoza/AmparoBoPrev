import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Search, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart,
  Save,
  Clock,
  History,
  Download,
  AlertTriangle,
  Users
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn, formatDate } from '../lib/utils';
import { Girl, AttendanceRecord } from '../types';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Type extension for jspdf-autotable
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => void;
};

interface Props {
  initialGirlId?: string | null;
  onCloseStats?: () => void;
}

export default function SchoolAttendance({ initialGirlId, onCloseStats }: Props) {
  const [girls, setGirls] = useState<Girl[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTurno, setSelectedTurno] = useState<'mañana' | 'tarde'>('tarde');
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, 'P' | 'A' | 'C'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'history' | 'individual'>('daily');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedGirlId, setSelectedGirlId] = useState<string | null>(null);

  useEffect(() => {
    if (initialGirlId) {
      setSelectedGirlId(initialGirlId);
      setViewMode('individual');
    }
  }, [initialGirlId]);

  const isWednesday = new Date(selectedDate).getDay() === 3;

  useEffect(() => {
    const unsubGirls = onSnapshot(query(collection(db, 'girls')), (snap) => {
      setGirls(snap.docs.map(d => ({ id: d.id, ...d.data() } as Girl)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'girls');
    });

    const unsubLogs = onSnapshot(query(collection(db, 'attendance'), orderBy('fecha', 'desc')), (snap) => {
      setAttendanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
      setLoading(false);
    });

    return () => {
      unsubGirls();
      unsubLogs();
    };
  }, []);

  const filteredGirls = girls.filter(g => g.turno === selectedTurno);

  const getGirlStats = (girlId: string) => {
    const records = attendanceLogs.filter(log => 
      log.asistencias.some(a => a.girlId === girlId)
    );
    
    const stats = {
      P: 0,
      A: 0,
      C: 0,
      total: records.length,
      byMonth: {} as Record<string, { P: number, A: number, C: number }>,
      byYear: {} as Record<string, { P: number, A: number, C: number }>,
      history: records.map(r => ({
        fecha: r.fecha,
        estado: r.asistencias.find(a => a.girlId === girlId)?.estado || '—',
        turno: r.turno
      })).sort((a,b) => b.fecha.localeCompare(a.fecha))
    };

    records.forEach(r => {
      const state = r.asistencias.find(a => a.girlId === girlId)?.estado;
      const date = new Date(r.fecha + 'T12:00:00');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = `${date.getFullYear()}`;

      if (!stats.byMonth[monthKey]) stats.byMonth[monthKey] = { P: 0, A: 0, C: 0 };
      if (!stats.byYear[yearKey]) stats.byYear[yearKey] = { P: 0, A: 0, C: 0 };

      if (state === 'P') {
        stats.P++;
        stats.byMonth[monthKey].P++;
        stats.byYear[yearKey].P++;
      } else if (state === 'A') {
        stats.A++;
        stats.byMonth[monthKey].A++;
        stats.byYear[yearKey].A++;
      } else if (state === 'C') {
        stats.C++;
        stats.byMonth[monthKey].C++;
        stats.byYear[yearKey].C++;
      }
    });

    return stats;
  };

  const handleStatusChange = (girlId: string, status: 'P' | 'A' | 'C') => {
    setCurrentAttendance(prev => ({
      ...prev,
      [girlId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    const activeGirls = filteredGirls.map(g => g.id);
    const attendanceData = Object.entries(currentAttendance)
      .filter(([girlId]) => activeGirls.includes(girlId))
      .map(([girlId, estado]) => ({
        girlId,
        estado
      }));

    if (attendanceData.length === 0) {
      alert('Por favor, marque la asistencia de al menos una niña.');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'attendance'), {
        fecha: selectedDate,
        turno: selectedTurno,
        asistencias: attendanceData,
        createdAt: serverTimestamp()
      });
      alert('Asistencia guardada con éxito');
      setCurrentAttendance({});
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'attendance');
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = (record: AttendanceRecord | null = null) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const isActiveSession = !record;
    const dateStr = record ? record.fecha : selectedDate;
    const turnoStr = record ? record.turno : selectedTurno;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(242, 91, 10); // Amparo Orange
    doc.text('AMPARO BOLIVIA PREVENCIÓN', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Amparo Navy
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month)-1, parseInt(day));
    const fullDate = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`${fullDate.charAt(0).toUpperCase() + fullDate.slice(1)}`, 105, 30, { align: 'center' });
    doc.text(`Apoyo Escolar Turno ${turnoStr.charAt(0).toUpperCase() + turnoStr.slice(1)}`, 105, 38, { align: 'center' });
    
    // Data preparation
    const tableData: any[] = [];
    if (isActiveSession) {
      filteredGirls.forEach(g => {
        const estado = currentAttendance[g.id] || '—';
        tableData.push([`• ${g.nombre}`, estado]);
      });
    } else {
      record.asistencias.forEach(a => {
        const girl = girls.find(g => g.id === a.girlId);
        if (girl) {
          tableData.push([`• ${girl.nombre}`, a.estado]);
        }
      });
    }

    doc.autoTable({
      startY: 50,
      head: [['Niña', 'Estado']],
      body: tableData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { halign: 'center', cellWidth: 30, fontStyle: 'bold' }
      },
      headStyles: { fontStyle: 'bold', fontSize: 12, borderBottom: { color: [100, 100, 100], width: 1 } }
    });

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    if (finalY < 250) {
      doc.line(40, finalY, 90, finalY);
      doc.line(120, finalY, 170, finalY);
      doc.setFontSize(10);
      doc.text('Firma Responsable', 65, finalY + 5, { align: 'center' });
      doc.text('Firma Director/a', 145, finalY + 5, { align: 'center' });
    }

    doc.save(`asistencia_${dateStr}_${turnoStr}.pdf`);
  };

  const generateIndividualPDF = (girl: Girl, stats: any) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(242, 91, 10);
    doc.text('REPORTE INDIVIDUAL DE ASISTENCIA', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(girl.nombre, 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Turno: ${girl.turno?.toUpperCase()} | Colegio: ${girl.colegio || 'N/A'}`, 105, 38, { align: 'center' });

    // Summary Cards
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 45, 50, 25, 3, 3, 'FD');
    doc.roundedRect(80, 45, 50, 25, 3, 3, 'FD');
    doc.roundedRect(140, 45, 50, 25, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('ASISTENCIAS', 45, 52, { align: 'center' });
    doc.text('FALTAS', 105, 52, { align: 'center' });
    doc.text('LICENCIAS', 165, 52, { align: 'center' });

    doc.setFontSize(14);
    doc.text(stats.P.toString(), 45, 62, { align: 'center' });
    doc.text(stats.A.toString(), 105, 62, { align: 'center' });
    doc.text(stats.C.toString(), 165, 62, { align: 'center' });

    // Table
    const tableData = stats.history.map((h: any) => [
      formatDate(h.fecha),
      h.turno.toUpperCase(),
      h.estado === 'P' ? 'PRESENTE' : h.estado === 'A' ? 'AUSENTE' : 'LICENCIA'
    ]);

    doc.autoTable({
      startY: 80,
      head: [['Fecha', 'Turno', 'Estado']],
      body: tableData,
      headStyles: { fillColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`reporte_${girl.nombre.replace(/ /g, '_')}.pdf`);
  };

  const historyData = attendanceLogs
    .filter(log => log.asistencias.length > 0)
    .slice(0, 10)
    .reverse()
    .map(log => ({
      fecha: `${formatDate(log.fecha)} (${log.turno === 'mañana' ? 'M' : 'T'})`,
      p: log.asistencias.filter(a => a.estado === 'P').length
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
         <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => { setViewMode('daily'); setSelectedRecord(null); }}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                viewMode === 'daily' ? "bg-brand-primary text-white shadow-md" : "text-slate-400 hover:text-brand-primary"
              )}
            >
              <Clock size={18} />
              Control Diario
            </button>
            <button 
              onClick={() => { setViewMode('history'); setSelectedRecord(null); }}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                viewMode === 'history' ? "bg-brand-primary text-white shadow-md" : "text-slate-400 hover:text-brand-primary"
              )}
            >
              <History size={18} />
              Registro Grupal
            </button>
            <button 
              onClick={() => setViewMode('individual')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                viewMode === 'individual' ? "bg-brand-primary text-white shadow-md" : "text-slate-400 hover:text-brand-primary"
              )}
            >
              <Users size={18} />
              Seguimiento Individual
            </button>
         </div>

         {viewMode === 'daily' && (
           <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setSelectedTurno('mañana')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    selectedTurno === 'mañana' ? "bg-white text-amparo-purple shadow-sm" : "text-slate-500"
                  )}
                >
                  Turno Mañana
                </button>
                <button 
                  onClick={() => setSelectedTurno('tarde')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    selectedTurno === 'tarde' ? "bg-white text-amparo-purple shadow-sm" : "text-slate-500"
                  )}
                >
                  Turno Tarde
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center gap-2">
                <CalendarIcon size={18} className={cn("ml-2", isWednesday ? "text-amparo-green" : "text-slate-300")} />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 p-0 pr-4"
                />
              </div>

              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="bg-amparo-navy text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                  <Save size={18} />
                  {saving ? "Guardando..." : "Grabar Lista"}
              </button>
           </div>
         )}

         {viewMode === 'individual' && (
           <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200">
              <Search size={18} className="text-slate-400 ml-2" />
              <select 
                value={selectedGirlId || ''}
                onChange={(e) => setSelectedGirlId(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 p-0 pr-4 min-w-[200px]"
              >
                <option value="">Seleccionar Niña...</option>
                {girls.sort((a,b) => a.nombre.localeCompare(b.nombre)).map(g => (
                  <option key={g.id} value={g.id}>{g.nombre} ({g.turno})</option>
                ))}
              </select>
           </div>
         )}
      </div>

      {!isWednesday && viewMode === 'daily' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-700">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-medium">Nota: El apoyo escolar se registra oficialmente los días miércoles.</p>
        </div>
      )}

      {viewMode === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold text-slate-800 text-lg">Control de Asistencia</h3>
                    <p className="text-xs text-slate-500">Sesión del Miércoles {formatDate(selectedDate)}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-200 uppercase tracking-widest">
                       Turno: {selectedTurno}
                    </span>
                    <span className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-200 uppercase tracking-widest">
                       {filteredGirls.length} Niñas
                    </span>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-100">
                          <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre de la Niña</th>
                          <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {filteredGirls.length > 0 ? filteredGirls.map(girl => (
                          <tr key={girl.id} className="hover:bg-slate-50/80 transition-colors">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                      {girl.nombre.substring(0, 2)}
                                   </div>
                                   <div>
                                      <p className="font-bold text-slate-700">{girl.nombre}</p>
                                      <p className="text-xs text-slate-400">{girl.gradoEscolar || 'Grado no registrado'} • {girl.colegio || 'Sin Colegio'}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex items-center justify-center gap-3">
                                   <AttendanceButton 
                                      label="P" 
                                      active={currentAttendance[girl.id] === 'P'} 
                                      color="green" 
                                      onClick={() => handleStatusChange(girl.id, 'P')}
                                   />
                                   <AttendanceButton 
                                      label="A" 
                                      active={currentAttendance[girl.id] === 'A'} 
                                      color="red" 
                                      onClick={() => handleStatusChange(girl.id, 'A')}
                                   />
                                   <AttendanceButton 
                                      label="C" 
                                      active={currentAttendance[girl.id] === 'C'} 
                                      color="amber" 
                                      onClick={() => handleStatusChange(girl.id, 'C')}
                                   />
                                </div>
                             </td>
                          </tr>
                       )) : (
                         <tr>
                            <td colSpan={2} className="px-8 py-20 text-center text-slate-400">
                               <Users size={48} className="mx-auto mb-4 opacity-20" />
                               <p className="font-medium text-slate-500">No hay niñas registradas en el {selectedTurno === 'mañana' ? 'Turno Mañana' : 'Turno Tarde'}</p>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BarChart size={18} className="text-amparo-purple" />
                    Tendencia de Asistencia
                 </h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <RechartsBarChart data={historyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="fecha" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 8}} 
                          />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="p" fill="#f25b0a" radius={[6, 6, 0, 0]} barSize={24} />
                       </RechartsBarChart>
                    </ResponsiveContainer>
                 </div>
                 <p className="text-[10px] text-center text-slate-400 mt-6 uppercase font-bold tracking-widest">Asistencia (Últimas 10 Sesiones)</p>
              </div>

              <div className="bg-amparo-navy p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                   <BookOpen size={120} strokeWidth={1} />
                 </div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <Download size={22} />
                       </div>
                       <h4 className="font-bold text-lg">Reporte de Hoy</h4>
                    </div>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                       Genere el listado PDF de la sesión actual seleccionada.
                    </p>
                    <button 
                      onClick={() => generatePDF()}
                      className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                       <Download size={20} />
                       Exportar PDF
                    </button>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Información</h4>
                 <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                       Recuerde grabar la lista al finalizar la sesión. Los reportes individuales se actualizan automáticamente tras cada grabación.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="bg-green-50 p-2 rounded-xl text-center">
                          <p className="text-xs font-bold text-green-600">P</p>
                          <p className="text-[8px] text-green-600 font-bold uppercase">Presente</p>
                       </div>
                       <div className="bg-red-50 p-2 rounded-xl text-center">
                          <p className="text-xs font-bold text-red-600">A</p>
                          <p className="text-[8px] text-red-600 font-bold uppercase">Ausente</p>
                       </div>
                       <div className="bg-amber-50 p-2 rounded-xl text-center">
                          <p className="text-xs font-bold text-amber-600">C</p>
                          <p className="text-[8px] text-amber-600 font-bold uppercase">Licencia</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {attendanceLogs.length > 0 ? attendanceLogs.map(log => {
              const p = log.asistencias.filter(a => a.estado === 'P').length;
              const total = log.asistencias.length;
              const percentage = total > 0 ? Math.round((p/total)*100) : 0;
              
              return (
                 <div key={log.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover:bg-amparo-purple-light group-hover:text-amparo-purple transition-colors">
                             <span className="text-[10px] font-bold uppercase leading-none">{new Date(log.fecha+'T12:00:00').getDate()}</span>
                             <span className="text-[8px] font-bold uppercase leading-none mt-0.5">{new Date(log.fecha+'T12:00:00').toLocaleString('es', { month: 'short' })}</span>
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800">{formatDate(log.fecha)}</h4>
                             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Turno {log.turno}</p>
                          </div>
                       </div>
                       <button 
                        onClick={() => generatePDF(log)}
                        className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-amparo-navy hover:text-white transition-all shadow-sm"
                        title="Descargar PDF"
                       >
                          <Download size={18} />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-slate-500">Asistencia Grupal</span>
                          <span className={cn(
                            percentage > 80 ? "text-amparo-green" : percentage > 50 ? "text-amparo-amber" : "text-amparo-red"
                          )}>{percentage}%</span>
                       </div>
                       <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full",
                              percentage > 80 ? "bg-amparo-green" : percentage > 50 ? "bg-amparo-amber" : "bg-amparo-red"
                            )} 
                            style={{width: `${percentage}%`}}
                          ></div>
                       </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedRecord(selectedRecord?.id === log.id ? null : log);
                      }}
                      className="w-full mt-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-500 hover:bg-amparo-purple-light hover:text-amparo-purple transition-all flex items-center justify-center gap-2"
                    >
                       <FileText size={14} />
                       {selectedRecord?.id === log.id ? 'Ocultar Detalles' : 'Ver Detalles del Grupo'}
                    </button>

                    {selectedRecord?.id === log.id && (
                      <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {log.asistencias.sort((a,b) => {
                          const ga = girls.find(g => g.id === a.girlId)?.nombre || '';
                          const gb = girls.find(g => g.id === b.girlId)?.nombre || '';
                          return ga.localeCompare(gb);
                        }).map(a => {
                          const girl = girls.find(g => g.id === a.girlId);
                          return (
                            <div key={a.girlId} className="flex items-center justify-between text-xs py-1">
                              <span className="text-slate-600 truncate">{girl?.nombre || 'Niña Eliminada'}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-lg font-bold uppercase text-[8px]",
                                a.estado === 'P' ? "bg-green-100 text-green-700" : a.estado === 'A' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {a.estado === 'P' ? 'Presente' : a.estado === 'A' ? 'Ausente' : 'Licencia'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                 </div>
              );
           }) : (
             <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
                <History size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-medium">No hay registros históricos todavía.</p>
             </div>
           )}
        </div>
      )}

      {viewMode === 'individual' && (
        <div className="space-y-8">
           {selectedGirlId ? (
              (() => {
                const girl = girls.find(g => g.id === selectedGirlId);
                const stats = getGirlStats(selectedGirlId);
                if (!girl) return null;

                return (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1 space-y-6">
                       <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                          <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center text-slate-300 font-bold text-3xl uppercase">
                             {girl.nombre.substring(0, 2)}
                          </div>
                          <h3 className="font-bold text-xl text-slate-800">{girl.nombre}</h3>
                          <p className="text-sm text-slate-400 mb-6 uppercase tracking-widest font-bold">{girl.turno} • {girl.colegio}</p>
                          
                          <div className="grid grid-cols-3 gap-3 mb-8">
                             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <p className="text-2xl font-bold text-amparo-navy">{stats.P}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Presente</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <p className="text-2xl font-bold text-amparo-red">{stats.A}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Faltas</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <p className="text-2xl font-bold text-amparo-amber">{stats.C}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Licencia</p>
                             </div>
                          </div>

                          <button 
                            onClick={() => generateIndividualPDF(girl, stats)}
                            className="w-full bg-amparo-navy text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                          >
                             <Download size={18} />
                             Descargar Reporte PDF
                          </button>
                       </div>

                       <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                          <h4 className="font-bold text-slate-800 mb-6">Porcentaje de Asistencia</h4>
                          <div className="relative pt-1">
                             <div className="flex mb-2 items-center justify-between">
                                <div>
                                   <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amparo-navy bg-slate-100">
                                      Promedio Total
                                   </span>
                                </div>
                                <div className="text-right">
                                   <span className="text-xs font-semibold inline-block text-amparo-navy">
                                      {stats.total > 0 ? Math.round((stats.P / stats.total) * 100) : 0}%
                                   </span>
                                </div>
                             </div>
                             <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
                                <div 
                                  style={{ width: `${stats.total > 0 ? (stats.P / stats.total) * 100 : 0}%` }} 
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amparo-green transition-all duration-1000"
                                ></div>
                             </div>
                          </div>

                          <div className="mt-8 space-y-6">
                             <div>
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Resumen Mensual</h5>
                                <div className="space-y-3">
                                   {Object.entries(stats.byMonth).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 3).map(([month, s]) => {
                                     const totalMonth = s.P + s.A + s.C;
                                     const per = totalMonth > 0 ? Math.round((s.P / totalMonth) * 100) : 0;
                                     return (
                                       <div key={month} className="flex items-center justify-between">
                                         <span className="text-xs font-bold text-slate-600">{new Date(month + '-02').toLocaleString('es', { month: 'long', year: 'numeric' })}</span>
                                         <span className={cn(
                                           "text-xs font-bold",
                                           per > 80 ? "text-amparo-green" : per > 50 ? "text-amparo-amber" : "text-amparo-red"
                                         )}>{per}%</span>
                                       </div>
                                     );
                                   })}
                                </div>
                             </div>
                             
                             <div>
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Resumen Anual</h5>
                                <div className="space-y-3">
                                   {Object.entries(stats.byYear).sort((a,b) => b[0].localeCompare(a[0])).map(([year, s]) => {
                                     const totalYear = s.P + s.A + s.C;
                                     const per = totalYear > 0 ? Math.round((s.P / totalYear) * 100) : 0;
                                     return (
                                       <div key={year} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                         <span className="text-xs font-bold text-amparo-navy">Año {year}</span>
                                         <div className="flex gap-4">
                                           <span className="text-[10px] font-bold text-amparo-green">{s.P} P</span>
                                           <span className="text-[10px] font-bold text-amparo-red">{s.A} F</span>
                                         </div>
                                       </div>
                                     );
                                   })}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                       <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="font-bold text-slate-800">Historial de Sesiones</h4>
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stats.history.length} Entradas</span>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="border-b border-slate-100">
                                   <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                   <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Turno</th>
                                   <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Estado</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {stats.history.map((h, i) => (
                                   <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-8 py-5 font-bold text-slate-700">{formatDate(h.fecha)}</td>
                                      <td className="px-8 py-5 text-xs uppercase text-slate-400 font-bold">{h.turno}</td>
                                      <td className="px-8 py-5 text-right">
                                         <span className={cn(
                                           "px-3 py-1 rounded-full font-bold uppercase text-[10px]",
                                            h.estado === 'P' ? "bg-green-100 text-green-700" : h.estado === 'A' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                         )}>
                                            {h.estado === 'P' ? 'Presente' : h.estado === 'A' ? 'Ausente' : 'Licencia'}
                                         </span>
                                      </td>
                                   </tr>
                                ))}
                                {stats.history.length === 0 && (
                                   <tr>
                                      <td colSpan={3} className="px-8 py-20 text-center text-slate-300 italic">No hay sesiones grabadas para esta niña.</td>
                                   </tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                );
              })()
           ) : (
             <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                   <Users size={40} />
                </div>
                <h3 className="font-bold text-xl text-slate-800 mb-2">Seleccione una niña</h3>
                <p className="text-slate-400 max-w-xs mx-auto">Para ver el reporte detallado de asistencias, faltas y comportamiento en el apoyo escolar.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}

function AttendanceButton({ label, active, color, onClick }: { label: string, active: boolean, color: 'green' | 'red' | 'amber', onClick: () => void }) {
  const colors = {
    green: active ? "bg-amparo-green text-white border-amparo-green shadow-lg shadow-green-200" : "text-green-600 hover:bg-green-50 border-green-100",
    red: active ? "bg-amparo-red text-white border-amparo-red shadow-lg shadow-red-200" : "text-red-600 hover:bg-red-50 border-red-100",
    amber: active ? "bg-amparo-amber text-white border-amparo-amber shadow-lg shadow-amber-200" : "text-amber-600 hover:bg-amber-50 border-amber-100"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-2xl border-2 text-sm font-black flex items-center justify-center transition-all hover:scale-110 active:scale-95",
        colors[color]
      )}
    >
      {label}
    </button>
  );
}
