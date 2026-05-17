import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  MapPin, 
  Clock,
  X,
  Save,
  Trash2,
  Info
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { CalendarEvent } from '../types';

export default function CalendarModule() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'calendar'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'calendar');
    });
    return unsubscribe;
  }, []);

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-3xl font-serif text-slate-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <p className="text-slate-400 text-sm">Gestión de actividades e inconvenientes</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 mr-4">
           <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-amparo-purple"
           >
             <ChevronLeft size={20} />
           </button>
           <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-amparo-purple hover:bg-slate-50 rounded-xl transition-all"
           >
             Hoy
           </button>
           <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-amparo-purple"
           >
             <ChevronRight size={20} />
           </button>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowModal(true);
          }}
          className="bg-amparo-purple text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          Nuevo Evento
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 py-2">
            {d}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((d, i) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.fecha + 'T12:00:00'), d));
          const isSelected = selectedDay && isSameDay(d, selectedDay);
          const isToday = isSameDay(d, new Date());
          const isInMonth = isSameMonth(d, monthStart);

          return (
            <div
              key={d.toString()}
              onClick={() => setSelectedDay(d)}
              className={cn(
                "min-h-[120px] bg-white border rounded-3xl p-4 transition-all cursor-pointer group flex flex-col",
                !isInMonth ? "opacity-30 border-slate-50" : "border-slate-100 hover:shadow-md",
                isToday ? "ring-2 ring-amparo-purple ring-inset active:scale-95" : ""
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={cn(
                  "text-sm font-bold",
                  isToday ? "text-amparo-purple" : "text-slate-600"
                )}>
                  {format(d, dateFormat)}
                </span>
                {isToday && <div className="w-1.5 h-1.5 bg-amparo-purple rounded-full"></div>}
              </div>
              <div className="flex-1 space-y-1.5">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                       e.stopPropagation();
                       setEditingEvent(event);
                       setShowModal(true);
                    }}
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-lg truncate transition-all hover:scale-105",
                      event.tipo === 'feriado' ? "bg-amparo-red-light text-amparo-red" :
                      event.tipo === 'inconveniente' ? "bg-amparo-amber-light text-amparo-amber" :
                      "bg-amparo-purple-light text-amparo-purple"
                    )}
                  >
                    {event.titulo}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderHeader()}
      <div className="bg-slate-100/50 p-6 rounded-[2.5rem] border border-slate-100">
        {renderDays()}
        {renderCells()}
      </div>

      {showModal && (
        <EventModal 
          event={editingEvent}
          initialDate={selectedDay}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function EventModal({ event, initialDate, onClose }: { event: CalendarEvent | null, initialDate: Date | null, onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>(
    event || {
      titulo: '',
      tipo: 'actividad',
      fecha: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      descripcion: ''
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.titulo || !formData.fecha) return;
    setSaving(true);
    try {
      if (event?.id) {
        await updateDoc(doc(db, 'calendar', event.id), formData);
      } else {
        await addDoc(collection(db, 'calendar'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, event?.id ? OperationType.UPDATE : OperationType.CREATE, `calendar${event?.id ? `/${event.id}` : ''}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id || !confirm('¿Eliminar este evento?')) return;
    try {
      await deleteDoc(doc(db, 'calendar', event.id));
      onClose();
    } catch (err) { 
      handleFirestoreError(err, OperationType.DELETE, `calendar/${event.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={cn(
          "p-6 flex items-center justify-between text-white",
          formData.tipo === 'feriado' ? 'bg-amparo-red' : formData.tipo === 'inconveniente' ? 'bg-amparo-amber' : 'bg-amparo-purple'
        )}>
          <div className="flex items-center gap-3">
             <CalendarIcon size={24} />
             <h3 className="font-serif text-xl">{event ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Título / Actividad</label>
            <input 
              type="text" 
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-purple transition-all"
              placeholder="Ej. Feriado Corpus Christi"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tipo</label>
                <select 
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-purple transition-all"
                >
                  <option value="actividad">Actividad</option>
                  <option value="feriado">Feriado</option>
                  <option value="inconveniente">Inconveniente</option>
                  <option value="taller">Taller</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Fecha</label>
                <input 
                  type="date" 
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-purple transition-all"
                />
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Descripción (Opcional)</label>
            <textarea 
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-amparo-purple transition-all min-h-[80px]"
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {event && (
              <button 
                onClick={handleDelete}
                className="text-amparo-red hover:bg-amparo-red/10 p-3 rounded-xl transition-colors"
                title="Eliminar Evento"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cerrar
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-amparo-purple text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-amparo-purple/20"
            >
              <Save size={18} />
              {saving ? "..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
