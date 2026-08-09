import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { LayoutDashboard, Egg, Users, Wallet, Skull, Syringe, Bird, Plus, X, Camera, TrendingUp, Trash2, PawPrint, Pencil } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const supabase = createClient(
  "https://socfymhrxvryctzpsqpy.supabase.co",
  "sb_publishable_FpFeLbnb46SP4oFA1f_UzQ_lDligJg7"
);

async function insertRow(table, payload) {
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw error;
}
async function updateRow(table, id, payload) {
  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) throw error;
}
async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
async function uploadPhoto(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(filename, file);
  if (error) throw error;
  const { data } = supabase.storage.from("photos").getPublicUrl(filename);
  return data.publicUrl;
}
function photoUrl(path) {
  return path || null;
}

function fmt(n) {
  return (Number(n) || 0).toLocaleString("fr-FR");
}

function byDateDesc(list, key = "date") {
  return [...list].sort((a, b) => (b[key] || "").localeCompare(a[key] || ""));
}

function PhotoPicker({ value, onChange, existingUrl }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [value]);

  const shown = previewUrl || existingUrl;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
      />
      {shown ? (
        <div className="relative inline-block">
          <img src={shown} alt="preuve" className="h-20 w-20 object-cover rounded-lg border border-stone-300" />
          <button type="button" onClick={() => onChange(null)} className="absolute -top-2 -right-2 bg-stone-800 text-white rounded-full p-0.5">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 text-sm text-emerald-700 border border-dashed border-emerald-400 rounded-lg px-3 py-2 hover:bg-emerald-50"
        >
          <Camera size={16} /> Ajouter une photo
        </button>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-stone-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500";

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl border border-stone-200 p-4 ${className}`}>{children}</div>;
}

function StatCard({ label, value, sub, tone = "emerald" }) {
  const tones = {
    emerald: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    red: "text-red-700 bg-red-50",
    stone: "text-stone-700 bg-stone-100",
  };
  return (
    <Card>
      <div className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-2 ${tones[tone]}`}>{label}</div>
      <div className="text-2xl font-semibold text-stone-900">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </Card>
  );
}

