import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { 
  Home, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Users, 
  Image as ImageIcon, 
  MoreVertical,
  History,
  X,
  Save,
  CheckCircle2,
  Lock,
  Camera,
  ChevronRight,
  Loader2,
  Clock,
  Star,
  Heart
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn, formatDate } from '../lib/utils';
import { compressImage, fileToBase64 } from '../lib/imageUtils';
import { Visit, Girl } from '../types';

export default function VisitsList() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [girls, setGirls] = useState<Girl[]>([]);
  const [staffList, setStaffList] = useState<{id: string, nombre: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [canViewHistory, setCanViewHistory] = useState(true); 

  useEffect(() => {
    // In a real app, check user permissions here
    // const user = auth.currentUser;
    // if (user) { ... }

    const vQuery = query(collection(db, 'visits'));
    const gQuery = query(collection(db, 'girls'));
    const sQuery = query(collection(db, 'staff'));

    const unsubVisits = onSnapshot(vQuery, (snap) => {
      setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Visit)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'visits');
      setLoading(false);
    });

    const unsubGirls = onSnapshot(gQuery, (snap) => {
      setGirls(snap.docs.map(d => ({ id: d.id, ...d.data() } as Girl)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'girls');
    });

    const unsubStaff = onSnapshot(sQuery, (snap) => {
      setStaffList(snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'staff');
    });

    return () => {
      unsubVisits();
      unsubGirls();
      unsubStaff();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200">
           <button className="px-4 py-2 bg-amparo-orange text-white rounded-xl text-sm font-bold">Recientes</button>
           <button className="px-4 py-2 text-slate-400 hover:text-amparo-orange rounded-xl text-sm font-bold transition-all">Historial General</button>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto bg-amparo-orange text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          Registrar Visita
        </button>
      </div>

      {!canViewHistory ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Lock size={40} />
           </div>
           <h3 className="font-serif text-2xl text-slate-800">Acceso Restringido</h3>
           <p className="text-slate-400 max-w-sm mt-2">
             No tienes permisos para ver el historial de visitas. Contacta a tu administrador para solicitar acceso.
           </p>
        </div>
      ) : loading ? (
        <div className="space-y-4 animate-pulse">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100"></div>
           ))}
        </div>
      ) : (
        <div className="space-y-4">
          {visits.sort((a,b) => b.fecha.localeCompare(a.fecha)).map((visit) => {
            const girl = girls.find(g => g.id === visit.girlId);
            return (
              <div 
                key={visit.id} 
                onClick={() => setSelectedVisit(visit)}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center group hover:border-amparo-orange/40 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 bg-amparo-orange-light rounded-2xl flex items-center justify-center text-amparo-orange shrink-0">
                  <Home size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800 truncate">{girl?.nombre || 'Niña Desconocida'}</p>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                    <p className="text-xs font-bold text-amparo-orange">{formatDate(visit.fecha)}</p>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{visit.comentarios}</p>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex -space-x-3">
                      {visit.staffIds?.map((sid, i) => {
                        const s = staffList.find(st => st.id === sid);
                        return (
                          <div key={sid} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden" title={s?.nombre}>
                             {s?.nombre.slice(0, 2).toUpperCase()}
                          </div>
                        );
                      })}
                   </div>
                   <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block"></div>
                   <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        visit.estadoEmocional === 'bueno' ? "bg-amparo-green-light text-amparo-green" : "bg-amparo-amber-light text-amparo-amber"
                      )}>
                        {visit.estadoEmocional}
                      </span>
                   </div>
                </div>

                <button className="p-2 text-slate-400 hover:text-amparo-purple transition-all translate-x-2">
                  <ChevronRight size={20} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <VisitModal 
          girls={girls} 
          staffList={staffList}
          onClose={() => setShowModal(false)} 
        />
      )}

      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          girls={girls}
          staffList={staffList}
          onClose={() => setSelectedVisit(null)}
        />
      )}
    </div>
  );
}

