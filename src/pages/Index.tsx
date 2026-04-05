import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "doctor" | "nurse";
type Theme = "light" | "dark";
type Section = "patients" | "treatments" | "reports" | "notifications" | "profile" | "archive";

interface User {
  id: string;
  name: string;
  role: Role;
  position: string;
  login: string;
  password?: string;
}

interface Treatment {
  id: string;
  name: string;
  description: string;
  doctorId: string;
  doctorName: string;
  time: string;
  date: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  nurseComment?: string;
}

interface Patient {
  id: string;
  lastName: string;
  firstName: string;
  ward: string;
  diagnosis: string;
  doctorId: string;
  doctorName: string;
  admittedAt: string;
  treatments: Treatment[];
  archived: boolean;
  archivedAt?: string;
}

interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_USERS: User[] = [
  { id: "d1", name: "Иванов Дмитрий Сергеевич", role: "doctor", position: "Терапевт", login: "doctor" },
  { id: "n1", name: "Смирнова Анна Павловна", role: "nurse", position: "Медсестра", login: "nurse" },
];

const INITIAL_PATIENTS: Patient[] = [
  {
    id: "p1",
    lastName: "Петров",
    firstName: "Алексей",
    ward: "205",
    diagnosis: "Пневмония",
    doctorId: "d1",
    doctorName: "Иванов Д.С.",
    admittedAt: "2026-04-01",
    archived: false,
    treatments: [
      {
        id: "t1", name: "Антибиотикотерапия", description: "Амоксициллин 500мг 3р/д",
        doctorId: "d1", doctorName: "Иванов Д.С.", time: "08:00", date: "2026-04-04",
        completed: true, completedBy: "Смирнова А.П.", completedAt: "04.04.2026, 08:15",
        nurseComment: "Препарат принят, реакций нет"
      },
      {
        id: "t2", name: "Ингаляция", description: "Физраствор 4мл через небулайзер",
        doctorId: "d1", doctorName: "Иванов Д.С.", time: "10:00", date: "2026-04-04",
        completed: false
      },
    ]
  },
  {
    id: "p2",
    lastName: "Козлова",
    firstName: "Мария",
    ward: "108",
    diagnosis: "Гипертония II ст.",
    doctorId: "d1",
    doctorName: "Иванов Д.С.",
    admittedAt: "2026-04-02",
    archived: false,
    treatments: [
      {
        id: "t3", name: "Измерение АД", description: "Каждые 3 часа, фиксировать показатели",
        doctorId: "d1", doctorName: "Иванов Д.С.", time: "07:00", date: "2026-04-04",
        completed: false
      },
    ]
  },
  {
    id: "p3",
    lastName: "Сидоров",
    firstName: "Виктор",
    ward: "312",
    diagnosis: "Диабет II типа",
    doctorId: "d1",
    doctorName: "Иванов Д.С.",
    admittedAt: "2026-03-20",
    archived: true,
    archivedAt: "01.04.2026",
    treatments: []
  },
];

