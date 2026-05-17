import { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Save, 
  X, 
  Check, 
  Info,
  Trash2,
  Lock
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { UserRole } from '../types';
import { APP_PERMISSIONS } from '../constants';

export default function RolesPermissions() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'roles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRoles(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserRole)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'roles');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDeleteRole = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este rol? Los usuarios asignados a este rol perderán sus permisos.')) {
      try {
        await deleteDoc(doc(db, 'roles', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `roles/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Roles y Permisos</h2>
          <p className="text-slate-500 mt-1">Define los tipos de usuario y qué acciones pueden realizar.</p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setShowModal(true);
          }}
          className="bg-amparo-orange text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amparo-orange/20"
        >
          <Plus size={20} />
          Nuevo Rol
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-amparo-orange-light rounded-2xl flex items-center justify-center text-amparo-orange">
                  <Shield size={24} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingRole(role);
                      setShowModal(true);
                    }}
                    className="p-2 text-slate-300 hover:text-amparo-orange transition-colors"
                  >
                    <Lock size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-xl text-slate-800 mb-2">{role.nombre}</h3>
              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{role.descripcion}</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permisos Asignados</span>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {role.permissionKeys?.length || 0} de {APP_PERMISSIONS.length}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 opacity-60">
                   {role.permissionKeys?.slice(0, 4).map(key => {
                     const perm = APP_PERMISSIONS.find(p => p.key === key);
                     return (
                       <span key={key} className="text-[10px] px-2 py-1 bg-slate-50 rounded-lg text-slate-500 font-medium whitespace-nowrap">
                         {perm?.nombre}
                       </span>
                     );
                   })}
                   {(role.permissionKeys?.length || 0) > 4 && (
                     <span className="text-[10px] px-2 py-1 bg-slate-50 rounded-lg text-slate-400 font-medium">
                       +{role.permissionKeys.length - 4} más
                     </span>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RoleModal 
          role={editingRole}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function RoleModal({ role, onClose }: { role: UserRole | null, onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<UserRole>>(
    role || {
      nombre: '',
      descripcion: '',
      permissionKeys: []
    }
  );
  const [saving, setSaving] = useState(false);

  const togglePermission = (key: string) => {
    const current = formData.permissionKeys || [];
    if (current.includes(key)) {
      setFormData({ ...formData, permissionKeys: current.filter(k => k !== key) });
    } else {
      setFormData({ ...formData, permissionKeys: [...current, key] });
    }
  };

  const handleSave = async () => {
    if (!formData.nombre) return;
    setSaving(true);
    try {
      if (role?.id) {
        await updateDoc(doc(db, 'roles', role.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'roles'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, role?.id ? OperationType.UPDATE : OperationType.CREATE, `roles${role?.id ? `/${role.id}` : ''}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-amparo-orange text-white">
          <div className="flex items-center gap-3">
             <Shield size={28} />
             <div>
               <h3 className="font-serif text-2xl">{role ? 'Configurar Rol' : 'Crear Nuevo Rol'}</h3>
               <p className="text-white/70 text-xs font-medium">Asignar permisos específicos al perfil</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 flex flex-col md:flex-row gap-10">
          {/* Info Side */}
          <div className="md:w-1/3 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Rol</label>
              <input 
                type="text" 
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-amparo-orange transition-all text-lg font-bold"
                placeholder="Ej. Administrador"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
              <textarea 
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-amparo-orange transition-all min-h-[120px] text-sm"
                placeholder="Explique el propósito de este rol..."
              />
            </div>

            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
               <Info className="text-amber-600 shrink-0" size={24} />
               <div>
                  <h4 className="text-amber-800 font-bold text-sm">Cambio en tiempo real</h4>
                  <p className="text-amber-700/70 text-xs mt-1 leading-relaxed">Los cambios en los permisos se aplicarán a todos los usuarios con este rol asignado inmediatamente.</p>
               </div>
            </div>
          </div>

          {/* Permissions Side */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Listado de Permisos</h4>
              <button 
                onClick={() => setFormData({ ...formData, permissionKeys: APP_PERMISSIONS.map(p => p.key) })}
                className="text-[10px] font-bold text-amparo-orange hover:underline uppercase tracking-widest"
              >
                Seleccionar todo
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
               {APP_PERMISSIONS.map((perm) => (
                 <button
                   key={perm.key}
                   onClick={() => togglePermission(perm.key)}
                   className={cn(
                     "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                     formData.permissionKeys?.includes(perm.key)
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-white border-slate-100 hover:border-slate-200"
                   )}
                 >
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                     formData.permissionKeys?.includes(perm.key)
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                   )}>
                     {formData.permissionKeys?.includes(perm.key) ? <Check size={20} /> : <Lock size={18} />}
                   </div>
                   <div className="flex-1">
                      <p className={cn(
                        "font-bold text-sm",
                        formData.permissionKeys?.includes(perm.key) ? "text-emerald-700" : "text-slate-700"
                      )}>{perm.nombre}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{perm.descripcion}</p>
                   </div>
                 </button>
               ))}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-4 bg-slate-50/50">
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
                 Guardar Configuración
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