function VisitDetailModal({ visit, girls, staffList, onClose }: { visit: Visit, girls: Girl[], staffList: any[], onClose: () => void }) {
  const [history, setHistory] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const girl = girls.find(g => g.id === visit.girlId);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'visits'),
          where('girlId', '==', visit.girlId),
          orderBy('fecha', 'desc')
        );
        const snap = await getDocs(q);
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as Visit)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `visits[girlId=${visit.girlId}]`);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [visit.girlId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-amparo-orange text-white">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Home size={28} />
             </div>
             <div>
                <h3 className="font-serif text-2xl">Resumen de Visita</h3>
                <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] mt-0.5">{formatDate(visit.fecha)}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header Info */}
          <section className="flex items-start gap-6">
            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] overflow-hidden border-4 border-slate-50 shrink-0">
               {girl?.fotoUrl ? <img src={girl.fotoUrl} alt="" className="w-full h-full object-cover" /> : <User size={40} className="mx-auto mt-6 text-slate-300" />}
            </div>
            <div className="flex-1 space-y-3">
               <div>
                 <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{girl?.nombre}</h4>
                 <div className="flex items-center gap-2 mt-1">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                     girl?.codigoRiesgo === 'rojo' ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
                   )}>
                     Riesgo: {girl?.codigoRiesgo}
                   </span>
                   <span className="text-slate-300">•</span>
                   <p className="text-xs font-medium text-slate-400">ID: {girl?.id.slice(0, 8)}</p>
                 </div>
               </div>
               
               <div className="flex flex-wrap gap-2">
                 {visit.staffIds?.map(sid => {
                   const s = staffList.find(st => st.id === sid);
                   return (
                     <div key={sid} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-600 flex items-center gap-2">
                        <Users size={12} className="text-amparo-orange" />
                        {s?.nombre}
                     </div>
                   );
                 })}
               </div>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Estado Emocional', value: visit.estadoEmocional, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
              { label: 'Escolaridad', value: visit.asistenciaColegio, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Salud Física', value: visit.estadoFisicoNiña, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
              { label: 'Entorno Hogar', value: visit.estadoFisicoCasa, icon: Home, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Acompañamiento', value: visit.adultosEnCasa, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
              { 
                label: 'Historia Bíblica', 
                value: visit.historiaBiblicaRating ? `${visit.historiaBiblicaRating}/5` : 'N/A', 
                icon: Star, 
                color: 'text-yellow-500', 
                bg: 'bg-yellow-50' 
              },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-3xl border border-slate-50 bg-slate-50/50">
                 <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", stat.bg, stat.color)}>
                    <stat.icon size={18} />
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-sm font-bold text-slate-700 capitalize mt-0.5">{stat.value}</p>
              </div>
            ))}
          </section>

          {/* Visit Photo */}
          {visit.fotoUrl && (
            <section className="space-y-3">
               <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registro Fotográfico</h5>
               <div className="w-full h-48 rounded-3xl overflow-hidden shadow-lg shadow-black/5 border-4 border-white">
                  <img src={visit.fotoUrl} alt="Registro de visita" className="w-full h-full object-cover" />
               </div>
            </section>
          )}

          {/* Key Observations */}
          <section className="space-y-6">
             <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Observaciones Críticas</h5>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                   <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {visit.comentarios}
                   </p>
                </div>
             </div>

             {visit.motivosOracion && (
                <div className="space-y-2">
                   <h5 className="text-[10px] font-bold text-amparo-orange uppercase tracking-widest ml-1">Motivos de Oración</h5>
                   <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100/50 shadow-sm border-dashed">
                      <p className="text-amber-900/80 text-sm leading-relaxed italic">
                         "🙏 {visit.motivosOracion}"
                      </p>
                   </div>
                </div>
             )}
          </section>

          {/* History Timeline */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
             <div className="flex items-center gap-3 mb-6">
                <History className="text-slate-400" size={18} />
                <h5 className="text-sm font-bold text-slate-800">Historial de Seguimiento</h5>
             </div>
             
             {loading ? (
                <div className="flex justify-center p-8">
                   <Loader2 className="animate-spin text-slate-300" size={24} />
                </div>
             ) : (
                <div className="space-y-4 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-slate-100">
                   {history.filter(h => h.id !== visit.id).length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-4">No hay visitas anteriores registradas.</p>
                   ) : (
                      history.filter(h => h.id !== visit.id).map((prev) => (
                        <div key={prev.id} className="relative pl-10">
                           <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></div>
                           <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-2">
                                 <p className="text-[10px] font-bold text-slate-400">{formatDate(prev.fecha)}</p>
                                 <span className="text-[10px] font-bold text-amparo-orange uppercase tracking-widest">
                                    {prev.estadoEmocional}
                                 </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 italic mb-2">"{prev.comentarios}"</p>
                              {prev.motivosOracion && (
                                 <p className="text-[10px] font-medium text-amber-700 bg-amber-50 inline-block px-2 py-0.5 rounded-full">
                                    🙏 {prev.motivosOracion}
                                 </p>
                              )}
                           </div>
                        </div>
                      ))
                   )}
                </div>
             )}
          </section>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function VisitModal({ girls, staffList, onClose }: { girls: Girl[], staffList: any[], onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Visit>>({
    fecha: new Date().toISOString().split('T')[0],
    girlId: '', // We'll handle multiple but keep one primary for the demo/simplicity or change to girlIds
    staffIds: [],
    comentarios: '',
    estadoEmocional: 'bien',
    adultosEnCasa: 'sí',
    estadoFisicoNiña: 'bueno',
    estadoFisicoCasa: 'bueno',
    asistenciaColegio: 'regular',
    historiaBiblicaRating: 0,
    motivosOracion: ''
  });
  const [selectedGirlIds, setSelectedGirlIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);

  useEffect(() => {
    // Show history for the first selected girl for now
    if (selectedGirlIds.length > 0) {
      fetchLastVisit(selectedGirlIds[0]);
    } else {
      setLastVisit(null);
    }
  }, [selectedGirlIds]);

  const toggleGirl = (gid: string) => {
    setSelectedGirlIds(prev => 
      prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid]
    );
  };

  const fetchLastVisit = async (girlId: string) => {
    try {
      const q = query(
        collection(db, 'visits'), 
        where('girlId', '==', girlId),
        orderBy('fecha', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLastVisit({ id: snap.docs[0].id, ...snap.docs[0].data() } as Visit);
      } else {
        setLastVisit(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `visits[girlId=${girlId}]`);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      console.log("Visit file selected for Base64:", file.name, file.size);
      
      // Still compress to keep it small for Firestore
      setUploadProgress(20);
      const compressedFile = await compressImage(file);
      setUploadProgress(60);
      
      const base64 = await fileToBase64(compressedFile);
      setUploadProgress(100);
      
      console.log("Visit Base64 conversion complete");
      setFormData(prev => ({ ...prev, fotoUrl: base64 }));
      
      setUploading(false);
      setUploadProgress(0);
    } catch (err: any) {
      console.error("General visit upload error:", err);
      alert("Error procesando imagen de visita: " + err.message);
      setUploading(false);
    }
  };

  const toggleStaff = (sid: string) => {
    const current = formData.staffIds || [];
    if (current.includes(sid)) {
      setFormData({ ...formData, staffIds: current.filter(id => id !== sid) });
    } else {
      setFormData({ ...formData, staffIds: [...current, sid] });
    }
  };

  const handleSave = async () => {
    if (selectedGirlIds.length === 0 || !formData.fecha || (formData.staffIds || []).length === 0) return;
    setSaving(true);
    try {
      // Create a visit record for each selected girl
      const promises = selectedGirlIds.map(gid => 
        addDoc(collection(db, 'visits'), {
          ...formData,
          girlId: gid,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'visits');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amparo-orange text-white">
          <div className="flex items-center gap-3">
             <Home size={24} />
             <h3 className="font-serif text-xl">Nueva Visita Familiar</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Fecha *</label>
              <input 
                type="date" 
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Staff Responsable *</label>
              <select 
                multiple
                value={formData.staffIds}
                onChange={(e) => setFormData({ 
                   ...formData, 
                   staffIds: Array.from(e.target.selectedOptions).map(option => (option as HTMLOptionElement).value) 
                })}
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all min-h-[46px]"
              >
                {staffList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Niña(s) visitadas *</label>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar niña..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-amparo-orange transition-all"
                />
             </div>
             <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                {girls.filter(g => g.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(girl => (
                   <label 
                     key={girl.id}
                     className={cn(
                       "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border",
                       selectedGirlIds.includes(girl.id) 
                         ? "bg-white border-amparo-orange text-amparo-orange shadow-sm" 
                         : "bg-transparent border-transparent text-slate-500 hover:bg-white/50"
                     )}
                   >
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={selectedGirlIds.includes(girl.id)}
                        onChange={() => toggleGirl(girl.id)}
                      />
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                        selectedGirlIds.includes(girl.id) ? "bg-amparo-orange border-amparo-orange text-white" : "border-slate-300"
                      )}>
                         {selectedGirlIds.includes(girl.id) && <CheckCircle2 size={12} />}
                      </div>
                      <span className="text-sm font-medium">{girl.nombre}</span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        girl.codigoRiesgo === 'rojo' ? "bg-red-400" : "bg-orange-400"
                      )}></div>
                   </label>
                ))}
             </div>
          </div>

          {selectedGirlIds.length > 0 && (
             <div className="space-y-4 pt-4 border-t border-slate-50">
               {selectedGirlIds.map(gid => {
                 const girl = girls.find(g => g.id === gid);
                 if (!girl) return null;
                 return (
                   <div key={gid} className="space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                            {girl.fotoUrl ? <img src={girl.fotoUrl} alt="" className="w-full h-full object-cover" /> : <User size={20} className="mx-auto mt-2 text-slate-300" />}
                         </div>
                         <div>
                            <p className="font-bold text-slate-800 text-sm">{girl.nombre}</p>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mt-0.5",
                              girl.codigoRiesgo === 'rojo' ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
                            )}>
                               {girl.codigoRiesgo}
                            </span>
                         </div>
                      </div>

                      {/* We show history only for the first selected for now to keep it clean, 
                          or we could map them. The user's screenshot shows one highlighted. */}
                      {gid === selectedGirlIds[0] && lastVisit && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-2 animate-in slide-in-from-top-2 duration-300">
                           <div className="flex items-center gap-2 text-amber-800">
                              <Calendar size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">
                                Última visita: {formatDate(lastVisit.fecha)}
                                {lastVisit.staffIds && ` • ${staffList.find(s => s.id === lastVisit.staffIds[0])?.nombre || 'Personal'}`}
                              </span>
                           </div>
                           <p className="text-sm text-amber-900/70 italic leading-relaxed">
                             "{lastVisit.comentarios}"
                             {lastVisit.motivosOracion && <span className="block mt-1 font-medium">🙏 {lastVisit.motivosOracion}</span>}
                           </p>
                        </div>
                      )}
                   </div>
                 );
               })}
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Estado Emocional</label>
                <select 
                  value={formData.estadoEmocional}
                  onChange={(e) => setFormData({ ...formData, estadoEmocional: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
                >
                  <option value="bueno">Excelente / Muy Bueno</option>
                  <option value="bien">Bien / Estable</option>
                  <option value="regular">Regular / Triste</option>
                  <option value="preocupante">Requiere Seguimiento</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Foto de la Visita (Opcional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[46px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-all relative overflow-hidden"
                >
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     className="hidden" 
                     accept="image/*"
                     onChange={handleFileChange}
                   />
                   {formData.fotoUrl ? (
                     <img src={formData.fotoUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className="flex items-center gap-2">
                       <Camera size={18} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Subir Imagen</span>
                     </div>
                   )}
                   {uploading && (
                     <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-1">
                       <Loader2 className="animate-spin mb-1" size={14} />
                       <span className="text-[8px] font-bold uppercase tracking-tight">{uploadProgress}%</span>
                       <div className="w-4/5 h-0.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                         <div 
                           className="h-full bg-white transition-all duration-300" 
                           style={{ width: `${uploadProgress}%` }}
                         ></div>
                       </div>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {lastVisit && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-2 animate-in slide-in-from-top-2 duration-300">
               <div className="flex items-center gap-2 text-amber-800">
                  <Clock size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Última visita: {formatDate(lastVisit.fecha)}</span>
               </div>
               <p className="text-sm text-amber-900/70 italic leading-relaxed">
                 "{lastVisit.comentarios}"
               </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">¿Adultos en Casa?</label>
                <select 
                  value={formData.adultosEnCasa}
                  onChange={(e) => setFormData({ ...formData, adultosEnCasa: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
                >
                  <option value="sí">Sí</option>
                  <option value="no">No</option>
                  <option value="parcialmente">Solo hermanos mayores</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Asistencia al Colegio</label>
                <select 
                  value={formData.asistenciaColegio}
                  onChange={(e) => setFormData({ ...formData, asistenciaColegio: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
                >
                  <option value="regular">Regular / Asiste siempre</option>
                  <option value="irregular">Irregular / Faltas</option>
                  <option value="no_asiste">No está asistiendo</option>
                  <option value="vacaciones">Vacaciones</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Estado Físico Niña</label>
                <select 
                  value={formData.estadoFisicoNiña}
                  onChange={(e) => setFormData({ ...formData, estadoFisicoNiña: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
                >
                  <option value="bueno">Sana / Bien</option>
                  <option value="regular">Decaída / Algún síntoma</option>
                  <option value="enferma">Enferma / Requiere atención</option>
                  <option value="lesionada">Con lesiones / hematomas</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Estado Físico de la Casa</label>
                <select 
                  value={formData.estadoFisicoCasa}
                  onChange={(e) => setFormData({ ...formData, estadoFisicoCasa: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
                >
                  <option value="ordenado">Ordenada / Limpia</option>
                  <option value="descuidado">Descuidada / Desorden</option>
                  <option value="peligroso">Riesgo estructural / insalubre</option>
                </select>
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Historia Bíblica</label>
                <div className="flex gap-1">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <button
                       key={star}
                       onClick={() => setFormData({ ...formData, historiaBiblicaRating: star })}
                       className={cn(
                         "transition-all hover:scale-110",
                         (formData.historiaBiblicaRating || 0) >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-200"
                       )}
                     >
                       <Star size={24} />
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Comentarios y Observaciones</label>
            <textarea 
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all min-h-[100px]"
              placeholder="Describa los hallazgos de la visita..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Motivos de Oración</label>
            <textarea 
              value={formData.motivosOracion}
              onChange={(e) => setFormData({ ...formData, motivosOracion: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all min-h-[80px]"
              placeholder="Peticiones específicas por la familia..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-amparo-orange text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? "Guardando..." : (
               <>
                 <Save size={18} />
                 Guardar Registro
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
