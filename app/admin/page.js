'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminTab, setAdminTab] = useState('users'); // 'users' | 'benefits'
  const [usersList, setUsersList] = useState([]);
  
  // Login State
  const [adminLogin, setAdminLogin] = useState({ username: '', password: '' });

  // Benefit Form State
  const [benefitForm, setBenefitForm] = useState({
    title: '',
    description: '',
    type: 'account',
    url: '',
    accountsRaw: '',
    dailyLimit: 1
  });

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToastMsg = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
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

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminLogin.username === 'admin' && adminLogin.password === 'admin123') {
      setIsLoggedIn(true);
      showToastMsg('Login Admin Berhasil!');
      fetchUsers();
    } else {
      showToastMsg('Username atau Password Admin Salah!', 'error');
    }
  };

  const handleApproveUser = async (userId, action) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        showToastMsg(`Status user diperbarui: ${action}`);
        fetchUsers();
      }
    } catch (err) {
      showToastMsg('Gagal memproses aksi', 'error');
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
      showToastMsg('Gagal memproses pembekuan akses', 'error');
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
      }
    } catch (err) {
      showToastMsg('Gagal menambah benefit', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#1D031B] text-white font-sans antialiased">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
          toast.type === 'error' ? 'bg-rose-950 border-rose-600 text-rose-200' : 'bg-emerald-950 border-emerald-600 text-emerald-200'
        }`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {!isLoggedIn ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#2C0A29] border border-[#E60070]/30 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-xl font-black text-[#E60070] tracking-wider">PANEL ADMIN OWNER</h1>
              <p className="text-xs text-gray-400 mt-1">Masuk dengan kredensial rahasia Admin</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Username Admin</label>
                <input
                  type="text"
                  placeholder="admin"
                  value={adminLogin.username}
                  onChange={(e) => setAdminLogin({ ...adminLogin, username: e.target.value })}
                  className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs outline-none focus:border-[#E60070]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Password Admin</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={adminLogin.password}
                  onChange={(e) => setAdminLogin({ ...adminLogin, password: e.target.value })}
                  className="w-full bg-[#1D031B] border border-gray-800 rounded-lg p-3 text-xs outline-none focus:border-[#E60070]"
                  required
                />
              </div>

              <button type="submit" className="w-full bg-[#E60070] hover:bg-[#c4005f] py-3 rounded-lg text-xs font-bold transition">
                Masuk ke Panel Admin
              </button>
            </form>

            <div className="mt-6 text-center text-xs border-t border-gray-800/80 pt-4">
              <Link href="/" className="text-gray-400 hover:text-white transition">
                ← Kembali ke Halaman Utama Member
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col md:flex-row">
          <aside className="w-full md:w-64 bg-[#2C0A29] border-r border-gray-800 p-6 flex flex-col justify-between">
            <div>
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
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="mt-8 text-xs text-rose-400 text-left hover:underline">
              🚪 Keluar Admin
            </button>
          </aside>

          <main className="flex-1 p-6 md:p-8 space-y-6">
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
    </div>
  );
}
