import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, whatsapp, password } = await req.json();

    // Validasi Strict Email Gmail
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return NextResponse.json({ error: 'Registrasi hanya diperbolehkan menggunakan domain @gmail.com' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar!' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      whatsapp,
      password: hashedPassword,
      status: 'pending',
      isFrozen: false
    });

    return NextResponse.json({ message: 'Pendaftaran berhasil, menunggu persetujuan admin', user: newUser });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