export default function PoulaillerApp() {
  const [tab, setTab] = useState("dashboard");
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [expenses, setExpenses] = useState([]);
  const [productions, setProductions] = useState([]);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deaths, setDeaths] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [races, setRaces] = useState([]);
  const [categories, setCategories] = useState([]);

  async function reload(table) {
    if (table === "races") {
      const { data, error } = await supabase.from("races").select("*").order("name");
      if (error) throw error;
      setRaces(data || []);
    } else if (table === "categories") {
      const { data, error } = await supabase.from("expense_categories").select("*").order("name");
      if (error) throw error;
      setCategories(data || []);
    } else if (table === "productions") {
      const { data, error } = await supabase.from("productions").select("*, races(name)").order("production_date", { ascending: false });
      if (error) throw error;
      setProductions((data || []).map((p) => ({ ...p, race_name: p.races?.name })));
    } else if (table === "expenses") {
      const { data, error } = await supabase.from("expenses").select("*, expense_categories(name)").order("expense_date", { ascending: false });
      if (error) throw error;
      setExpenses((data || []).map((e) => ({ ...e, category_name: e.expense_categories?.name })));
    } else if (table === "clients") {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      setClients(data || []);
    } else if (table === "orders") {
      const { data, error } = await supabase.from("orders").select("*, clients(name, phone, location)").order("delivery_date", { ascending: false });
      if (error) throw error;
      setOrders((data || []).map((o) => ({ ...o, client_name: o.clients?.name, client_phone: o.clients?.phone, client_location: o.clients?.location })));
    } else if (table === "deaths") {
      const { data, error } = await supabase.from("deaths").select("*, races(name)").order("death_date", { ascending: false });
      if (error) throw error;
      setDeaths((data || []).map((d) => ({ ...d, race_name: d.races?.name })));
    } else if (table === "vaccinations") {
      const { data, error } = await supabase.from("vaccinations").select("*, races(name)").order("vaccination_date", { ascending: false });
      if (error) throw error;
      setVaccinations((data || []).map((v) => ({ ...v, race_name: v.races?.name })));
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          reload("races"), reload("categories"), reload("productions"),
          reload("expenses"), reload("clients"), reload("orders"),
          reload("deaths"), reload("vaccinations"),
        ]);
      } catch (e) {
        setErrorMsg("Impossible de contacter la base de données : " + e.message);
      }
      setReady(true);
    })();
  }, []);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalProduced = productions.reduce((s, p) => s + Number(p.quantity || 0), 0);
  const totalSold = orders.reduce((s, o) => s + Number(o.plateaux || 0), 0);
  const stockRestant = totalProduced - totalSold;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.plateaux || 0) * Number(o.unit_price || 0), 0);
  const totalPaid = orders.reduce((s, o) => s + Number(o.amount_paid || 0), 0);
  const totalDue = totalRevenue - totalPaid;
  const gainNet = totalRevenue - totalExpenses;
  const totalDeaths = deaths.reduce((s, d) => s + Number(d.count || 0), 0);

  const monthlyMap = {};
  const addToMonth = (dateStr, key, val) => {
    if (!dateStr) return;
    const m = dateStr.slice(0, 7);
    monthlyMap[m] = monthlyMap[m] || { month: m, ventes: 0, depenses: 0 };
    monthlyMap[m][key] += val;
  };
  orders.forEach((o) => addToMonth(o.delivery_date, "ventes", Number(o.plateaux || 0) * Number(o.unit_price || 0)));
  expenses.forEach((e) => addToMonth(e.expense_date, "depenses", Number(e.amount || 0)));
  const chartData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  const tabs = [
    { id: "dashboard", label: "Suivi", icon: LayoutDashboard },
    { id: "production", label: "Production", icon: Egg },
    { id: "sales", label: "Ventes", icon: Users },
    { id: "expenses", label: "Dépenses", icon: Wallet },
    { id: "deaths", label: "Décès", icon: Skull },
    { id: "vaccination", label: "Vaccins", icon: Syringe },
    { id: "races", label: "Races", icon: Bird },
    { id: "photos", label: "Photos", icon: Camera },
  ];

  if (!ready) {
    return <div className="p-8 text-center text-stone-400 text-sm">Chargement des données du poulailler…</div>;
  }

  return (
    <div className="bg-stone-50 rounded-2xl overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="bg-emerald-800 text-white px-5 py-4">
        <div className="flex items-center gap-2">
          <PawPrint size={20} />
          <h1 className="text-lg font-semibold">Gestion du poulailler</h1>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 text-xs px-4 py-2 border-b border-red-100">{errorMsg}</div>
      )}

      <div className="flex overflow-x-auto border-b border-stone-200 bg-white sticky top-0 z-10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? "border-emerald-700 text-emerald-800 font-medium" : "border-transparent text-stone-400"
            }`}
          >
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Revenu total" value={`${fmt(totalRevenue)} F`} tone="emerald" />
              <StatCard label="Dépenses totales" value={`${fmt(totalExpenses)} F`} tone="amber" />
              <StatCard label="Gain net" value={`${fmt(gainNet)} F`} sub={gainNet >= 0 ? "Bénéfice" : "Perte"} tone={gainNet >= 0 ? "emerald" : "red"} />
              <StatCard label="Reste à encaisser" value={`${fmt(totalDue)} F`} tone="amber" />
              <StatCard label="Stock de plateaux" value={fmt(stockRestant)} sub={`${fmt(totalProduced)} produits / ${fmt(totalSold)} vendus`} tone="stone" />
              <StatCard label="Décès enregistrés" value={fmt(totalDeaths)} tone="red" />
            </div>
            <Card>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-stone-700">
                <TrendingUp size={16} className="text-emerald-700" /> Ventes vs dépenses par mois
              </div>
              {chartData.length === 0 ? (
                <p className="text-sm text-stone-400">Aucune donnée pour l'instant. Ajoute des ventes ou dépenses.</p>
              ) : (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="ventes" fill="#059669" name="Ventes" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="depenses" fill="#d97706" name="Dépenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === "production" && (
          <ProductionTab
            productions={productions}
            races={races}
            onAdd={async (p) => {
              const photo_path = p.photo instanceof File ? await uploadPhoto(p.photo) : null;
              await insertRow("productions", {
                production_date: p.date, quantity: p.quantity, unit_price: p.prixUnitaire,
                race_id: p.raceId || null, photo_path,
              });
              await reload("productions");
            }}
            onDelete={async (id) => { await deleteRow("productions", id); await reload("productions"); }}
            onUpdate={async (id, p) => {
              const photo_path = p.photo instanceof File ? await uploadPhoto(p.photo) : p.existingPhoto ?? null;
              await updateRow("productions", id, {
                production_date: p.date, quantity: p.quantity, unit_price: p.prixUnitaire,
                race_id: p.raceId || null, photo_path,
              });
              await reload("productions");
            }}
          />
        )}

        {tab === "sales" && (
          <SalesTab
            clients={clients}
            orders={orders}
            onAddClient={async (c) => { await insertRow("clients", c); await reload("clients"); }}
            onAddOrder={async (o) => {
              await insertRow("orders", {
                client_id: o.clientId, plateaux: o.plateaux, unit_price: o.prixUnitaire,
                delivery_date: o.dateLivraison, amount_paid: o.montantPaye,
              });
              await reload("orders");
            }}
            onDeleteOrder={async (id) => { await deleteRow("orders", id); await reload("orders"); }}
            onDeleteClient={async (id) => { await deleteRow("clients", id); await reload("clients"); await reload("orders"); }}
            onUpdateOrder={async (id, o) => {
              await updateRow("orders", id, {
                client_id: o.clientId, plateaux: o.plateaux, unit_price: o.prixUnitaire,
                delivery_date: o.dateLivraison, amount_paid: o.montantPaye,
              });
              await reload("orders");
            }}
            onUpdateClient={async (id, c) => { await updateRow("clients", id, c); await reload("clients"); await reload("orders"); }}
          />
        )}

        {tab === "expenses" && (
          <ExpensesTab
            expenses={expenses}
            categories={categories}
            onAdd={async (e) => {
              const photo_path = e.photo instanceof File ? await uploadPhoto(e.photo) : null;
              await insertRow("expenses", {
                category_id: e.categoryId, amount: e.amount, expense_date: e.date, note: e.note, photo_path,
              });
              await reload("expenses");
            }}
            onDelete={async (id) => { await deleteRow("expenses", id); await reload("expenses"); }}
            onAddCategory={async (name) => { await insertRow("expense_categories", { name }); await reload("categories"); }}
            onUpdate={async (id, e) => {
              const photo_path = e.photo instanceof File ? await uploadPhoto(e.photo) : e.existingPhoto ?? null;
              await updateRow("expenses", id, {
                category_id: e.categoryId, amount: e.amount, expense_date: e.date, note: e.note, photo_path,
              });
              await reload("expenses");
            }}
          />
        )}

        {tab === "deaths" && (
          <DeathsTab
            deaths={deaths}
            races={races}
            onAdd={async (d) => {
              const photo_path = d.photo instanceof File ? await uploadPhoto(d.photo) : null;
              await insertRow("deaths", {
                death_date: d.date, count: d.count, cause: d.cause, race_id: d.raceId || null, photo_path,
              });
              await reload("deaths");
            }}
            onDelete={async (id) => { await deleteRow("deaths", id); await reload("deaths"); }}
            onUpdate={async (id, d) => {
              const photo_path = d.photo instanceof File ? await uploadPhoto(d.photo) : d.existingPhoto ?? null;
              await updateRow("deaths", id, {
                death_date: d.date, count: d.count, cause: d.cause, race_id: d.raceId || null, photo_path,
              });
              await reload("deaths");
            }}
          />
        )}

        {tab === "vaccination" && (
          <VaccinationTab
            vaccinations={vaccinations}
            races={races}
            onAdd={async (v) => {
              await insertRow("vaccinations", { vaccination_date: v.date, vaccine_name: v.vaccine, race_id: v.raceId || null });
              await reload("vaccinations");
            }}
            onDelete={async (id) => { await deleteRow("vaccinations", id); await reload("vaccinations"); }}
            onUpdate={async (id, v) => {
              await updateRow("vaccinations", id, { vaccination_date: v.date, vaccine_name: v.vaccine, race_id: v.raceId || null });
              await reload("vaccinations");
            }}
          />
        )}

        {tab === "races" && (
          <RacesTab
            races={races}
            onAdd={async (name) => { await insertRow("races", { name }); await reload("races"); }}
            onDelete={async (id) => { await deleteRow("races", id); await reload("races"); }}
            onUpdate={async (id, name) => { await updateRow("races", id, { name }); await reload("races"); }}
          />
        )}

        {tab === "photos" && (
          <PhotosTab productions={productions} expenses={expenses} deaths={deaths} />
        )}
      </div>
    </div>
  );
}

const EGGS_PER_PLATEAU = 30;
function plateauxBreakdown(quantity) {
  const q = Number(quantity) || 0;
  const complete = Math.floor(q + 1e-9);
  const remainderEggs = Math.round((q - complete) * EGGS_PER_PLATEAU);
  return { complete, remainderEggs };
}

function ProductionTab({ productions, races, onAdd, onDelete, onUpdate }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [eggs, setEggs] = useState("");
  const [prix, setPrix] = useState("");
  const [raceId, setRaceId] = useState(races[0]?.id || "");
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const totalGeneral = productions.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.unit_price || 0), 0);
  const eggsCount = Number(eggs) || 0;
  const quantity = Math.round((eggsCount / EGGS_PER_PLATEAU) * 100) / 100;
  const { complete: previewComplete, remainderEggs: previewRemainder } = plateauxBreakdown(quantity);

  function startEdit(p) {
    setEditingId(p.id);
    setDate(p.production_date);
    setEggs(String(Math.round(Number(p.quantity) * EGGS_PER_PLATEAU)));
    setPrix(String(p.unit_price));
    setRaceId(p.race_id || "");
    setPhoto(null);
    setExistingPhoto(p.photo_path || null);
  }
  function cancelEdit() {
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setEggs(""); setPrix(""); setPhoto(null); setExistingPhoto(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!eggs) return;
    setSaving(true);
    if (editingId) {
      await onUpdate(editingId, { date, quantity, prixUnitaire: Number(prix || 0), raceId, photo, existingPhoto });
      cancelEdit();
    } else {
      await onAdd({ date, quantity, prixUnitaire: Number(prix || 0), raceId, photo });
      setEggs(""); setPrix(""); setPhoto(null);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <StatCard label="Total général des plateaux récoltés" value={`${fmt(totalGeneral)} F`} sub={`${fmt(productions.reduce((s, p) => s + Number(p.quantity || 0), 0))} plateaux au total`} tone="emerald" />
      <Card>
        {editingId && (
          <div className="flex items-center justify-between bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2 mb-3">
            <span>Modification d'une récolte existante</span>
            <button type="button" onClick={cancelEdit} className="font-medium underline">Annuler</button>
          </div>
        )}
        <form onSubmit={submit}>
          <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Nombre d'œufs récoltés"><input type="number" min="0" className={inputCls} value={eggs} onChange={(e) => setEggs(e.target.value)} placeholder="ex: 223" /></Field>
          {eggsCount > 0 && (
            <div className="bg-emerald-50 text-emerald-700 text-xs rounded-lg px-3 py-2 mb-3">
              = {previewComplete} plateau{previewComplete > 1 ? "x" : ""} complet{previewComplete > 1 ? "s" : ""}
              {previewRemainder > 0 ? ` + ${previewRemainder} œufs` : ""} ({quantity.toLocaleString("fr-FR")} plateaux)
            </div>
          )}
          <Field label="Prix par plateau (F)"><input type="number" min="0" className={inputCls} value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="ex: 2500" /></Field>
          <Field label="Race">
            <select className={inputCls} value={raceId} onChange={(e) => setRaceId(e.target.value)}>
              {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Preuve (photo)"><PhotoPicker value={photo} onChange={setPhoto} existingUrl={photoUrl(existingPhoto)} /></Field>
          <button disabled={saving} className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50">
            <Plus size={16} /> {saving ? "Enregistrement..." : editingId ? "Mettre à jour la récolte" : "Enregistrer la récolte"}
          </button>
        </form>
      </Card>
      <div className="space-y-2">
        <div className="text-xs font-medium text-stone-500 px-1">Historique des récoltes</div>
        {productions.length === 0 && <p className="text-sm text-stone-400">Aucune récolte enregistrée pour l'instant.</p>}
        {byDateDesc(productions, "production_date").map((p) => {
          const { complete, remainderEggs } = plateauxBreakdown(p.quantity);
          return (
            <Card key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {p.photo_path && <img src={photoUrl(p.photo_path)} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                <div>
                  <div className="text-sm font-medium text-stone-800">{p.production_date} · {p.race_name || "—"}</div>
                  <div className="text-xs text-stone-500">
                    {complete} plateau{complete > 1 ? "x" : ""}{remainderEggs > 0 ? ` + ${remainderEggs} œufs` : ""} × {fmt(p.unit_price)} F = {fmt(p.total_price)} F
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(p)} className="text-stone-300 hover:text-emerald-700 p-1"><Pencil size={16} /></button>
                <button onClick={() => onDelete(p.id)} className="text-stone-300 hover:text-red-600 p-1"><Trash2 size={16} /></button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SalesTab({ clients, orders, onAddClient, onAddOrder, onDeleteOrder, onDeleteClient, onUpdateOrder, onUpdateClient }) {
  const [showClientForm, setShowClientForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [editingClientId, setEditingClientId] = useState(null);

  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [plateaux, setPlateaux] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [dateLivraison, setDateLivraison] = useState(new Date().toISOString().slice(0, 10));
  const [montantPaye, setMontantPaye] = useState("");
  const [editingOrderId, setEditingOrderId] = useState(null);

  useEffect(() => {
    if (!clientId && clients[0]) setClientId(clients[0].id);
  }, [clients]);

  const total = Number(plateaux || 0) * Number(prixUnitaire || 0);
  const reste = total - Number(montantPaye || 0);

  async function submitClient(e) {
    e.preventDefault();
    if (!name) return;
    if (editingClientId) {
      await onUpdateClient(editingClientId, { name, phone, location });
      setEditingClientId(null);
    } else {
      await onAddClient({ name, phone, location });
    }
    setName(""); setPhone(""); setLocation(""); setShowClientForm(false);
  }

  function startEditClient(c) {
    setEditingClientId(c.id);
    setName(c.name); setPhone(c.phone || ""); setLocation(c.location || "");
    setShowClientForm(true);
  }

  function startEditOrder(o) {
    setEditingOrderId(o.id);
    setClientId(o.client_id);
    setPlateaux(String(o.plateaux));
    setPrixUnitaire(String(o.unit_price));
    setDateLivraison(o.delivery_date);
    setMontantPaye(String(o.amount_paid));
  }
  function cancelEditOrder() {
    setEditingOrderId(null);
    setPlateaux(""); setPrixUnitaire(""); setMontantPaye("");
    setDateLivraison(new Date().toISOString().slice(0, 10));
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (!clientId || !plateaux) return;
    if (editingOrderId) {
      await onUpdateOrder(editingOrderId, { clientId, plateaux: Number(plateaux), prixUnitaire: Number(prixUnitaire || 0), dateLivraison, montantPaye: Number(montantPaye || 0) });
      cancelEditOrder();
    } else {
      await onAddOrder({ clientId, plateaux: Number(plateaux), prixUnitaire: Number(prixUnitaire || 0), dateLivraison, montantPaye: Number(montantPaye || 0) });
      setPlateaux(""); setPrixUnitaire(""); setMontantPaye("");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">Clients — historique par client</span>
          <button onClick={() => { setShowClientForm((v) => !v); setEditingClientId(null); setName(""); setPhone(""); setLocation(""); }} className="text-xs text-emerald-700 flex items-center gap-1">
            <Plus size={14} /> Nouveau client
          </button>
        </div>
        {showClientForm && (
          <form onSubmit={submitClient} className="mb-3 bg-stone-50 rounded-lg p-3">
            {editingClientId && <div className="text-xs text-amber-700 mb-2">Modification du client</div>}
            <Field label="Nom"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Numéro"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="Localisation"><input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
            <button className="w-full bg-emerald-700 text-white rounded-lg py-2 text-sm">{editingClientId ? "Mettre à jour le client" : "Ajouter le client"}</button>
          </form>
        )}
        {clients.length === 0 && <p className="text-xs text-stone-400">Aucun client enregistré.</p>}
        <div className="space-y-2">
          {clients.map((c) => {
            const clientOrders = byDateDesc(orders.filter((o) => String(o.client_id) === String(c.id)), "delivery_date");
            const cTotal = clientOrders.reduce((s, o) => s + Number(o.plateaux) * Number(o.unit_price), 0);
            const cPaid = clientOrders.reduce((s, o) => s + Number(o.amount_paid || 0), 0);
            const cDue = cTotal - cPaid;
            const isOpen = expandedClientId === c.id;
            return (
              <div key={c.id} className="bg-stone-50 rounded-lg overflow-hidden">
                <button type="button" onClick={() => setExpandedClientId(isOpen ? null : c.id)} className="w-full flex items-center justify-between px-3 py-2 text-left">
                  <div>
                    <div className="text-sm font-medium text-stone-800">{c.name}</div>
                    <div className="text-xs text-stone-500">{c.phone}{c.location ? ` · ${c.location}` : ""} — {clientOrders.length} commande{clientOrders.length > 1 ? "s" : ""}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {cDue > 0 && <span className="text-xs font-medium text-red-600 mr-1">Doit {fmt(cDue)} F</span>}
                    <button onClick={(e) => { e.stopPropagation(); startEditClient(c); }} className="text-stone-300 hover:text-emerald-700 p-1"><Pencil size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteClient(c.id); }} className="text-stone-300 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3">
                    <div className="grid grid-cols-3 gap-2 text-center bg-white rounded-lg p-2 mb-2">
                      <div><div className="text-xs text-stone-400">Total</div><div className="text-sm font-medium text-stone-800">{fmt(cTotal)} F</div></div>
                      <div><div className="text-xs text-stone-400">Payé</div><div className="text-sm font-medium text-emerald-700">{fmt(cPaid)} F</div></div>
                      <div><div className="text-xs text-stone-400">Reste</div><div className={`text-sm font-medium ${cDue > 0 ? "text-red-600" : "text-emerald-700"}`}>{fmt(cDue)} F</div></div>
                    </div>
                    {clientOrders.length === 0 ? (
                      <p className="text-xs text-stone-400">Aucune commande pour ce client.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {clientOrders.map((o) => {
                          const t = Number(o.plateaux) * Number(o.unit_price);
                          const r = t - Number(o.amount_paid);
                          return (
                            <div key={o.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-2">
                              <div>
                                <div className="font-medium text-stone-700">{o.delivery_date}</div>
                                <div className="text-stone-500">{o.plateaux} plateaux — {fmt(t)} F{r > 0 ? ` — reste ${fmt(r)} F` : " — soldé"}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => startEditOrder(o)} className="text-stone-300 hover:text-emerald-700 p-1"><Pencil size={14} /></button>
                                <button onClick={() => onDeleteOrder(o.id)} className="text-stone-300 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-stone-700">{editingOrderId ? "Modifier la commande" : "Nouvelle commande"}</div>
          {editingOrderId && <button type="button" onClick={cancelEditOrder} className="text-xs text-amber-700 underline">Annuler</button>}
        </div>
        <form onSubmit={submitOrder}>
          <Field label="Client">
            <select className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Nombre de plateaux"><input type="number" className={inputCls} value={plateaux} onChange={(e) => setPlateaux(e.target.value)} /></Field>
          <Field label="Prix par plateau (F)"><input type="number" className={inputCls} value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} /></Field>
          <Field label="Date de livraison"><input type="date" className={inputCls} value={dateLivraison} onChange={(e) => setDateLivraison(e.target.value)} /></Field>
          <Field label="Montant déjà payé (F)"><input type="number" className={inputCls} value={montantPaye} onChange={(e) => setMontantPaye(e.target.value)} /></Field>
          <div className="bg-emerald-50 rounded-lg p-3 mb-3 text-sm flex justify-between">
            <span>Total : <b>{fmt(total)} F</b></span>
            <span className={reste > 0 ? "text-red-600" : "text-emerald-700"}>Reste : <b>{fmt(reste)} F</b></span>
          </div>
          <button className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1" disabled={!clients.length}>
            <Plus size={16} /> {editingOrderId ? "Mettre à jour la commande" : "Enregistrer la commande"}
          </button>
          {!clients.length && <p className="text-xs text-red-500 mt-2">Ajoute d'abord un client.</p>}
        </form>
      </Card>

      <div className="space-y-2">
        <div className="text-xs font-medium text-stone-500 px-1">Historique de toutes les commandes</div>
        {orders.length === 0 && <p className="text-sm text-stone-400">Aucune commande enregistrée pour l'instant.</p>}
        {byDateDesc(orders, "delivery_date").map((o) => {
          const t = Number(o.plateaux) * Number(o.unit_price);
          const r = t - Number(o.amount_paid);
          return (
            <Card key={o.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-stone-800">{o.client_name || "Client supprimé"} · {o.delivery_date}</div>
                <div className="text-xs text-stone-500">{o.plateaux} plateaux — {fmt(t)} F total — payé {fmt(o.amount_paid)} F</div>
                <div className={`text-xs font-medium ${r > 0 ? "text-red-600" : "text-emerald-700"}`}>{r > 0 ? `Reste ${fmt(r)} F` : "Soldé"}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEditOrder(o)} className="text-stone-300 hover:text-emerald-700 p-1"><Pencil size={16} /></button>
                <button onClick={() => onDeleteOrder(o.id)} className="text-stone-300 hover:text-red-600 p-1"><Trash2 size={16} /></button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ExpensesTab({ expenses, categories, onAdd, onDelete, onAddCategory, onUpdate }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [newCat, setNewCat] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories]);

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  function startEdit(e) {
    setEditingId(e.id);
    setCategoryId(e.category_id);
    setAmount(String(e.amount));
    setDate(e.expense_date);
    setNote(e.note || "");
    setPhoto(null);
    setExistingPhoto(e.photo_path || null);
  }
  function cancelEdit() {
    setEditingId(null);
    setAmount(""); setNote(""); setPhoto(null); setExistingPhoto(null);
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function submit(e) {
    e.preventDefault();
    if (!amount) return;
    if (editingId) {
      await onUpdate(editingId, { categoryId, amount: Number(amount), date, note, photo, existingPhoto });
      cancelEdit();
    } else {
      await onAdd({ categoryId, amount: Number(amount), date, note, photo });
      setAmount(""); setNote(""); setPhoto(null);
    }
  }

  async function addCat(e) {
    e.preventDefault();
    if (!newCat) return;
    await onAddCategory(newCat);
    setNewCat(""); setShowNewCat(false);
  }

  return (
    <div className="space-y-4">
      <StatCard label="Total des dépenses" value={`${fmt(total)} F`} tone="amber" />
      <Card>
        {editingId && (
          <div className="flex items-center justify-between bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2 mb-3">
            <span>Modification d'une dépense existante</span>
            <button type="button" onClick={cancelEdit} className="font-medium underline">Annuler</button>
          </div>
        )}
        <form onSubmit={submit}>
          <Field label="Catégorie">
            <div className="flex gap-2">
              <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewCat((v) => !v)} className="text-xs text-emerald-700 whitespace-nowrap px-2">+ Catégorie</button>
            </div>
          </Field>
          {showNewCat && (
            <div className="flex gap-2 mb-3">
              <input className={inputCls} placeholder="Nouvelle catégorie" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button onClick={addCat} className="bg-stone-800 text-white text-xs px-3 rounded-lg">OK</button>
            </div>
          )}
          <Field label="Montant (F)"><input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Note (optionnel)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Field label="Preuve (photo)"><PhotoPicker value={photo} onChange={setPhoto} existingUrl={photoUrl(existingPhoto)} /></Field>
          <button className="w-full bg-amber-600 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1">
            <Plus size={16} /> {editingId ? "Mettre à jour la dépense" : "Enregistrer la dépense"}
          </button>
        </form>
      </Card>
      <div className="space-y-2">
        <div className="text-xs font-medium text-stone-500 px-1">Historique des dépenses</div>
        {expenses.length === 0 && <p className="text-sm text-stone-400">Aucune dépense enregistrée pour l'instant.</p>}
        {byDateDesc(expenses, "expense_date").map((e) => (
          <Card key={e.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {e.photo_path && <img src={photoUrl(e.photo_path)} className="w-12 h-12 rounded-lg object-cover" alt="" />}
              <div>
                <div className="text-sm font-medium text-stone-800">{e.category_name} · {fmt(e.amount)} F</div>
                <div className="text-xs text-stone-500">{e.expense_date}{e.note ? ` — ${e.note}` : ""}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(e)} className="text-stone-300 hover:text-emerald-700 p-1"><Pencil size={16} /></button>
              <button onClick={() => onDelete(e.id)} className="text-stone-300 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DeathsTab({ deaths, races, onAdd, onDelete, onUpdate }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [count, setCount] = useState("");
  const [cause, setCause] = useState("");
  const [raceId, setRaceId] = useState(races[0]?.id || "");
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const total = deaths.reduce((s, d) => s + Number(d.count || 0), 0);

  function startEdit(d) {
    setEditingId(d.id);
    setDate(d.death_date);
    setCount(String(d.count));
    setCause(d.cause || "");
    setRaceId(d.race_id || "");
    setPhoto(null);
    setExistingPhoto(d.photo_path || null);
  }
  function cancelEdit() {
    setEditingId(null);
    setCount(""); setCause(""); setPhoto(null); setExistingPhoto(null);
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function submit(e) {
    e.preventDefault();
    if (!count) return;
    if (editingId) {
      await onUpdate(editingId, { date, count: Number(count), cause, raceId, photo, existingPhoto });
      cancelEdit();
    } else {
      await onAdd({ date, count: Number(count), cause, raceId, photo });
      setCount(""); setCause(""); setPhoto(null);
    }
  }

  return (
    <div className="space-y-4">
      <StatCard label="Total décès enregistrés" value={fmt(total)} tone="red" />
      <Card>
        {editingId && (
          <div className="flex items-center justify-between bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2 mb-3">
            <span>Modification d'un décès existant</span>
            <button type="button" onClick={cancelEdit} className="font-medium underline">Annuler</button>
          </div>
        )}
        <form onSubmit={submit}>
          <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Nombre"><input type="number" min="0" className={inputCls} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
          <Field label="Motif"><input className={inputCls} value={cause} onChange={(e) => setCause(e.target.value)} placeholder="ex: maladie, chaleur..." /></Field>
          <Field label="Race">
            <select className={inputCls} value={raceId} onChange={(e) => setRaceId(e.target.value)}>
              {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Preuve (photo)"><PhotoPicker value={photo} onChange={setPhoto} existingUrl={photoUrl(existingPhoto)} /></Field>
          <button className="w-full bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1">
            <Plus size={16} /> {editingId ? "Mettre à jour" : "Enregistrer"}
          </button>
        </form>
      </Card>
      <div className="space-y-2">
        <div className="text-xs font-medium text-stone-500 px-1">Historique des décès</div>
        {deaths.length === 0 && <p className="text-sm text-stone-400">Aucun décès enregistré pour l'instant.</p>}
        {byDateDesc(deaths, "death_date").map((d) => (
          <Card key={d.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {d.photo_path && <img src={photoUrl(d.photo_path)} className="w-12 h-12 rounded-lg object-cover" alt="" />}
              <div>
                <div className="text-sm font-medium text-stone-800">{d.death_date} · {fmt(d.count)} — {d.race_name || "—"}</div>
                <div className="text-xs text-stone-500">{d.cause || "Motif non précisé"}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(d)} className="text-stone-300 hover:text-emerald-700 p-1"><Pencil size={16} /></button>
              <button onClick={() => onDelete(d.id)} className="text-stone-300 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VaccinationTab({ vaccinations, races, onAdd, onDelete, onUpdate }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vaccine, setVaccine] = useState("");
  const [raceId, setRaceId] = useState(races[0]?.id || "");
  const [editingId, setEditingId] = useState(null);

  function startEdit(v) {
    setEditingId(v.id);
    setDate(v.vaccination_date);
    setVaccine(v.vaccine_name);
    setRaceId(v.race_id || "");
  }
  function cancelEdit() {
    setEditingId(null);
    setVaccine("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function submit(e) {
    e.preventDefault();
    if (!vaccine) return;
    if (editingId) {
      await onUpdate(editingId, { date, vaccine, raceId });
      cancelEdit();
    } else {
      await onAdd({ date, vaccine, raceId });
      setVaccine("");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        {editingId && (
          <div className="flex items-center justify-between bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2 mb-3">
            <span>Modification d'une vaccination existante</span>
            <button type="button" onClick={cancelEdit} className="font-medium underline">Annuler</button>
          </div>
        )}
        <form onSubmit={submit}>
          <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Vaccin"><input className={inputCls} value={vaccine} onChange={(e) => setVaccine(e.target.value)} placeholder="ex: Newcastle" /></Field>
          <Field label="Race">
            <select className={inputCls} value={raceId} onChange={(e) => setRaceId(e.target.value)}>
              {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <button className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1">
            <Plus size={16} /> {editingId ? "Mettre à jour" : "Enregistrer la vaccination"}
          </button>
        </form>
      </Card>
      <div className="space-y-2">
        <div className="text-xs font-medium text-stone-500 px-1">Historique des vaccinations</div>
        {vaccinations.length === 0 && <p className="text-sm text-stone-400">Aucune vaccination enregistrée pour l'instant.</p>}
        {byDateDesc(vaccinations, "vaccination_date").map((v) => (
          <Card key={v.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-stone-800">{v.vaccine_name}</div>
              <div className="text-xs text-stone-500">{v.vaccination_date} · {v.race_name || "—"}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(v)} className="text-stone-300 hover:text-emerald-700 p-1"><Pencil size={16} /></button>
              <button onClick={() => onDelete(v.id)} className="text-stone-300 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RacesTab({ races, onAdd, onDelete, onUpdate }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name) return;
    await onAdd(name);
    setName("");
  }
  async function saveEdit(id) {
    if (!editValue.trim()) return;
    await onUpdate(id, editValue.trim());
    setEditingId(null);
  }
  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={submit} className="flex gap-2">
          <input className={inputCls} placeholder="Nom de la nouvelle race" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="bg-emerald-700 text-white rounded-lg px-4 text-sm flex items-center gap-1"><Plus size={16} /></button>
        </form>
      </Card>
      <div className="space-y-2">
        {races.map((r) => (
          <Card key={r.id} className="flex items-center justify-between">
            {editingId === r.id ? (
              <input
                autoFocus
                className={inputCls}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(r.id)}
              />
            ) : (
              <div className="flex items-center gap-2 text-sm font-medium text-stone-800"><Bird size={16} className="text-emerald-700" /> {r.name}</div>
            )}
            <div className="flex items-center gap-1 ml-2">
              {editingId === r.id ? (
                <button onClick={() => saveEdit(r.id)} className="text-xs text-emerald-700 font-medium px-2">OK</button>
              ) : (
                <button onClick={() => { setEditingId(r.id); setEditValue(r.name); }} className="text-stone-300 hover:text-emerald-700 p-1"><Pencil size={16} /></button>
              )}
              <button onClick={() => onDelete(r.id)} className="text-stone-300 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PhotosTab({ productions, expenses, deaths }) {
  const [filter, setFilter] = useState("all");

  const items = [
    ...productions.filter((p) => p.photo_path).map((p) => ({
      id: "prod-" + p.id, photo: photoUrl(p.photo_path), date: p.production_date, source: "Production",
      detail: `${fmt(p.quantity)} plateaux · ${p.race_name || "—"}`, tone: "emerald",
    })),
    ...expenses.filter((e) => e.photo_path).map((e) => ({
      id: "exp-" + e.id, photo: photoUrl(e.photo_path), date: e.expense_date, source: "Dépense",
      detail: `${e.category_name} · ${fmt(e.amount)} F`, tone: "amber",
    })),
    ...deaths.filter((d) => d.photo_path).map((d) => ({
      id: "death-" + d.id, photo: photoUrl(d.photo_path), date: d.death_date, source: "Décès",
      detail: `${fmt(d.count)} · ${d.cause || "motif non précisé"}`, tone: "red",
    })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const filters = [
    { id: "all", label: "Toutes" },
    { id: "Production", label: "Production" },
    { id: "Dépense", label: "Dépenses" },
    { id: "Décès", label: "Décès" },
  ];
  const shown = filter === "all" ? items : items.filter((i) => i.source === filter);

  const tones = {
    emerald: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    red: "text-red-700 bg-red-50",
  };

  return (
    <div className="space-y-4">
      <StatCard label="Photos enregistrées" value={fmt(items.length)} sub="Toutes catégories confondues" tone="stone" />
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border ${filter === f.id ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-stone-500 border-stone-200"}`}>
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-stone-400">Aucune photo pour l'instant. Les photos ajoutées en Production, Dépenses et Décès apparaîtront ici automatiquement.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shown.map((i) => (
            <Card key={i.id} className="p-2">
              <img src={i.photo} alt="" className="w-full h-28 object-cover rounded-lg mb-2" />
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-1 ${tones[i.tone]}`}>{i.source}</span>
              <div className="text-xs text-stone-700 leading-snug">{i.detail}</div>
              <div className="text-[11px] text-stone-400 mt-0.5">{i.date}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
