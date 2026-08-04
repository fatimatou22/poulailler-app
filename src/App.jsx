import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Egg, Users, Wallet, Skull, Syringe, Bird, Plus, X, Camera, TrendingUp, Trash2, PawPrint } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ⚠️ Adresse de tes scripts PHP dans XAMPP. Change-la si besoin.
const API = "https://poulailler.infinityfreeapp.com";

async function apiGet(path) {
  const res = await fetch(`${API}/${path}`);
  if (!res.ok) throw new Error(`Erreur ${path}`);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erreur ${path}`);
  return res.json();
}
async function apiDelete(path, id) {
  const res = await fetch(`${API}/${path}?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Erreur ${path}`);
  return res.json();
}
async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await fetch(`${API}/upload.php`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Erreur upload");
  const data = await res.json();
  return data.photo_path;
}
function photoUrl(path) {
  return path ? `${API}/${path}` : null;
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
    const map = {
      races: () => apiGet("races.php").then(setRaces),
      categories: () => apiGet("categories.php").then(setCategories),
      productions: () => apiGet("productions.php").then(setProductions),
      expenses: () => apiGet("expenses.php").then(setExpenses),
      clients: () => apiGet("clients.php").then(setClients),
      orders: () => apiGet("orders.php").then(setOrders),
      deaths: () => apiGet("deaths.php").then(setDeaths),
      vaccinations: () => apiGet("vaccinations.php").then(setVaccinations),
    };
    return map[table]();
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
        setErrorMsg("Impossible de contacter le serveur PHP. Vérifie qu'Apache et MySQL tournent dans XAMPP.");
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
              await apiPost("productions.php", {
                production_date: p.date, quantity: p.quantity, unit_price: p.prixUnitaire,
                race_id: p.raceId || null, photo_path,
              });
              await reload("productions");
            }}
            onDelete={async (id) => { await apiDelete("productions.php", id); await reload("productions"); }}
          />
        )}

        {tab === "sales" && (
          <SalesTab
            clients={clients}
            orders={orders}
            onAddClient={async (c) => { await apiPost("clients.php", c); await reload("clients"); }}
            onAddOrder={async (o) => {
              await apiPost("orders.php", {
                client_id: o.clientId, plateaux: o.plateaux, unit_price: o.prixUnitaire,
                delivery_date: o.dateLivraison, amount_paid: o.montantPaye,
              });
              await reload("orders");
            }}
            onDeleteOrder={async (id) => { await apiDelete("orders.php", id); await reload("orders"); }}
            onDeleteClient={async (id) => { await apiDelete("clients.php", id); await reload("clients"); await reload("orders"); }}
          />
        )}

        {tab === "expenses" && (
          <ExpensesTab
            expenses={expenses}
            categories={categories}
            onAdd={async (e) => {
              const photo_path = e.photo instanceof File ? await uploadPhoto(e.photo) : null;
              await apiPost("expenses.php", {
                category_id: e.categoryId, amount: e.amount, expense_date: e.date, note: e.note, photo_path,
              });
              await reload("expenses");
            }}
            onDelete={async (id) => { await apiDelete("expenses.php", id); await reload("expenses"); }}
            onAddCategory={async (name) => { await apiPost("categories.php", { name }); await reload("categories"); }}
          />
        )}

        {tab === "deaths" && (
          <DeathsTab
            deaths={deaths}
            races={races}
            onAdd={async (d) => {
              const photo_path = d.photo instanceof File ? await uploadPhoto(d.photo) : null;
              await apiPost("deaths.php", {
                death_date: d.date, count: d.count, cause: d.cause, race_id: d.raceId || null, photo_path,
              });
              await reload("deaths");
            }}
            onDelete={async (id) => { await apiDelete("deaths.php", id); await reload("deaths"); }}
          />
        )}

        {tab === "vaccination" && (
          <VaccinationTab
            vaccinations={vaccinations}
            races={races}
            onAdd={async (v) => {
              await apiPost("vaccinations.php", { vaccination_date: v.date, vaccine_name: v.vaccine, race_id: v.raceId || null });
              await reload("vaccinations");
            }}
            onDelete={async (id) => { await apiDelete("vaccinations.php", id); await reload("vaccinations"); }}
          />
        )}

        {tab === "races" && (
          <RacesTab
            races={races}
            onAdd={async (name) => { await apiPost("races.php", { name }); await reload("races"); }}
            onDelete={async (id) => { await apiDelete("races.php", id); await reload("races"); }}
          />
        )}

        {tab === "photos" && (
          <PhotosTab productions={productions} expenses={expenses} deaths={deaths} />
        )}
      </div>
    </div>
  );
}

function ProductionTab({ productions, races, onAdd, onDelete }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState("");
  const [prix, setPrix] = useState("");
  const [raceId, setRaceId] = useState(races[0]?.id || "");
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const totalGeneral = productions.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.unit_price || 0), 0);

  async function submit(e) {
    e.preventDefault();
    if (!quantity) return;
    setSaving(true);
    await onAdd({ date, quantity: Number(quantity), prixUnitaire: Number(prix || 0), raceId, photo });
    setQuantity(""); setPrix(""); setPhoto(null); setSaving(false);
  }

  return (
    <div className="space-y-4">
      <StatCard label="Total général des plateaux récoltés" value={`${fmt(totalGeneral)} F`} sub={`${fmt(productions.reduce((s, p) => s + Number(p.quantity || 0), 0))} plateaux au total`} tone="emerald" />
      <Card>
        <form onSubmit={submit}>
          <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Plateaux récoltés"><input type="number" min="0" className={inputCls} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="ex: 12" /></Field>
          <Field label="Prix par plateau (F)"><input type="number" min="0" className={inputCls} value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="ex: 2500" /></Field>
          <Field label="Race">
            <select className={inputCls} value={raceId} onChange={(e) => setRaceId(e.target.value)}>
              {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Preuve (photo)"><PhotoPicker value={photo} onChange={setPhoto} /></Field>
          <button disabled={saving} className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50">
            <Plus size={16} /> {saving ? "Enregistrement..." : "Enregistrer la récolte"}
          </button>
        </form>
      </Card>
      <div className="space-y-2">
        <div className="text-xs font-medium text-stone-500 px-1">Historique des récoltes</div>
        {productions.length === 0 && <p className="text-sm text-stone-400">Aucune récolte enregistrée pour l'instant.</p>}
        {byDateDesc(productions, "production_date").map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {p.photo_path && <img src={photoUrl(p.photo_path)} className="w-12 h-12 rounded-lg object-cover" alt="" />}
              <div>
                <div className="text-sm font-medium text-stone-800">{p.production_date} · {p.race_name || "—"}</div>
                <div className="text-xs text-stone-500">{fmt(p.quantity)} plateaux × {fmt(p.unit_price)} F = {fmt(p.total_price)} F</div>
              </div>
            </div>
            <button onClick={() => onDelete(p.id)} className="text-stone-300 hover:text-red-600"><Trash2 size={16} /></button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SalesTab({ clients, orders, onAddClient, onAddOrder, onDeleteOrder, onDeleteClient }) {
  const [showClientForm, setShowClientForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [expandedClientId, setExpandedClientId] = useState(null);

  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [plateaux, setPlateaux] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [dateLivraison, setDateLivraison] = useState(new Date().toISOString().slice(0, 10));
  const [montantPaye, setMontantPaye] = useState("");

  useEffect(() => {
    if (!clientId && clients[0]) setClientId(clients[0].id);
  }, [clients]);

  const total = Number(plateaux || 0) * Number(prixUnitaire || 0);
  const reste = total - Number(montantPaye || 0);

  async function submitClient(e) {
    e.preventDefault();
    if (!name) return;
    await onAddClient({ name, phone, location });
    setName(""); setPhone(""); setLocation(""); setShowClientForm(false);
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (!clientId || !plateaux) return;
    await onAddOrder({ clientId, plateaux: Number(plateaux), prixUnitaire: Number(prixUnitaire || 0), dateLivraison, montantPaye: Number(montantPaye || 0) });
    setPlateaux(""); setPrixUnitaire(""); setMontantPaye("");
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">Clients — historique par client</span>
          <button onClick={() => setShowClientForm((v) => !v)} className="text-xs text-emerald-700 flex items-center gap-1">
            <Plus size={14} /> Nouveau client
          </button>
        </div>
        {showClientForm && (
          <form onSubmit={submitClient} className="mb-3 bg-stone-50 rounded-lg p-3">
            <Field label="Nom"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Numéro"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="Localisation"><input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
            <button className="w-full bg-emerald-700 text-white rounded-lg py-2 text-sm">Ajouter le client</button>
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
                  <div className="flex items-center gap-2">
                    {cDue > 0 && <span className="text-xs font-medium text-red-600">Doit {fmt(cDue)} F</span>}
                    <button onClick={(e) => { e.stopPropagation(); onDeleteClient(c.id); }} className="text-stone-300 hover:text-red-600"><Trash2 size={16} /></button>
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
                              <button onClick={() => onDeleteOrder(o.id)} className="text-stone-300 hover:text-red-600"><Trash2 size={14} /></button>
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
        <div className="text-sm font-medium text-stone-700 mb-2">Nouvelle commande</div>
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
            <Plus size={16} /> Enregistrer la commande
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
              <button onClick={() => onDeleteOrder(o.id)} className="text-stone-300 hover:text-red-600"><Trash2 size={16} /></button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ExpensesTab({ expenses, categories, onAdd, onDelete, onAddCategory }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [newCat, setNewCat] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories]);

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  async function submit(e) {
    e.preventDefault();
    if (!amount) return;
    await onAdd({ categoryId, amount: Number(amount), date, note, photo });
    setAmount(""); setNote(""); setPhoto(null);
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
          <Field label="Preuve (photo)"><PhotoPicker value={photo} onChange={setPhoto} /></Field>
          <button className="w-full bg-amber-600 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1">
            <Plus size={16} /> Enregistrer la dépense
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
            <button onClick={() => onDelete(e.id)} className="text-stone-300 hover:text-red-600"><Trash2 size={16} /></button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DeathsTab({ deaths, races, onAdd, onDelete }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [count, setCount] = useState("");
  const [cause, setCause] = useState("");
  const [raceId, setRaceId] = useState(races[0]?.id || "");
  const [photo, setPhoto] = useState(null);

  const total = deaths.reduce((s, d) => s + Number(d.count || 0), 0);

  async function submit(e) {
    e.preventDefault();
    if (!count) return;
    await onAdd({ date, count: Number(count), cause, raceId, photo });
    setCount(""); setCause(""); setPhoto(null);
  }

  return (
    <div className="space-y-4">
      <StatCard label="Total décès enregistrés" value={fmt(total)} tone="red" />
      <Card>
        <form onSubmit={submit}>
          <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Nombre"><input type="number" min="0" className={inputCls} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
          <Field label="Motif"><input className={inputCls} value={cause} onChange={(e) => setCause(e.target.value)} placeholder="ex: maladie, chaleur..." /></Field>
          <Field label="Race">
            <select className={inputCls} value={raceId} onChange={(e) => setRaceId(e.target.value)}>
              {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Preuve (photo)"><PhotoPicker value={photo} onChange={setPhoto} /></Field>
          <button className="w-full bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1">
            <Plus size={16} /> Enregistrer
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
            <button onClick={() => onDelete(d.id)} className="text-stone-300 hover:text-red-600"><Trash2 size={16} /></button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VaccinationTab({ vaccinations, races, onAdd, onDelete }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vaccine, setVaccine] = useState("");
  const [raceId, setRaceId] = useState(races[0]?.id || "");

  async function submit(e) {
    e.preventDefault();
    if (!vaccine) return;
    await onAdd({ date, vaccine, raceId });
    setVaccine("");
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={submit}>
          <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Vaccin"><input className={inputCls} value={vaccine} onChange={(e) => setVaccine(e.target.value)} placeholder="ex: Newcastle" /></Field>
          <Field label="Race">
            <select className={inputCls} value={raceId} onChange={(e) => setRaceId(e.target.value)}>
              {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <button className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1">
            <Plus size={16} /> Enregistrer la vaccination
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
            <button onClick={() => onDelete(v.id)} className="text-stone-300 hover:text-red-600"><Trash2 size={16} /></button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RacesTab({ races, onAdd, onDelete }) {
  const [name, setName] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!name) return;
    await onAdd(name);
    setName("");
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
            <div className="flex items-center gap-2 text-sm font-medium text-stone-800"><Bird size={16} className="text-emerald-700" /> {r.name}</div>
            <button onClick={() => onDelete(r.id)} className="text-stone-300 hover:text-red-600"><Trash2 size={16} /></button>
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