const INITIAL_NOTIFS: Notification[] = [
  { id: "n1", text: "Смирнова А.П. выполнила назначение для Петрова А.", time: "08:15", read: false, type: "success" },
  { id: "n2", text: "Назначение для Козловой М. не выполнено в срок", time: "07:30", read: false, type: "warning" },
  { id: "n3", text: "Добавлен новый пациент: Петров Алексей", time: "вчера", read: true, type: "info" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2, 10);
const nowStr = () => new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Auth Screen ──────────────────────────────────────────────────────────────

const registeredUsers: User[] = INITIAL_USERS.map(u => ({ ...u, password: "1234" }));

function AuthScreen({ onLogin, onRegister }: { onLogin: (u: User) => void; onRegister: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState<Role>("nurse");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // recover state
  const [recoverLogin, setRecoverLogin] = useState("");
  const [recoverName, setRecoverName] = useState("");
  const [recoverStep, setRecoverStep] = useState<1 | 2>(1);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const switchMode = (m: typeof mode) => { setMode(m); setError(""); setSuccess(""); setRecoverStep(1); setRecoverLogin(""); setRecoverName(""); setNewPassword(""); setNewPassword2(""); setName(""); setLogin(""); setPassword(""); setPosition(""); setRole("nurse"); };

  const handleLogin = () => {
    const user = registeredUsers.find(u => u.login === login);
    if (!user) { setError("Пользователь не найден"); return; }
    const pwd = user.password ?? "1234";
    if (password !== pwd) { setError("Неверный пароль"); return; }
    onLogin(user);
  };

  const handleRegister = () => {
    if (!name.trim() || !login.trim() || !password.trim()) { setError("Заполните все поля"); return; }
    if (registeredUsers.find(u => u.login === login)) { setError("Логин уже занят"); return; }
    const defaultPosition = role === "doctor" ? "Врач" : "Медсестра";
    const newUser: User = { id: genId(), name, role, position: position || defaultPosition, login, password };
    registeredUsers.push(newUser);
    setError("");
    switchMode("login");
    setLogin(newUser.login);
    setPassword(password);
    onRegister(newUser);
  };

  const handleRecoverCheck = () => {
    const user = registeredUsers.find(u => u.login === recoverLogin);
    if (!user) { setError("Пользователь с таким логином не найден"); return; }
    const normInput = recoverName.trim().toLowerCase();
    const normStored = user.name.trim().toLowerCase();
    if (!normStored.includes(normInput) || normInput.length < 3) {
      setError("ФИО не совпадает с данными при регистрации"); return;
    }
    setError("");
    setRecoverStep(2);
  };

  const handleRecoverSave = () => {
    if (newPassword.length < 4) { setError("Пароль должен содержать не менее 4 символов"); return; }
    if (newPassword !== newPassword2) { setError("Пароли не совпадают"); return; }
    const idx = registeredUsers.findIndex(u => u.login === recoverLogin);
    if (idx === -1) return;
    registeredUsers[idx] = { ...registeredUsers[idx], password: newPassword };
    setError("");
    setSuccess("Пароль успешно изменён! Теперь вы можете войти.");
    setRecoverStep(1);
    setRecoverLogin("");
    setRecoverName("");
    setNewPassword("");
    setNewPassword2("");
    setTimeout(() => switchMode("login"), 1800);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(199 89% 40%), transparent)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(170 70% 42%), transparent)" }} />

      <div className="w-full max-w-md px-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg">
            <Icon name="Cross" size={32} className="text-white" fallback="Plus" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">МедИС</h1>
          <p className="text-muted-foreground text-sm mt-1">Медицинская информационная система</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs — скрываем при восстановлении */}
          {mode !== "recover" ? (
            <div className="flex border-b border-border">
              <button onClick={() => switchMode("login")}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === "login" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
                Войти
              </button>
              <button onClick={() => switchMode("register")}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === "register" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
                Регистрация
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <button onClick={() => switchMode("login")} className="text-muted-foreground hover:text-foreground transition">
                <Icon name="ArrowLeft" size={18} />
              </button>
              <span className="font-semibold text-foreground">Восстановление доступа</span>
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* ── Login ── */}
            {mode === "login" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Логин</label>
                  <input value={login} onChange={e => setLogin(e.target.value)} placeholder="doctor / nurse" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Пароль</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="1234"
                    onKeyDown={e => e.key === "Enter" && handleLogin()} className={inputCls} />
                </div>
                {error && <ErrorMsg text={error} />}
                <button onClick={handleLogin}
                  className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-95">
                  Войти в систему
                </button>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Тест: <span className="font-mono text-foreground">doctor</span> / <span className="font-mono text-foreground">nurse</span> · <span className="font-mono text-foreground">1234</span>
                  </p>
                  <button onClick={() => switchMode("recover")}
                    className="text-xs text-primary hover:opacity-70 transition font-semibold">
                    Забыли пароль?
                  </button>
                </div>
              </>
            )}

            {/* ── Register ── */}
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Роль</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setRole("nurse")}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${role === "nurse" ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:border-primary/50"}`}>
                      Медсестра / Медбрат
                    </button>
                    <button type="button" onClick={() => setRole("doctor")}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${role === "doctor" ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:border-primary/50"}`}>
                      Врач
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">ФИО</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Иванова Мария Сергеевна" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Должность</label>
                  <input value={position} onChange={e => setPosition(e.target.value)}
                    placeholder={role === "doctor" ? "Терапевт / Хирург / Кардиолог" : "Медсестра / Медбрат"} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Логин</label>
                  <input value={login} onChange={e => setLogin(e.target.value)} placeholder="придумайте логин" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Пароль</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="придумайте пароль"
                    onKeyDown={e => e.key === "Enter" && handleRegister()} className={inputCls} />
                </div>
                {error && <ErrorMsg text={error} />}
                <button onClick={handleRegister}
                  className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-95">
                  Зарегистрироваться
                </button>
              </>
            )}

            {/* ── Recover ── */}
            {mode === "recover" && (
              <>
                {success ? (
                  <div className="flex items-center gap-2 text-accent text-sm bg-accent/10 px-3 py-3 rounded-lg animate-fade-in">
                    <Icon name="CheckCircle" size={16} />
                    {success}
                  </div>
                ) : recoverStep === 1 ? (
                  <>
                    <p className="text-sm text-muted-foreground">Введите ваш логин и ФИО, указанные при регистрации — мы позволим задать новый пароль.</p>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Логин</label>
                      <input value={recoverLogin} onChange={e => setRecoverLogin(e.target.value)} placeholder="ваш логин" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">ФИО (полностью или частично)</label>
                      <input value={recoverName} onChange={e => setRecoverName(e.target.value)} placeholder="Иванова Мария"
                        onKeyDown={e => e.key === "Enter" && handleRecoverCheck()} className={inputCls} />
                    </div>
                    {error && <ErrorMsg text={error} />}
                    <button onClick={handleRecoverCheck}
                      className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-95">
                      Проверить данные
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm bg-accent/10 text-accent px-3 py-2 rounded-lg">
                      <Icon name="CheckCircle" size={15} />
                      Личность подтверждена. Задайте новый пароль.
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Новый пароль</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="минимум 4 символа" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Повторите пароль</label>
                      <input type="password" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} placeholder="повторите пароль"
                        onKeyDown={e => e.key === "Enter" && handleRecoverSave()} className={inputCls} />
                    </div>
                    {error && <ErrorMsg text={error} />}
                    <button onClick={handleRecoverSave}
                      className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-95">
                      Сохранить новый пароль
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg animate-fade-in">
      <Icon name="AlertCircle" size={16} />
      {text}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Section; label: string; icon: string; fallback: string }[] = [
  { id: "patients", label: "Пациенты", icon: "Users", fallback: "Users" },
  { id: "treatments", label: "Лечения", icon: "Pill", fallback: "Activity" },
  { id: "reports", label: "Отчёты", icon: "BarChart2", fallback: "BarChart2" },
  { id: "notifications", label: "Уведомления", icon: "Bell", fallback: "Bell" },
  { id: "archive", label: "Архив", icon: "Archive", fallback: "Archive" },
  { id: "profile", label: "Профиль", icon: "UserCircle", fallback: "UserCircle" },
];

function Sidebar({ user, active, onNav, onLogout, unread, collapsed, onToggle }:
  { user: User; active: Section; onNav: (s: Section) => void; onLogout: () => void; unread: number; collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`sidebar-gradient flex flex-col border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-16" : "w-60"} h-screen sticky top-0 z-30 flex-shrink-0`}>
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow">
          <Icon name="Plus" size={18} className="text-white" />
        </div>
        {!collapsed && <span className="font-display font-bold text-white text-lg leading-none">МедИС</span>}
        {!collapsed && (
          <button onClick={onToggle} className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground transition">
            <Icon name="PanelLeft" size={18} fallback="ChevronLeft" />
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={onToggle} className="py-2 flex justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition">
          <Icon name="PanelRight" size={16} fallback="ChevronRight" />
        </button>
      )}

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
                ${isActive ? "bg-sidebar-primary/20 text-sidebar-primary shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}
                ${collapsed ? "justify-center" : ""}`}>
              <Icon name={item.icon} size={18} fallback={item.fallback} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {item.id === "notifications" && unread > 0 && (
                <span className={`flex-shrink-0 text-xs bg-destructive text-white rounded-full font-semibold ${collapsed ? "absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center" : "ml-auto px-1.5 py-0.5"}`}>
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-sidebar-border p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <button onClick={onLogout} className="w-9 h-9 rounded-xl bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60 hover:text-destructive transition">
            <Icon name="LogOut" size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary font-bold text-sm">{user.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name.split(" ")[0]} {user.name.split(" ")[1]?.[0]}.</p>
              <p className="text-sidebar-foreground/50 text-xs truncate">{user.role === "doctor" ? "Врач" : "Медсестра"}</p>
            </div>
            <button onClick={onLogout} className="text-sidebar-foreground/40 hover:text-destructive transition p-1">
              <Icon name="LogOut" size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({ title, subtitle, theme, onTheme, actions }:
  { title: string; subtitle?: string; theme: Theme; onTheme: () => void; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20">
      <div>
        <h1 className="font-display font-bold text-xl text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button onClick={onTheme}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <Icon name={theme === "dark" ? "Sun" : "Moon"} size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Bdg({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
}

// ─── Patients Section ─────────────────────────────────────────────────────────

function PatientsSection({ user, patients, setPatients, theme, onTheme }:
  { user: User; patients: Patient[]; setPatients: (p: Patient[]) => void; theme: Theme; onTheme: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ lastName: "", firstName: "", ward: "", diagnosis: "" });

  const active = patients.filter(p => !p.archived);
  const filtered = active.filter(p =>
    `${p.lastName} ${p.firstName} ${p.ward} ${p.diagnosis}`.toLowerCase().includes(search.toLowerCase())
  );

  const addPatient = () => {
    if (!form.lastName || !form.firstName || !form.ward) return;
    const np: Patient = {
      id: genId(), ...form,
      doctorId: user.id,
      doctorName: `${user.name.split(" ")[0][0]}. ${user.name.split(" ")[1] || ""}`,
      admittedAt: todayStr(), archived: false, treatments: []
    };
    setPatients([...patients, np]);
    setForm({ lastName: "", firstName: "", ward: "", diagnosis: "" });
    setShowAdd(false);
  };

  const archivePatient = (id: string) => {
    setPatients(patients.map(p => p.id === id ? { ...p, archived: true, archivedAt: nowStr() } : p));
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Пациенты" subtitle={`${filtered.length} активных`} theme={theme} onTheme={onTheme} actions={
        user.role === "doctor" ? (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition shadow-sm">
            <Icon name="UserPlus" size={16} />
            Добавить
          </button>
        ) : undefined
      } />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="relative mb-5">
          <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени, диагнозу, палате..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="Users" size={40} className="mx-auto mb-3 opacity-30" />
            <p>Пациентов не найдено</p>
          </div>
        )}

        <div className="grid gap-3">
          {filtered.map((p, i) => {
            const done = p.treatments.filter(t => t.completed).length;
            const total = p.treatments.length;
            const isOpen = selectedId === p.id;
            return (
              <div key={p.id}
                onClick={() => setSelectedId(isOpen ? null : p.id)}
                className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover-scale transition-all animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">{p.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{p.lastName} {p.firstName}</p>
                      <p className="text-sm text-muted-foreground">{p.diagnosis}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <Bdg color="bg-secondary text-secondary-foreground">
                      <Icon name="Home" size={11} />
                      Пал. {p.ward}
                    </Bdg>
                    {total > 0 && (
                      <Bdg color={done === total ? "bg-accent/15 text-accent" : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"}>
                        {done}/{total}
                      </Bdg>
                    )}
                    <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={14} className="text-muted-foreground" />
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div><span className="text-muted-foreground">Врач:</span> <span className="font-semibold">{p.doctorName}</span></div>
                      <div><span className="text-muted-foreground">Поступил:</span> <span className="font-semibold">{p.admittedAt}</span></div>
                    </div>
                    {p.treatments.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Назначений нет</p>
                    ) : (
                      <div className="space-y-2">
                        {p.treatments.map(t => (
                          <div key={t.id} className={`flex items-start gap-3 p-3 rounded-xl text-sm border ${t.completed ? "border-accent/30 bg-accent/5" : "border-border bg-secondary/30"}`}>
                            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${t.completed ? "bg-accent text-white" : "border-2 border-border"}`}>
                              {t.completed && <Icon name="Check" size={12} />}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{t.name}</p>
                              <p className="text-muted-foreground">{t.description}</p>
                              {t.completed && <p className="text-xs text-accent mt-1">✓ {t.completedBy} · {t.completedAt}</p>}
                              {t.nurseComment && <p className="text-xs text-foreground/70 mt-1 italic">💬 {t.nurseComment}</p>}
                            </div>
                            <span className="text-muted-foreground text-xs">{t.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {user.role === "doctor" && (
                      <button onClick={() => archivePatient(p.id)}
                        className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition">
                        <Icon name="Archive" size={13} />
                        Выписать и архивировать
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display font-bold text-lg">Новый пациент</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground transition">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Фамилия *", key: "lastName", ph: "Петров" },
                { label: "Имя *", key: "firstName", ph: "Алексей" },
                { label: "Номер палаты *", key: "ward", ph: "205" },
                { label: "Диагноз", key: "diagnosis", ph: "Пневмония" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{f.label}</label>
                  <input value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
                </div>
              ))}
              <button onClick={addPatient}
                className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition">
                Добавить пациента
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Treatments Section ───────────────────────────────────────────────────────

function TreatmentsSection({ user, patients, setPatients, theme, onTheme }:
  { user: User; patients: Patient[]; setPatients: (p: Patient[]) => void; theme: Theme; onTheme: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selPatientId, setSelPatientId] = useState("");
  const [form, setForm] = useState({ name: "", description: "", time: "08:00", date: todayStr() });
  const [commentModal, setCommentModal] = useState<{ patientId: string; treatmentId: string } | null>(null);
  const [comment, setComment] = useState("");

  const active = patients.filter(p => !p.archived);
  const allTreatments = active.flatMap(p => p.treatments.map(t => ({
    ...t, patientLastName: p.lastName, patientFirstName: p.firstName, patientWard: p.ward, patientId: p.id
  })));

  const addTreatment = () => {
    if (!selPatientId || !form.name) return;
    const t: Treatment = {
      id: genId(), ...form, doctorId: user.id,
      doctorName: `${user.name.split(" ")[0]} ${user.name.split(" ")[1]?.[0] || ""}.`,
      completed: false
    };
    setPatients(patients.map(p => p.id === selPatientId ? { ...p, treatments: [...p.treatments, t] } : p));
    setForm({ name: "", description: "", time: "08:00", date: todayStr() });
    setShowAdd(false);
  };

  const toggleComplete = (patientId: string, treatmentId: string) => {
    if (user.role !== "nurse") return;
    setPatients(patients.map(p => p.id === patientId ? {
      ...p, treatments: p.treatments.map(t => t.id === treatmentId ? {
        ...t, completed: !t.completed,
        completedBy: !t.completed ? user.name : undefined,
        completedAt: !t.completed ? nowStr() : undefined
      } : t)
    } : p));
  };

  const saveComment = () => {
    if (!commentModal) return;
    setPatients(patients.map(p => p.id === commentModal.patientId ? {
      ...p, treatments: p.treatments.map(t => t.id === commentModal.treatmentId ? { ...t, nurseComment: comment } : t)
    } : p));
    setCommentModal(null);
    setComment("");
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Лечения" subtitle={`${allTreatments.filter(t => !t.completed).length} ожидает выполнения`} theme={theme} onTheme={onTheme} actions={
        user.role === "doctor" ? (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition shadow-sm">
            <Icon name="Plus" size={16} />
            Назначение
          </button>
        ) : undefined
      } />

      <div className="flex-1 p-6 overflow-y-auto">
        {allTreatments.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="Pill" size={40} className="mx-auto mb-3 opacity-30" fallback="Activity" />
            <p>Назначений нет</p>
          </div>
        )}

        <div className="space-y-3">
          {allTreatments.map((t, i) => (
            <div key={t.id} className={`bg-card border rounded-2xl p-4 animate-fade-in transition-all ${t.completed ? "border-accent/30" : "border-border"}`}
              style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-start gap-4">
                {user.role === "nurse" ? (
                  <button onClick={() => toggleComplete(t.patientId, t.id)}
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${t.completed ? "bg-accent border-accent text-white" : "border-border hover:border-primary"}`}>
                    {t.completed && <Icon name="Check" size={14} />}
                  </button>
                ) : (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${t.completed ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                    {t.completed ? <Icon name="Check" size={14} /> : <Icon name="Clock" size={14} />}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className={`font-semibold ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <Bdg color="bg-secondary text-secondary-foreground">
                        <Icon name="User" size={11} />
                        {t.patientLastName} {t.patientFirstName[0]}.
                      </Bdg>
                      <Bdg color="bg-secondary text-secondary-foreground">
                        <Icon name="Home" size={11} />
                        {t.patientWard}
                      </Bdg>
                      <Bdg color="bg-secondary text-secondary-foreground">
                        <Icon name="Clock" size={11} />
                        {t.time}
                      </Bdg>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Врач: {t.doctorName}</span>
                    {t.completed && <span className="text-xs text-accent">✓ {t.completedBy} · {t.completedAt}</span>}
                  </div>

                  {t.nurseComment && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-foreground/70 bg-secondary/50 px-3 py-2 rounded-lg">
                      <Icon name="MessageSquare" size={12} className="mt-0.5 flex-shrink-0" />
                      {t.nurseComment}
                    </div>
                  )}

                  {user.role === "nurse" && (
                    <button onClick={() => { setCommentModal({ patientId: t.patientId, treatmentId: t.id }); setComment(t.nurseComment || ""); }}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition">
                      <Icon name="MessageSquare" size={12} />
                      {t.nurseComment ? "Изменить комментарий" : "Добавить комментарий"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display font-bold text-lg">Новое назначение</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground transition"><Icon name="X" size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Пациент *</label>
                <select value={selPatientId} onChange={e => setSelPatientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition">
                  <option value="">Выберите пациента</option>
                  {active.map(p => (
                    <option key={p.id} value={p.id}>{p.lastName} {p.firstName} — пал. {p.ward}</option>
                  ))}
                </select>
              </div>
              {[
                { label: "Назначение *", key: "name", ph: "Антибиотикотерапия" },
                { label: "Описание", key: "description", ph: "Амоксициллин 500мг 3р/д" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{f.label}</label>
                  <input value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Время</label>
                  <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Дата</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
                </div>
              </div>
              <button onClick={addTreatment}
                className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition">
                Добавить назначение
              </button>
            </div>
          </div>
        </div>
      )}

      {commentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display font-bold text-lg">Комментарий</h3>
              <button onClick={() => setCommentModal(null)} className="text-muted-foreground hover:text-foreground transition"><Icon name="X" size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
                placeholder="Опишите выполнение или наблюдения..."
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
              <button onClick={saveComment}
                className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nurse Table Section ──────────────────────────────────────────────────────

function NurseTableSection({ user, patients, setPatients, theme, onTheme }:
  { user: User; patients: Patient[]; setPatients: (p: Patient[]) => void; theme: Theme; onTheme: () => void }) {
  const [commentModal, setCommentModal] = useState<{ patientId: string; treatmentId: string } | null>(null);
  const [comment, setComment] = useState("");

  const rows = patients.filter(p => !p.archived).flatMap(p =>
    p.treatments.map(t => ({ patient: p, treatment: t }))
  );

  const toggleComplete = (patientId: string, treatmentId: string) => {
    setPatients(patients.map(p => p.id === patientId ? {
      ...p, treatments: p.treatments.map(t => t.id === treatmentId ? {
        ...t, completed: !t.completed,
        completedBy: !t.completed ? user.name : undefined,
        completedAt: !t.completed ? nowStr() : undefined
      } : t)
    } : p));
  };

  const saveComment = () => {
    if (!commentModal) return;
    setPatients(patients.map(p => p.id === commentModal.patientId ? {
      ...p, treatments: p.treatments.map(t => t.id === commentModal.treatmentId ? { ...t, nurseComment: comment } : t)
    } : p));
    setCommentModal(null);
    setComment("");
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Мои задания" subtitle={`${rows.filter(r => !r.treatment.completed).length} ожидает выполнения`} theme={theme} onTheme={onTheme} />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {["ФИ пациента", "Палата", "Назначение", "ФИО врача", "Комментарий", "Выполнено"].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider ${h === "Выполнено" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Назначений нет</td></tr>
                )}
                {rows.map(({ patient: p, treatment: t }, i) => (
                  <tr key={t.id} className={`border-b border-border/50 transition-colors hover:bg-secondary/30 animate-fade-in ${t.completed ? "opacity-60" : ""}`}
                    style={{ animationDelay: `${i * 0.04}s` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{p.lastName[0]}</span>
                        </div>
                        <span className="font-semibold">{p.lastName} {p.firstName[0]}.</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Bdg color="bg-secondary text-secondary-foreground">{p.ward}</Bdg>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Icon name="Clock" size={10} className="inline mr-1" />{t.time} · {t.date}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.doctorName}</td>
                    <td className="px-4 py-3">
                      {t.nurseComment ? (
                        <div className="flex items-start gap-1.5">
                          <p className="text-xs text-foreground/80 max-w-40 truncate">{t.nurseComment}</p>
                          <button onClick={() => { setCommentModal({ patientId: p.id, treatmentId: t.id }); setComment(t.nurseComment || ""); }}
                            className="text-primary hover:opacity-70 transition flex-shrink-0">
                            <Icon name="Pencil" size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setCommentModal({ patientId: p.id, treatmentId: t.id }); setComment(""); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition">
                          <Icon name="Plus" size={12} />
                          Добавить
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => toggleComplete(p.id, t.id)}
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mx-auto ${t.completed ? "bg-accent border-accent text-white" : "border-border hover:border-accent"}`}>
                          {t.completed && <Icon name="Check" size={14} />}
                        </button>
                        {t.completed && (
                          <p className="text-xs text-accent text-center leading-none">{t.completedAt?.split(",")[0]}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {commentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display font-bold text-lg">Комментарий</h3>
              <button onClick={() => setCommentModal(null)} className="text-muted-foreground hover:text-foreground transition"><Icon name="X" size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
                placeholder="Опишите выполнение или наблюдения..."
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
              <button onClick={saveComment}
                className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports Section ──────────────────────────────────────────────────────────

function ReportsSection({ patients, theme, onTheme }: { patients: Patient[]; theme: Theme; onTheme: () => void }) {
  const active = patients.filter(p => !p.archived);
  const archived = patients.filter(p => p.archived);
  const allT = active.flatMap(p => p.treatments);
  const completed = allT.filter(t => t.completed).length;
  const pending = allT.filter(t => !t.completed).length;

  const stats = [
    { label: "Активных пациентов", value: active.length, icon: "Users", color: "text-primary bg-primary/10" },
    { label: "Выписано пациентов", value: archived.length, icon: "Archive", color: "text-accent bg-accent/10" },
    { label: "Выполнено назначений", value: completed, icon: "CheckCircle", color: "text-green-600 bg-green-100 dark:bg-green-900/20" },
    { label: "Ожидают выполнения", value: pending, icon: "Clock", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20" },
  ];

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Отчёты" subtitle="Сводная статистика" theme={theme} onTheme={onTheme} />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 hover-scale animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <Icon name={s.icon} size={20} fallback="Activity" />
              </div>
              <p className="text-3xl font-display font-black text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h3 className="font-display font-bold mb-4">По палатам</h3>
          {active.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет активных пациентов</p>
          ) : (
            <div className="space-y-3">
              {active.map(p => {
                const done = p.treatments.filter(t => t.completed).length;
                const total = p.treatments.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Пал. {p.ward}</span>
                    <span className="text-sm font-medium w-32 flex-shrink-0 truncate">{p.lastName} {p.firstName[0]}.</span>
                    <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-14 text-right flex-shrink-0">{done}/{total}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────

function NotificationsSection({ notifs, setNotifs, theme, onTheme }:
  { notifs: Notification[]; setNotifs: (n: Notification[]) => void; theme: Theme; onTheme: () => void }) {
  const unread = notifs.filter(n => !n.read).length;
  const markAll = () => setNotifs(notifs.map(n => ({ ...n, read: true })));

  const typeColors: Record<string, string> = {
    success: "border-accent/30 bg-accent/5",
    warning: "border-amber-400/30 bg-amber-50 dark:bg-amber-900/10",
    info: "border-primary/30 bg-primary/5",
  };
  const typeIcons: Record<string, string> = { success: "CheckCircle", warning: "AlertTriangle", info: "Info" };
  const typeIconColors: Record<string, string> = { success: "text-accent", warning: "text-amber-500", info: "text-primary" };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Уведомления" subtitle={unread > 0 ? `${unread} непрочитанных` : "Всё прочитано"} theme={theme} onTheme={onTheme} actions={
        unread > 0 ? (
          <button onClick={markAll} className="text-xs text-primary hover:opacity-70 transition font-semibold">
            Прочитать все
          </button>
        ) : undefined
      } />
      <div className="flex-1 p-6 overflow-y-auto">
        {notifs.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="Bell" size={40} className="mx-auto mb-3 opacity-30" />
            <p>Уведомлений нет</p>
          </div>
        )}
        <div className="space-y-3">
          {notifs.map((n, i) => (
            <div key={n.id} onClick={() => setNotifs(notifs.map(x => x.id === n.id ? { ...x, read: true } : x))}
              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover-scale animate-fade-in ${typeColors[n.type]} ${!n.read ? "shadow-sm" : "opacity-70"}`}
              style={{ animationDelay: `${i * 0.06}s` }}>
              <Icon name={typeIcons[n.type]} size={18} className={`mt-0.5 flex-shrink-0 ${typeIconColors[n.type]}`} fallback="Bell" />
              <div className="flex-1">
                <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{n.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Archive Section ──────────────────────────────────────────────────────────

function ArchiveSection({ patients, theme, onTheme }: { patients: Patient[]; theme: Theme; onTheme: () => void }) {
  const archived = patients.filter(p => p.archived);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Архив" subtitle={`${archived.length} выписанных пациентов`} theme={theme} onTheme={onTheme} />
      <div className="flex-1 p-6 overflow-y-auto">
        {archived.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="Archive" size={40} className="mx-auto mb-3 opacity-30" />
            <p>Архив пуст</p>
          </div>
        )}
        <div className="space-y-3">
          {archived.map((p, i) => {
            const done = p.treatments.filter(t => t.completed).length;
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition"
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground font-bold text-sm">{p.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{p.lastName} {p.firstName}</p>
                      <p className="text-sm text-muted-foreground">{p.diagnosis} · Пал. {p.ward}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bdg color="bg-muted text-muted-foreground">Выписан {p.archivedAt || p.admittedAt}</Bdg>
                    <Icon name={expanded === p.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
                  </div>
                </div>
                {expanded === p.id && (
                  <div className="border-t border-border p-4 bg-secondary/20 animate-fade-in">
                    <p className="text-sm text-muted-foreground mb-3">Всего назначений: {p.treatments.length} · Выполнено: {done}</p>
                    {p.treatments.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Назначений не было</p>
                    ) : (
                      <div className="space-y-2">
                        {p.treatments.map(t => (
                          <div key={t.id} className={`flex items-center gap-3 text-sm p-2.5 rounded-xl ${t.completed ? "bg-accent/10" : "bg-muted/50"}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${t.completed ? "bg-accent text-white" : "border border-border"}`}>
                              {t.completed && <Icon name="Check" size={10} />}
                            </div>
                            <span className="flex-1">{t.name}</span>
                            {t.completedBy && <span className="text-xs text-muted-foreground">{t.completedBy}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection({ user, theme, onTheme }: { user: User; theme: Theme; onTheme: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Профиль" theme={theme} onTheme={onTheme} />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-6 mb-4 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">{user.name[0]}</span>
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">{user.name}</h2>
                <Bdg color={user.role === "doctor" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}>
                  {user.role === "doctor" ? "Врач" : "Медсестра / Медбрат"}
                </Bdg>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Должность", value: user.position },
                { label: "Логин", value: user.login, mono: true },
                { label: "Роль", value: user.role === "doctor" ? "Лечащий врач" : "Средний медперсонал" },
                { label: "ID", value: user.id, mono: true },
              ].map(f => (
                <div key={f.label} className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-muted-foreground text-xs mb-1">{f.label}</p>
                  <p className={`font-semibold ${f.mono ? "font-mono text-xs" : ""}`}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h3 className="font-semibold mb-3">Права доступа</h3>
            {(user.role === "doctor" ? [
              "Добавление и выписка пациентов",
              "Создание назначений",
              "Просмотр действий медперсонала",
              "Доступ к отчётам",
            ] : [
              "Просмотр назначений",
              "Отметка о выполнении",
              "Добавление комментариев",
              "Просмотр своих пациентов",
            ]).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1.5">
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="Check" size={11} className="text-accent" />
                </div>
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("patients");
  const [theme, setTheme] = useState<Theme>("light");
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const handleSetPatients = (newPatients: Patient[]) => {
    if (user?.role === "nurse") {
      patients.forEach(p => {
        const newP = newPatients.find(np => np.id === p.id);
        if (!newP) return;
        p.treatments.forEach(t => {
          const newT = newP.treatments.find(nt => nt.id === t.id);
          if (newT && !t.completed && newT.completed) {
            setNotifs(prev => [{
              id: genId(),
              text: `${user.name} выполнила назначение "${t.name}" для ${p.lastName} ${p.firstName[0]}.`,
              time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
              read: false,
              type: "success"
            }, ...prev]);
          }
        });
      });
    }
    setPatients(newPatients);
  };

  if (!user) {
    return <AuthScreen onLogin={setUser} onRegister={(u) => { setUser(u); setSection("patients"); }} />;
  }

  const unread = notifs.filter(n => !n.read).length;
  const isNursePatients = user.role === "nurse" && section === "patients";

  const sectionProps = { theme, onTheme: toggleTheme };

  const renderSection = () => {
    if (isNursePatients) {
      return <NurseTableSection user={user} patients={patients} setPatients={handleSetPatients} {...sectionProps} />;
    }
    switch (section) {
      case "patients":
        return <PatientsSection user={user} patients={patients} setPatients={handleSetPatients} {...sectionProps} />;
      case "treatments":
        return <TreatmentsSection user={user} patients={patients} setPatients={handleSetPatients} {...sectionProps} />;
      case "reports":
        return <ReportsSection patients={patients} {...sectionProps} />;
      case "notifications":
        return <NotificationsSection notifs={notifs} setNotifs={setNotifs} {...sectionProps} />;
      case "archive":
        return <ArchiveSection patients={patients} {...sectionProps} />;
      case "profile":
        return <ProfileSection user={user} {...sectionProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={user}
        active={section}
        onNav={setSection}
        onLogout={() => setUser(null)}
        unread={unread}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <main className="flex-1 overflow-hidden flex flex-col animate-fade-in">
        {renderSection()}
      </main>
    </div>
  );
}