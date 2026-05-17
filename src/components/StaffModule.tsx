import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  UserCircle2, 
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Save,
  X
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function StaffModule() {
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  useEffect(() => {
    // Fetch Staff
    const qStaff = query(collection(db, 'staff'));
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      setStaff(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'staff');
      setLoading(false);
    });

    // Fetch Roles
    const qRoles = query(collection(db, 'roles'));
    const unsubRoles = onSnapshot(qRoles, (snapshot) => {
      setRoles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'roles');
    });

    return () => {
      unsubStaff();
      unsubRoles();
    };
  }, []);

  const getRoleName = (rolId: string) => {
    return roles.find(r => r.id === rolId)?.nombre || 'Sin Rol';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-amparo-orange transition-all outline-none"
          />
        </div>

        <button
          onClick={() => {
            setEditingStaff(null);
            setShowModal(true);
          }}
          className="w-full md:w-auto bg-amparo-orange text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[...Array(6)].map((_, i) => (
             <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-slate-100"></div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div key={member.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                 <button 
                  onClick={() => {
                    setEditingStaff(member);
                    setShowModal(true);
                  }}
                  className="p-2 text-slate-300 hover:text-amparo-orange transition-colors"
                 >
                    <MoreVertical size={20} />
                 </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 bg-amparo-orange-light rounded-2xl flex items-center justify-center text-amparo-orange overflow-hidden">
                    {member.fotoUrl ? (
                      <img src={member.fotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle2 size={32} />
                    )}
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{member.nombre}</h4>
                    <span className="text-xs font-bold text-amparo-orange uppercase tracking-widest">{getRoleName(member.rolId)}</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-slate-400">
                    <Mail size={16} />
                    <span className="text-sm truncate">{member.email || 'Sin correo'}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400">
                    <Phone size={16} />
                    <span className="text-sm">{member.telefono || 'Sin teléfono'}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400">
                    <MapPin size={16} />
                    <span className="text-sm">{member.zonaAsignada || 'Global'}</span>
                 </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-1.5 text-emerald-600">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Activo</span>
                 </div>
                 <button className="text-amparo-orange hover:translate-x-1 transition-transform">
                   <ChevronRight size={20} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <StaffModal 
          staff={editingStaff}
          roles={roles}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function StaffModal({ staff, roles, onClose }: { staff: any | null, roles: any[], onClose: () => void }) {
  const [formData, setFormData] = useState<any>(
    staff || {
      nombre: '',
      email: '',
      telefono: '',
      rolId: '',
      zonaAsignada: ''
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.nombre) return;
    setSaving(true);
    try {
      if (staff?.id) {
        await updateDoc(doc(db, 'staff', staff.id), formData);
      } else {
        await addDoc(collection(db, 'staff'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, staff?.id ? OperationType.UPDATE : OperationType.CREATE, `staff${staff?.id ? `/${staff.id}` : ''}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amparo-orange text-white">
          <div className="flex items-center gap-3">
             <Users size={24} />
             <h3 className="font-serif text-xl">{staff ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
            <input 
              type="text" 
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email / Usuario</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
                />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Teléfono</label>
                <input 
                  type="text" 
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Rol en el Sistema</label>
                <select 
                  value={formData.rolId}
                  onChange={(e) => setFormData({ ...formData, rolId: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all text-sm font-medium"
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.nombre}</option>
                  ))}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Zona de Trabajo</label>
                <input 
                  type="text" 
                  value={formData.zonaAsignada}
                  onChange={(e) => setFormData({ ...formData, zonaAsignada: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-orange transition-all"
                />
             </div>
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
                 Guardar Usuario
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
