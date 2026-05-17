import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  Plus, 
  MoreVertical, 
  UserCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldAlert,
  Save,
  X,
  Camera,
  MapPin,
  Users2,
  Baby,
  GraduationCap,
  Stethoscope,
  Heart,
  BarChart,
  Home as HomeIcon,
  Phone,
  Upload,
  Loader2
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { compressImage, fileToBase64 } from '../lib/imageUtils';
import { Girl, RiskFactor } from '../types';

const RISK_FACTORS: RiskFactor[] = [
  'Acceso a Servicios Básicos y Educación',
  'Abuso Verbal, Físico o Sexual',
  'Uso de Sustancias o Adicciones en la Familia',
  'Extrema Pobreza',
  'Familia Disfuncional',
  'Otros Factores Medibles',
];

interface Props {
  viewType: 'perfiles' | 'registro';
  onSelectStats?: (girlId: string) => void;
}

export default function GirlsList({ viewType, onSelectStats }: Props) {
  const [girls, setGirls] = useState<Girl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGirl, setEditingGirl] = useState<Girl | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'girls'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Girl));
      setGirls(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'girls');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredGirls = girls.filter(g => 
    g.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-amparo-purple transition-all outline-none"
          />
        </div>

        <button
          onClick={() => {
            setEditingGirl(null);
            setShowModal(true);
          }}
          className="w-full md:w-auto bg-amparo-purple text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          Registrar Niña
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
           {[...Array(8)].map((_, i) => (
             <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100"></div>
           ))}
        </div>
      ) : viewType === 'perfiles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGirls.map((girl) => (
            <GirlCard 
              key={girl.id} 
              girl={girl} 
              onEdit={() => {
                setEditingGirl(girl);
                setShowModal(true);
              }}
              onViewStats={onSelectStats ? () => onSelectStats(girl.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Niña</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Turno</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredGirls.map((girl) => (
                <tr key={girl.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amparo-purple-light rounded-xl flex items-center justify-center text-amparo-purple overflow-hidden">
                        {girl.fotoUrl ? <img src={girl.fotoUrl} alt="" className="w-full h-full object-cover" /> : <UserCircle2 size={24} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{girl.nombre}</p>
                        <p className="text-xs text-slate-400">{girl.ci || 'Sin CI'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{girl.direccion || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold capitalize",
                      girl.codigoRiesgo === 'rojo' ? "bg-amparo-red-light text-amparo-red" : "bg-amparo-amber-light text-amparo-amber"
                    )}>
                      {girl.codigoRiesgo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 capitalize">{girl.turno}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => {
                        setEditingGirl(girl);
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-brand-primary transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <GirlModal 
          girl={editingGirl} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

function GirlCard({ girl, onEdit, onViewStats }: { girl: Girl, onEdit: () => void, onViewStats?: () => void, key?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-brand-primary transition-all group flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-brand-primary overflow-hidden shadow-inner border border-slate-100">
          {girl.fotoUrl ? <img src={girl.fotoUrl} alt="" className="w-full h-full object-cover" /> : <UserCircle2 size={32} />}
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          girl.codigoRiesgo === 'rojo' ? "bg-red-50 text-red-600 border border-red-100" : "bg-orange-50 text-orange-600 border border-orange-100"
        )}>
          {girl.codigoRiesgo}
        </span>
      </div>

      <h4 className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{girl.nombre}</h4>
      <div className="mt-3 space-y-2 flex-1">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <MapPin size={14} className="text-slate-300" />
          <span>{girl.direccion || 'Sin dirección'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <Clock size={14} className="text-slate-300" />
          <span className="capitalize">{girl.turno || 'Sin turno'}</span>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
        <button 
          onClick={onEdit}
          className="text-xs font-bold text-slate-400 group-hover:text-brand-primary uppercase tracking-widest transition-colors"
        >
          Perfil
        </button>
        {onViewStats && (
          <button 
            onClick={onViewStats}
            className="flex items-center gap-1.5 text-xs font-bold text-amparo-navy uppercase tracking-widest hover:text-brand-primary transition-colors"
          >
            <BarChart size={14} />
            Asistencia
          </button>
        )}
      </div>
    </div>
  );
}

function GirlModal({ girl, onClose }: { girl: Girl | null, onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Girl>>(
    girl || {
      nombre: '',
      codigoRiesgo: 'amarillo',
      factoresRiesgo: [],
      turno: 'mañana',
      descripcionRiesgo: '',
      apoderadoMasculino: { nombre: '', relacion: '', ocupacion: '', detallesBio: '', direccionSiNoVive: '' },
      apoderadaFemenina: { nombre: '', relacion: '', ocupacion: '', detallesBio: '' }
    }
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      console.log("File selected for Base64:", file.name, file.size);
      
      // Still compress to keep it small for Firestore
      setUploadProgress(20);
      const compressedFile = await compressImage(file);
      setUploadProgress(60);
      
      const base64 = await fileToBase64(compressedFile);
      setUploadProgress(100);
      
      console.log("Base64 conversion complete");
      setFormData(prev => ({ ...prev, fotoUrl: base64 }));
      
      setUploading(false);
      setUploadProgress(0);
    } catch (err: any) {
      console.error("General upload handler error:", err);
      alert("Error procesando imagen: " + err.message);
      setUploading(false);
    }
  };

  const toggleRiskFactor = (factor: RiskFactor) => {
    const current = formData.factoresRiesgo || [];
    if (current.includes(factor)) {
      setFormData({ ...formData, factoresRiesgo: current.filter(f => f !== factor) });
    } else {
      setFormData({ ...formData, factoresRiesgo: [...current, factor] });
    }
  };

  const handleSave = async () => {
    if (!formData.nombre) return;
    setSaving(true);
    try {
      if (girl?.id) {
        await updateDoc(doc(db, 'girls', girl.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'girls'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, girl?.id ? OperationType.UPDATE : OperationType.CREATE, `girls${girl?.id ? `/${girl.id}` : ''}`);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-purple transition-all text-sm";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amparo-purple text-white">
          <div className="flex items-center gap-3">
             <UserCircle2 size={24} />
             <h3 className="font-serif text-xl">{girl ? 'Editar Ficha' : 'Nueva Niña'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {/* Main Info */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="w-32 h-32 bg-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors shrink-0 overflow-hidden relative group"
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
                    <>
                      <Camera size={32} />
                      <span className="text-[10px] font-bold mt-1 uppercase tracking-widest text-center px-2">Subir Foto</span>
                    </>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4">
                      <Loader2 className="animate-spin mb-2" size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{uploadProgress}%</span>
                      <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
               </div>
               <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2 space-y-1">
                    <label className={labelClass}>Nombre Completo</label>
                    <input 
                      type="text" 
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className={inputClass}
                      placeholder="Nombre y Apellidos"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>CI</label>
                    <input 
                      type="text" 
                      value={formData.ci}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Fecha de Nacimiento</label>
                    <input 
                      type="date" 
                      value={formData.fnac}
                      onChange={(e) => setFormData({ ...formData, fnac: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Número de Teléfono / Celular</label>
                    <input 
                      type="text" 
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                      className={inputClass}
                      placeholder="6XXXXXXXX"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Recomendado por</label>
                    <input 
                      type="text" 
                      value={formData.recomendadoPor}
                      onChange={(e) => setFormData({ ...formData, recomendadoPor: e.target.value })}
                      className={inputClass}
                    />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                <div className="space-y-1">
                  <label className={labelClass}>Ciudad</label>
                  <input 
                    type="text" 
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className={labelClass}>Dirección Exacta</label>
                  <input 
                    type="text" 
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className={inputClass}
                    placeholder="Calle, número, zona..."
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className={labelClass}>Referencias de la Vivienda (Portón, color, etc)</label>
                  <input 
                    type="text" 
                    value={formData.referencia}
                    onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                    className={inputClass}
                  />
                </div>
            </div>
          </section>

          {/* Características y Entorno */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-amparo-purple border-b border-purple-100 pb-2">
                <Baby size={18} />
                <h4 className="font-bold text-sm uppercase tracking-widest">Perfil Personal</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className={labelClass}>Características de la niña</label>
                   <textarea 
                     value={formData.caracteristicas}
                     onChange={(e) => setFormData({ ...formData, caracteristicas: e.target.value })}
                     className={cn(inputClass, "min-h-[80px]")}
                     placeholder="Ej. Tranquila, líder, tímida..."
                   />
                </div>
                <div className="space-y-1">
                   <label className={labelClass}>Hermanos (Nombres y Edades)</label>
                   <textarea 
                     value={formData.hermanos}
                     onChange={(e) => setFormData({ ...formData, hermanos: e.target.value })}
                     className={cn(inputClass, "min-h-[80px]")}
                   />
                </div>
             </div>
          </section>

          {/* Familia y Apoderados */}
          <section className="space-y-6">
             <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                <HomeIcon size={18} />
                <h4 className="font-bold text-sm uppercase tracking-widest">Familia y Apoderados</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Apoderado Masculino */}
                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl">
                   <h5 className="font-bold text-xs uppercase text-slate-400 tracking-widest mb-2 border-b border-slate-200 pb-2">Apoderado Masculino (Padre/Tutor)</h5>
                   <div className="space-y-3">
                      <div className="space-y-1">
                        <label className={labelClass}>Nombre Completo</label>
                        <input 
                          type="text" 
                          value={formData.apoderadoMasculino?.nombre}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            apoderadoMasculino: { ...formData.apoderadoMasculino!, nombre: e.target.value } 
                          })}
                          className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className={labelClass}>Relación</label>
                          <input 
                            type="text" 
                            value={formData.apoderadoMasculino?.relacion}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              apoderadoMasculino: { ...formData.apoderadoMasculino!, relacion: e.target.value } 
                            })}
                            className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                            placeholder="Padre/Padrastro..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClass}>Ocupación</label>
                          <input 
                            type="text" 
                            value={formData.apoderadoMasculino?.ocupacion}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              apoderadoMasculino: { ...formData.apoderadoMasculino!, ocupacion: e.target.value } 
                            })}
                            className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Detalles del Padre biológico</label>
                        <input 
                          type="text" 
                          value={formData.apoderadoMasculino?.detallesBio}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            apoderadoMasculino: { ...formData.apoderadoMasculino!, detallesBio: e.target.value } 
                          })}
                          className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                          placeholder="Vive con la niña / No vive..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Dirección (si no vive con ella)</label>
                        <input 
                          type="text" 
                          value={formData.apoderadoMasculino?.direccionSiNoVive}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            apoderadoMasculino: { ...formData.apoderadoMasculino!, direccionSiNoVive: e.target.value } 
                          })}
                          className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                        />
                      </div>
                   </div>
                </div>

                {/* Apoderada Femenina */}
                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl">
                   <h5 className="font-bold text-xs uppercase text-slate-400 tracking-widest mb-2 border-b border-slate-200 pb-2">Apoderada Femenina (Madre/Tutora)</h5>
                   <div className="space-y-3">
                      <div className="space-y-1">
                        <label className={labelClass}>Nombre Completo</label>
                        <input 
                          type="text" 
                          value={formData.apoderadaFemenina?.nombre}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            apoderadaFemenina: { ...formData.apoderadaFemenina!, nombre: e.target.value } 
                          })}
                          className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className={labelClass}>Relación</label>
                          <input 
                            type="text" 
                            value={formData.apoderadaFemenina?.relacion}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              apoderadaFemenina: { ...formData.apoderadaFemenina!, relacion: e.target.value } 
                            })}
                            className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                            placeholder="Madre/Abuela..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClass}>Ocupación</label>
                          <input 
                            type="text" 
                            value={formData.apoderadaFemenina?.ocupacion}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              apoderadaFemenina: { ...formData.apoderadaFemenina!, ocupacion: e.target.value } 
                            })}
                            className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Detalles de la Madre biológica</label>
                        <input 
                          type="text" 
                          value={formData.apoderadaFemenina?.detallesBio}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            apoderadaFemenina: { ...formData.apoderadaFemenina!, detallesBio: e.target.value } 
                          })}
                          className="w-full bg-white border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-amparo-orange transition-all text-sm"
                        />
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Relación de los tutores o padres</label>
                  <input 
                    type="text" 
                    value={formData.relacionTutores}
                    onChange={(e) => setFormData({ ...formData, relacionTutores: e.target.value })}
                    className={inputClass}
                    placeholder="Ej. Casados y viven juntos / Divorciados"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>¿Con quiénes vive la niña? (Convivencia)</label>
                  <input 
                    type="text" 
                    value={formData.convivencia}
                    onChange={(e) => setFormData({ ...formData, convivencia: e.target.value })}
                    className={inputClass}
                    placeholder="Especifique hermanos, familiares u otros..."
                  />
                </div>
             </div>
          </section>

          {/* Colegio */}
          <section className="space-y-6">
             <div className="flex items-center gap-2 text-emerald-600 border-b border-emerald-100 pb-2">
                <GraduationCap size={18} />
                <h4 className="font-bold text-sm uppercase tracking-widest">Educación</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Nombre del Colegio</label>
                  <input 
                    type="text" 
                    value={formData.colegio}
                    onChange={(e) => setFormData({ ...formData, colegio: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Grado Actual</label>
                  <input 
                    type="text" 
                    value={formData.gradoEscolar}
                    onChange={(e) => setFormData({ ...formData, gradoEscolar: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Dirección del Colegio</label>
                  <input 
                    type="text" 
                    value={formData.direccionColegio}
                    onChange={(e) => setFormData({ ...formData, direccionColegio: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                   <label className={labelClass}>Horario escolar (Turno)</label>
                   <select 
                     value={formData.turno}
                     onChange={(e) => setFormData({ ...formData, turno: e.target.value as 'mañana' | 'tarde' })}
                     className={inputClass}
                   >
                     <option value="mañana">Mañana</option>
                     <option value="tarde">Tarde</option>
                   </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Materia Favorita</label>
                  <input 
                    type="text" 
                    value={formData.materiaFavorita}
                    onChange={(e) => setFormData({ ...formData, materiaFavorita: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Asistencia/Modalidad Año Pasado</label>
                  <input 
                    type="text" 
                    value={formData.modalidadAnterior}
                    onChange={(e) => setFormData({ ...formData, modalidadAnterior: e.target.value })}
                    className={inputClass}
                    placeholder="Virtual, presencial, mixta..."
                  />
                </div>
             </div>
          </section>

          {/* Salud y Otros */}
          <section className="space-y-6">
             <div className="flex items-center gap-2 text-rose-500 border-b border-rose-100 pb-2">
                <Stethoscope size={18} />
                <h4 className="font-bold text-sm uppercase tracking-widest">Salud y Otros</h4>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Problemas de Salud</label>
                  <textarea 
                    value={formData.salud}
                    onChange={(e) => setFormData({ ...formData, salud: e.target.value })}
                    className={cn(inputClass, "min-h-[60px]")}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Relación con otros ministerios y/o iglesias</label>
                  <input 
                    type="text" 
                    value={formData.otrasRelaciones}
                    onChange={(e) => setFormData({ ...formData, otrasRelaciones: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Comentarios Adicionales</label>
                  <textarea 
                    value={formData.comentarios}
                    onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                    className={cn(inputClass, "min-h-[80px]")}
                  />
                </div>
             </div>
          </section>

          {/* Risk Section (Keep existing but polish) */}
          <section className="bg-amparo-red/5 p-8 rounded-[40px] space-y-6 border border-amparo-red/10">
            <div className="flex items-center gap-2 text-amparo-red">
               <ShieldAlert size={20} />
               <h4 className="font-bold text-base uppercase tracking-widest">Evaluación de Riesgo</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className={labelClass}>Prioridad / Código</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, codigoRiesgo: 'rojo' })}
                      className={cn(
                        "flex-1 py-4 px-4 rounded-2xl text-sm font-bold border transition-all shadow-sm",
                        formData.codigoRiesgo === 'rojo' 
                          ? "bg-amparo-red text-white border-amparo-red scale-[1.02] shadow-amparo-red/20" 
                          : "bg-white text-slate-400 border-slate-100 opacity-60"
                      )}
                    >
                      Rojo (Alto)
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, codigoRiesgo: 'amarillo' })}
                      className={cn(
                        "flex-1 py-4 px-4 rounded-2xl text-sm font-bold border transition-all shadow-sm",
                        formData.codigoRiesgo === 'amarillo' 
                          ? "bg-amparo-amber text-white border-amparo-amber scale-[1.02] shadow-amparo-amber/20" 
                          : "bg-white text-slate-400 border-slate-100 opacity-60"
                      )}
                    >
                      Amarillo (Medio)
                    </button>
                  </div>
               </div>
               <div className="opacity-0 pointer-events-none"></div> {/* Spacer */}
            </div>

            <div className="space-y-3">
               <label className={labelClass}>Factores Detectados</label>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {RISK_FACTORS.map((factor) => (
                    <button
                      key={factor}
                      onClick={() => toggleRiskFactor(factor)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-left text-[10px] font-bold uppercase tracking-tight transition-all border",
                        formData.factoresRiesgo?.includes(factor)
                          ? "bg-white border-amparo-red text-amparo-red shadow-sm"
                          : "bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      {factor}
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Análisis del Entorno de Riesgo</label>
              <textarea 
                value={formData.descripcionRiesgo}
                onChange={(e) => setFormData({ ...formData, descripcionRiesgo: e.target.value })}
                className="w-full bg-white border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-amparo-red transition-all min-h-[120px] text-sm"
                placeholder="Describa a detalle la situación observada..."
              />
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-4 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-amparo-orange text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-amparo-orange/20"
          >
            {saving ? "Guardando..." : (
               <>
                 <Save size={20} />
                 Guardar Ficha
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
