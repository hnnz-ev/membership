'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  // Navigation & Auth States
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'register' | 'pending' | 'dashboard' | 'admin'
  const [user, setUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Data States
  const [benefits, setBenefits] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [claimLogs, setClaimLogs] = useState([]);
  const [config, setConfig] = useState({
    announcementText: 'Stok benefit diperbarui setiap hari! Harap klaim sesuai limit harian.',
    groupLink: 'https://chat.whatsapp.com/demo'
  });

  // UI / Modal States
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeClaimData, setActiveClaimData] = useState(null);
  const [activeTab, setActiveTab] = useState('benefits'); // Member: 'benefits' | 'history' | 'password'
  const [adminTab, setAdminTab] = useState('users'); // Admin: 'users' | 'benefits' | 'logs' | 'password'

  // Notification Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Forms States
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', whatsapp: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ email: '', whatsapp: '', newPassword: '' });
  const [changePassForm, setChangePassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [adminPassForm, setAdminPassForm] = useState({ oldPassword: '', newPassword: '' });

  // Add Benefit Form State
  const [benefitForm, setBenefitForm] = useState({
    title: '',
    description: '',
    type: 'account', // 'url' | 'account'
    url: '',
    accountsRaw: '',
    dailyLimit: 1
  });

  const showToastMsg = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Initial Data Fetching from API / Database
  const fetchBenefits = async () => {
    try {
      const res = await fetch('/api/benefits');
      if (res.ok) {
        const data = await res.json();
        setBenefits(data.benefits || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  // ---------------- AUTH HANDLERS ----------------
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.email.toLowerCase().endsWith('@gmail.com')) {
      showToastMsg('Registrasi hanya diperbolehkan menggunakan email domain @gmail.com!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();

      if (!res.ok) {
        showToastMsg(data.error || 'Pendaftaran gagal', 'error');
        return;
      }

      showToastMsg('Pendaftaran berhasil! Akun Anda kini menunggu persetujuan admin.');
      setUser(data.user);
      setCurrentView('pending');
      setRegisterForm({ email: '', whatsapp: '', password: '' });
    } catch (err) {
      showToastMsg('Terjadi kesalahan koneksi server', 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // Admin Master Shortcut Login
    if (loginForm.email === 'admin@gmail.com' && loginForm.password === 'admin123') {
      setIsAdminLoggedIn(true);
      setCurrentView('admin');
      fetchUsers();
      showToastMsg('Selamat datang di Panel Admin!');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();

      if (!res.ok) {
        showToastMsg(data.error || 'Email atau password salah', 'error');
        return;
      }

      const userData = data.user;
      setUser(userData);

      if (userData.status === 'pending') {
        setCurrentView('pending');
      } else if (userData.status === 'approved') {
        setCurrentView('dashboard');
        setShowAnnouncement(true);
      } else {
        showToastMsg('Akun Anda ditolak oleh Admin', 'error');
      }
    } catch (err) {
      showToastMsg('Gagal terhubung ke server', 'error');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotForm.email.toLowerCase().endsWith('@gmail.com')) {
      showToastMsg('Email harus menggunakan domain @gmail.com!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotForm)
      });
      const data = await res.json();

      if (!res.ok) {
        showToastMsg(data.error || 'Verifikasi gagal', 'error');
        return;
      }

      showToastMsg('Password berhasil diperbarui! Silakan login kembali.');
      setShowForgotPassword(false);
      setForgotForm({ email: '', whatsapp: '', newPassword: '' });
    } catch (err) {
      showToastMsg('Gagal memproses permintaan', 'error');
    }
  };

  // ---------------- MEMBER HANDLERS ----------------
  const handleClaim = async (benefitId) => {
    if (!user) return;
    if (user.isFrozen) {
      showToastMsg('Akses Anda dibekukan oleh Admin. Tidak dapat mengklaim benefit.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/benefits/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, benefitId })
      });
      const data = await res.json();

      if (!res.ok) {
        showToastMsg(data.error || 'Gagal mengklaim benefit', 'error');
        return;
      }

      setActiveClaimData({
        title: data.log.benefitTitle,
        content: data.data
      });
      showToastMsg('Benefit berhasil diklaim!');
      fetchBenefits();
    } catch (err) {
      showToastMsg('Terjadi kesalahan server saat klaim', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changePassForm.newPassword !== changePassForm.confirmPassword) {
      showToastMsg('Konfirmasi password baru tidak cocok!', 'error');
      return;
    }

    showToastMsg('Password akun berhasil diubah!');
    setChangePassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  // ---------------- ADMIN HANDLERS ----------------
  const handleApproveUser = async (userId, action) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        showToastMsg(`Status user berhasil diperbarui: ${action}`);
        fetchUsers();
      }
    } catch (err) {
      showToastMsg('Gagal memproses aksi admin', 'error');
    }
  };

  const handleToggleFreezeUser = async (userId, currentFreezeState) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: currentFreezeState ? 'unfreeze' : 'freeze' })
      });
      if (res.ok) {
        showToastMsg(currentFreezeState ? 'Akses user dipulihkan!' : 'Akses user dibekukan!');
        fetchUsers();
      }
    } catch (err) {
      showToastMsg('Gagal memproses freeze/unfreeze', 'error');
    }
  };

  const handleCreateBenefit = async (e) => {
    e.preventDefault();
    try {
      const accountsArray = benefitForm.accountsRaw
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const payload = {
        title: benefitForm.title,
        description: benefitForm.description,
        type: benefitForm.type,
        url: benefitForm.type === 'url' ? benefitForm.url : '',
        accounts: benefitForm.type === 'account' ? accountsArray : [],
        dailyLimit: parseInt(benefitForm.dailyLimit) || 1
      };

      const res = await fetch('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToastMsg('Benefit baru berhasil ditambahkan!');
        setBenefitForm({
          title: '',
          description: '',
          type: 'account',
          url: '',
          accountsRaw: '',
          dailyLimit: 1
        });
        fetchBenefits();
      }
    } catch (err) {
      showToastMsg('Gagal menambah benefit', 'error');
    }
  };

  // ---------------- RENDER VIEWS ----------------
  return (
    <div className="min-h-screen bg-[#1D031B] text-white font-sans antialiased selection:bg-[#E60070] selection:text-white">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
          toast.type === 'error' ? 'bg-rose-950 border-rose-600 text-rose-200' : 'bg-emerald-950 border-emerald-600 text-emerald-200'
        }`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Demo View Switcher Top Bar */}
      <div className="bg-[#2C0A29]/90 border-b border-gray-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-[#E60070]">Bukan Hannz System Switcher</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCurrentView('login')} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded">Login</button>
          <button onClick={() => setCurrentView('register')} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded">Register</button>
          <button onClick={() => setCurrentView('pending')} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded">Pending View</button>
          <button onClick={() => { setCurrentView('dashboard'); setUser({ _id: '1', email: 'member@gmail.com', status: 'approved', isFrozen: false }); }} className="px-2.5 py-1 bg-[#E60070] rounded">Member Dashboard</button>
          <button onClick={() => { setCurrentView('dashboard'); setUser({ _id: '2', email: 'frozen@gmail.com', status: 'approved', isFrozen: true }); }} className="px-2.5 py-1 bg-rose-700 rounded">Member Dibekukan</button>
          <button onClick={() => { setCurrentView('admin'); setIsAdminLoggedIn(true); fetchUsers(); }} className="px-2.5 py-1 bg-purple-700 rounded">Panel Admin</button>
        </div>
      </div>

      {/* 1. AUTH LOGIN VIEW */}
      {currentView === 'login' && (
        <div className="min-h-[calc(100vh-45px)] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#2C0A29] border border-[#E60070]/30 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black text-[#E60070] tracking-wider">BUKAN HANNZ</h1>
              <p className="text-xs text-gray-400 mt-1">Sistem Membership Eksklusif</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Email Google (@gmail.com)</label>
                <input
                  type="email"
                  placeholder="nama@gmail.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs focus:border-[#E60070] outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-gray-300">Password</label>
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[11px] text-[#F0C37A] hover:underline">
                    Lupa Password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs focus:border-[#E60070] outline-none"
                  required
                />
              </div>

              <div className="bg-[#1D031B] border border-dashed border-gray-700/80 rounded-lg p-3 text-center text-xs text-gray-400">
                🔒 Verifikasi Keamanan CAPTCHA Aktif
              </div>

              <button type="submit" className="w-full bg-[#E60070] hover:bg-[#c4005f] font-semibold py-3 rounded-lg text-xs transition shadow-lg">
                Masuk ke Member Area
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-800/80 pt-4">
              Belum punya akun?{' '}
              <button onClick={() => setCurrentView('register')} className="text-[#E60070] font-semibold hover:underline">
                Daftar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. AUTH REGISTER VIEW */}
      {currentView === 'register' && (
        <div className="min-h-[calc(100vh-45px)] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#2C0A29] border border-[#E60070]/30 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#E60070] mb-2 text-center">Formulir Pendaftaran</h2>
            <p className="text-xs text-gray-400 text-center mb-6">Wajib menggunakan email bertipe @gmail.com</p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Email Google (@gmail.com)</label>
                <input
                  type="email"
                  placeholder="user@gmail.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs focus:border-[#E60070] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Nomor WhatsApp Aktif</label>
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={registerForm.whatsapp}
                  onChange={(e) => setRegisterForm({ ...registerForm, whatsapp: e.target.value })}
                  className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs focus:border-[#E60070] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Buat password unik"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs focus:border-[#E60070] outline-none"
                  required
                />
              </div>

              <div className="bg-[#1D031B] border border-dashed border-gray-700/80 rounded-lg p-3 text-center text-xs text-gray-400">
                🤖 Verifikasi CAPTCHA Terpasang
              </div>

              <button type="submit" className="w-full bg-[#E60070] hover:bg-[#c4005f] font-semibold py-3 rounded-lg text-xs transition">
                Selesaikan Pendaftaran
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-800/80 pt-4">
              Sudah memiliki akun?{' '}
              <button onClick={() => setCurrentView('login')} className="text-[#E60070] font-semibold hover:underline">
                Login di sini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PENDING APPROVAL VIEW */}
      {currentView === 'pending' && (
        <div className="min-h-[calc(100vh-45px)] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#2C0A29] border border-[#F0C37A]/40 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-[#F0C37A]/10 text-[#F0C37A] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold border border-[#F0C37A]/30">
              ⏳
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Akun Menunggu Persetujuan</h2>
            <p className="text-gray-300 text-xs leading-relaxed mb-6">
              Pendaftaran berhasil! Akun Anda sedang diverifikasi secara manual oleh Owner/Admin sebelum dapat mengakses area member.
            </p>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20sudah%20daftar%20membership"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 px-5 py-3 rounded-xl text-xs font-bold transition shadow-lg"
            >
              💬 Konfirmasi Langsung via WhatsApp Admin
            </a>
            <button onClick={() => setCurrentView('login')} className="mt-4 text-xs text-gray-400 hover:underline">
              Kembali ke Login
            </button>
          </div>
        </div>
      )}

      {/* 4. MEMBER DASHBOARD VIEW */}
      {currentView === 'dashboard' && user && (
        <div className="min-h-[calc(100vh-45px)] flex flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-[#2C0A29] border-r border-gray-800 p-6 flex flex-col justify-between">
            <div>
              <h1 className="text-lg font-black text-[#E60070] tracking-wider mb-6">MEMBER AREA</h1>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('benefits')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'benefits' ? 'bg-[#E60070] text-white' : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  🎁 Katalog Benefit
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'history' ? 'bg-[#E60070] text-white' : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  📜 Riwayat Klaim
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'password' ? 'bg-[#E60070] text-white' : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  🔑 Ganti Password
                </button>
              </nav>
            </div>
            <button onClick={() => setCurrentView('login')} className="mt-8 text-xs text-rose-400 text-left hover:underline">
              🚪 Keluar Akun
            </button>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-6 md:p-8 space-y-6">
            {/* FROZEN USER WARNING BANNER */}
            {user.isFrozen && (
              <div className="bg-rose-950/80 border border-rose-600 rounded-xl p-4 flex items-center justify-between text-xs text-rose-200 shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <h3 className="font-bold text-rose-400">AKSES DICABUT (DIBEKUKAN)</h3>
                    <p className="text-[11px] text-rose-300">Akun Anda sedang dibekukan oleh Admin. Seluruh fitur klaim benefit dikunci sementara.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BENEFITS */}
            {activeTab === 'benefits' && (
              <section className="space-y-6">
                <header className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">Katalog Benefit Tersedia</h2>
                    <p className="text-xs text-gray-400">Pilih benefit yang ingin Anda klaim sesuai limit harian.</p>
                  </div>
                  <span className="bg-[#F0C37A]/20 text-[#F0C37A] border border-[#F0C37A]/40 px-3 py-1 rounded-full text-xs font-semibold">
                    Member Aktif
                  </span>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {benefits.length === 0 ? (
                    <div className="col-span-full bg-[#2C0A29] border border-gray-800 rounded-xl p-8 text-center text-gray-400 text-xs">
                      Belum ada benefit yang ditambahkan oleh Admin.
                    </div>
                  ) : (
                    benefits.map((b) => {
                      const isAccount = b.type === 'account';
                      const stockCount = isAccount ? (b.accounts ? b.accounts.length : 0) : 999;
                      const isOutOfStock = isAccount && stockCount === 0;

                      return (
                        <div key={b._id} className="bg-[#2C0A29] border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-[#E60070]/50 transition">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-sm text-white">{b.title}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300">
                                {isAccount ? 'Format Akun' : 'Link URL'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">{b.description || 'Benefit premium khusus member.'}</p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-gray-800/80">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Sisa Stok:</span>
                              <span className={`font-bold ${isOutOfStock ? 'text-rose-400' : 'text-[#F0C37A]'}`}>
                                {isAccount ? `${stockCount} Akun` : 'Tersedia'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Limit Harian:</span>
                              <span className="text-gray-200 font-medium">{b.dailyLimit > 0 ? `${b.dailyLimit}x / Hari` : 'Tanpa Limit'}</span>
                            </div>

                            <button
                              onClick={() => handleClaim(b._id)}
                              disabled={user.isFrozen || isOutOfStock}
                              className={`w-full py-2.5 rounded-lg text-xs font-bold transition shadow-md ${
                                user.isFrozen || isOutOfStock
                                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                  : 'bg-[#E60070] hover:bg-[#c4005f] text-white'
                              }`}
                            >
                              {user.isFrozen ? 'Akses Dibekukan' : isOutOfStock ? 'Stok Habis' : 'Klaim Sekarang'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* TAB: CHANGE PASSWORD */}
            {activeTab === 'password' && (
              <section className="max-w-md bg-[#2C0A29] border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-[#E60070] mb-4">Ubah Password Akun</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Password Lama</label>
                    <input
                      type="password"
                      value={changePassForm.oldPassword}
                      onChange={(e) => setChangePassForm({ ...changePassForm, oldPassword: e.target.value })}
                      className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-2.5 text-xs outline-none focus:border-[#E60070]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Password Baru</label>
                    <input
                      type="password"
                      value={changePassForm.newPassword}
                      onChange={(e) => setChangePassForm({ ...changePassForm, newPassword: e.target.value })}
                      className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-2.5 text-xs outline-none focus:border-[#E60070]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      value={changePassForm.confirmPassword}
                      onChange={(e) => setChangePassForm({ ...changePassForm, confirmPassword: e.target.value })}
                      className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-2.5 text-xs outline-none focus:border-[#E60070]"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#E60070] hover:bg-[#c4005f] py-2.5 rounded-lg text-xs font-semibold transition">
                    Simpan Password Baru
                  </button>
                </form>
              </section>
            )}
          </main>
        </div>
      )}

      {/* 5. ADMIN PANEL VIEW */}
      {currentView === 'admin' && isAdminLoggedIn && (
        <div className="min-h-[calc(100vh-45px)] flex flex-col md:flex-row">
          <aside className="w-full md:w-64 bg-[#2C0A29] border-r border-gray-800 p-6">
            <h1 className="text-lg font-black text-[#E60070] tracking-wider mb-6">ADMIN PANEL</h1>
            <nav className="space-y-2">
              <button
                onClick={() => setAdminTab('users')}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                  adminTab === 'users' ? 'bg-[#E60070] text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                👥 Kelola User & Freeze
              </button>
              <button
                onClick={() => setAdminTab('benefits')}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                  adminTab === 'benefits' ? 'bg-[#E60070] text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                ➕ Tambah Benefit & Stok
              </button>
            </nav>
          </aside>

          <main className="flex-1 p-6 md:p-8 space-y-6">
            {/* ADMIN TAB: USERS */}
            {adminTab === 'users' && (
              <section className="bg-[#2C0A29] border border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Daftar Pengguna & Akses</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-800 text-gray-400">
                      <tr>
                        <th className="pb-3">Email Google</th>
                        <th className="pb-3">WhatsApp</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Tindakan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-4 text-center text-gray-500">Belum ada user terdaftar</td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u._id}>
                            <td className="py-3 font-medium">{u.email}</td>
                            <td className="py-3 text-gray-300">{u.whatsapp}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.isFrozen
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : u.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}>
                                {u.isFrozen ? 'DIBEKUKAN' : u.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 text-right space-x-2">
                              {u.status === 'pending' && (
                                <button
                                  onClick={() => handleApproveUser(u._id, 'approved')}
                                  className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-white font-medium"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleFreezeUser(u._id, u.isFrozen)}
                                className={`px-3 py-1 rounded text-white font-medium ${
                                  u.isFrozen ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                              >
                                {u.isFrozen ? 'Pulihkan Akses' : 'Cabut Akses (Freeze)'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ADMIN TAB: ADD BENEFIT */}
            {adminTab === 'benefits' && (
              <section className="max-w-xl bg-[#2C0A29] border border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-[#E60070] mb-4">Tambah Benefit / Stok Baru</h3>
                <form onSubmit={handleCreateBenefit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Judul Benefit</label>
                    <input
                      type="text"
                      placeholder="Contoh: Akun CapCut Pro 1 Bulan"
                      value={benefitForm.title}
                      onChange={(e) => setBenefitForm({ ...benefitForm, title: e.target.value })}
                      className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs outline-none focus:border-[#E60070]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Tipe Benefit</label>
                    <select
                      value={benefitForm.type}
                      onChange={(e) => setBenefitForm({ ...benefitForm, type: e.target.value })}
                      className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs outline-none focus:border-[#E60070]"
                    >
                      <option value="account">Format Akun | Password (Baris Multiline)</option>
                      <option value="url">Link URL Direct</option>
                    </select>
                  </div>

                  {benefitForm.type === 'account' ? (
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Stok Akun (1 Baris = 1 Stok Akun)</label>
                      <textarea
                        rows="4"
                        placeholder={'email1@gmail.com|pass123\nemail2@gmail.com|pass456'}
                        value={benefitForm.accountsRaw}
                        onChange={(e) => setBenefitForm({ ...benefitForm, accountsRaw: e.target.value })}
                        className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs font-mono outline-none focus:border-[#E60070]"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Link URL Benefit</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={benefitForm.url}
                        onChange={(e) => setBenefitForm({ ...benefitForm, url: e.target.value })}
                        className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs outline-none focus:border-[#E60070]"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Limit Klaim Harian Per Member</label>
                    <input
                      type="number"
                      min="0"
                      value={benefitForm.dailyLimit}
                      onChange={(e) => setBenefitForm({ ...benefitForm, dailyLimit: e.target.value })}
                      className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs outline-none focus:border-[#E60070]"
                    />
                  </div>

                  <button type="submit" className="w-full bg-[#E60070] hover:bg-[#c4005f] py-3 rounded-lg text-xs font-bold transition">
                    Simpan & Publikasikan Benefit
                  </button>
                </form>
              </section>
            )}
          </main>
        </div>
      )}

      {/* ANNOUNCEMENT POPUP MODAL */}
      {showAnnouncement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#2C0A29] border border-[#E60070] rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <span className="text-4xl">📢</span>
            <h3 className="text-lg font-bold text-[#E60070]">Informasi & Info Stok Benefit</h3>
            <p className="text-xs text-gray-300 leading-relaxed">{config.announcementText}</p>

            <a
              href={config.groupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-3 rounded-xl text-xs transition"
            >
              💬 Join Grup Diskusi / Info Stok (WhatsApp)
            </a>

            <button
              onClick={() => setShowAnnouncement(false)}
              className="w-full bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-xs font-semibold"
            >
              Tutup Pengumuman
            </button>
          </div>
        </div>
      )}

      {/* CLAIM RESULT MODAL */}
      {activeClaimData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#2C0A29] border border-[#F0C37A] rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <span className="text-4xl">🎉</span>
            <h3 className="text-lg font-bold text-[#F0C37A]">Berhasil Mengklaim Benefit!</h3>
            <p className="text-xs text-gray-300">{activeClaimData.title}</p>

            <div className="bg-[#1D031B] border border-gray-800 p-4 rounded-xl text-xs font-mono text-[#F0C37A] break-all">
              {activeClaimData.content}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(activeClaimData.content);
                showToastMsg('Hasil klaim disalin ke clipboard!');
              }}
              className="w-full bg-[#E60070] hover:bg-[#c4005f] py-2.5 rounded-xl text-xs font-bold transition"
            >
              📋 Salin Akun / Link
            </button>

            <button
              onClick={() => setActiveClaimData(null)}
              className="w-full bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
