import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Benefit from '@/models/Benefit';
import ClaimLog from '@/models/ClaimLog';

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, benefitId } = await req.json();

    // 1. Cek User
    const user = await User.findById(userId);
    if (!user || user.status !== 'approved') {
      return NextResponse.json({ error: 'Akses ditolak / Akun belum di-approve' }, { status: 403 });
    }

    // 2. Cek apakah user dibekukan (Freeze)
    if (user.isFrozen) {
      return NextResponse.json({ error: 'Akses Anda dibekukan oleh Admin. Tidak dapat mengklaim benefit.' }, { status: 403 });
    }

    // 3. Cek Benefit
    const benefit = await Benefit.findById(benefitId);
    if (!benefit) {
      return NextResponse.json({ error: 'Benefit tidak ditemukan' }, { status: 44 });
    }

    // 4. Cek Limit Klaim Harian
    const today = new Date().toISOString().split('T')[0];
    const todayClaims = await ClaimLog.countDocuments({
      userId: user._id,
      benefitId: benefit._id,
      claimDate: today
    });

    if (benefit.dailyLimit > 0 && todayClaims >= benefit.dailyLimit) {
      return NextResponse.json({ error: `Anda telah mencapai limit klaim harian (${benefit.dailyLimit}x/hari) untuk benefit ini.` }, { status: 400 });
    }

    let claimedData = '';

    // 5. Proses Pemotongan Stok
    if (benefit.type === 'account') {
      if (!benefit.accounts || benefit.accounts.length === 0) {
        return NextResponse.json({ error: 'Stok akun habis!' }, { status: 400 });
      }

      // Ambil 1 akun dan hapus permanen dari array stok DB
      claimedData = benefit.accounts.shift();
      await benefit.save();
    } else {
      claimedData = benefit.url;
    }

    // 6. Catat Log Klaim
    const claimLog = await ClaimLog.create({
      userId: user._id,
      userEmail: user.email,
      benefitId: benefit._id,
      benefitTitle: benefit.title,
      claimedContent: claimedData,
      claimDate: today
    });

    return NextResponse.json({
      message: 'Berhasil mengklaim benefit!',
      data: claimedData,
      log: claimLog
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
