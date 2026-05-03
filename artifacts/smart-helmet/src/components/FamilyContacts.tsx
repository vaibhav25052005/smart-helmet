import { useState, useEffect } from "react";
import { Users, X, UserPlus, Phone, Trash2, Send, MessageSquare } from "lucide-react";

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface FamilyContactsProps {
  onSendMessage?: (message: string) => void;
}

export function FamilyContacts({ onSendMessage }: FamilyContactsProps) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [method, setMethod] = useState<"whatsapp" | "sms">("whatsapp");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("helmet_family_contacts");
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse family contacts", e);
      }
    }
    const savedMethod = localStorage.getItem("helmet_msg_method");
    if (savedMethod === "sms") setMethod("sms");
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("helmet_family_contacts", JSON.stringify(contacts));
    localStorage.setItem("helmet_msg_method", method);
  }, [contacts, method]);

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
    };
    setContacts([...contacts, newContact]);
    setNewName("");
    setNewPhone("");
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const sendMessage = (contact: Contact) => {
    const text = "🚨 EMERGENCY: Smart Helmet alert detected! Alcohol or Drowsiness detected. Please check on the rider immediately.";
    if (method === "whatsapp") {
      window.open(`https://wa.me/${contact.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      // Use native SMS URI
      window.open(`sms:${contact.phone.replace(/\D/g, "")}?body=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        <Users className="w-4 h-4" />
        Family Contacts
        {contacts.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-emerald-600 text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-emerald-600">
            {contacts.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden scale-in-center">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-black text-white text-lg tracking-tight">Family Contacts</h2>
                  <p className="text-xs text-slate-400 font-medium">Emergency alert recipients</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* Method Selector */}
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-800/50 border border-white/5">
                <button
                  onClick={() => setMethod("whatsapp")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${method === "whatsapp" ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={() => setMethod("sms")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${method === "sms" ? "bg-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Send className="w-4 h-4" />
                  Real SMS
                </button>
              </div>

              {/* Add New Contact */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Register New Member</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dad"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Phone</label>
                    <input
                      type="tel"
                      placeholder="9198..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                    />
                  </div>
                </div>
                <button
                  onClick={addContact}
                  disabled={!newName.trim() || !newPhone.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-30"
                >
                  <UserPlus className="w-4 h-4" />
                  ADD TO CONTACTS
                </button>
              </div>

              {/* Contacts List */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Safe Contacts ({contacts.length})</p>
                {contacts.length === 0 ? (
                  <div className="text-center py-10 px-6 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02]">
                    <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">No family members registered.<br/>Add them above for emergency alerts.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {contacts.map(contact => (
                      <div key={contact.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm ring-1 ring-emerald-500/30">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white tracking-tight">{contact.name}</p>
                            <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-600" /> {contact.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => sendMessage(contact)}
                            className={`p-2.5 rounded-xl transition-all shadow-sm ${method === "whatsapp" ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500" : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500"} hover:text-white`}
                            title="Send Test Alert"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeContact(contact.id)}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-slate-800/30 text-center">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Smart Helmet Safety Hub v1.1</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
