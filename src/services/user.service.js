import prisma from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const createUserService = async (userData) => {
  const {
    full_name,
    password,
    phone_number,
    email,
    address,
    position_user,
    role,
    status_user,
    village_id, // Tambahkan ini
  } = userData;

  // Validasi: User biasa WAJIB punya posisi, Admin TIDAK WAJIB.
  // Jika role tidak diisi, defaultnya adalah USER (sesuai schema), jadi harus dicek juga.
  if ((role === "USER" || !role) && !position_user) {
    throw new Error("Posisi (position_user) wajib diisi untuk Role USER!");
  }

  // Validasi: Bidan desa WAJIB punya village_id
  if (position_user === "bidan_desa" && !village_id) {
    throw new Error("Bidan desa wajib di-assign ke village!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      full_name: full_name,
      password: hashedPassword,
      phone_number: phone_number,
      email: email,
      address: address,
      position_user: position_user,
      role,
      status_user,
      village_id, // Tambahkan ini ke data create
    },
  });

  delete newUser.password;

  return newUser;
};

export const getUserService = async () => {
  const user = await prisma.user.findMany({
    include: {
      practice_place: {
        select: {
          practice_id: true,
          nama_praktik: true,
          village_id: true,
          alamat: true,
        },
      },
    },
  });
  user.forEach((user) => {
    delete user.password;
  });

  return user;
};

export const getUserByIdService = async (user_id) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: {
      practice_place: {
        select: {
          practice_id: true,
          nama_praktik: true,
          village_id: true,
          alamat: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  delete user.password;
  return user;
};

export const updateUserStatusService = async (user_id, status_user) => {
  // Validasi status harus ACTIVE atau INACTIVE
  if (status_user !== "ACTIVE" && status_user !== "INACTIVE") {
    throw new Error("Status harus ACTIVE atau INACTIVE");
  }

  // Cek apakah user ada
  const existingUser = await prisma.user.findUnique({
    where: { user_id },
  });

  if (!existingUser) {
    throw new Error("User tidak ditemukan");
  }

  // Update status user
  const updatedUser = await prisma.user.update({
    where: { user_id },
    data: { status_user },
  });

  delete updatedUser.password;

  return updatedUser;
};

export const updateUserService = async (user_id, userData) => {
  const {
    full_name,
    phone_number,
    email,
    address,
    position_user,
    role,
    village_id,
    practice_id,
  } = userData;

  // Cek apakah user ada
  const existingUser = await prisma.user.findUnique({
    where: { user_id },
  });

  if (!existingUser) {
    throw new Error("User tidak ditemukan");
  }

  // Validasi: Jika email diubah, cek apakah email baru sudah dipakai user lain
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      throw new Error("Email sudah digunakan oleh user lain");
    }
  }

  // Validasi: User biasa WAJIB punya posisi, Admin TIDAK WAJIB
  const newRole = role || existingUser.role;
  const newPosition =
    position_user !== undefined ? position_user : existingUser.position_user;

  if (newRole === "USER" && !newPosition) {
    throw new Error("Posisi (position_user) wajib diisi untuk Role USER!");
  }

  // Validasi: Bidan desa WAJIB punya village_id
  const newVillageId =
    village_id !== undefined ? village_id : existingUser.village_id;
  if (newPosition === "bidan_desa" && !newVillageId) {
    throw new Error("Bidan desa wajib di-assign ke village!");
  }

  let newPracticeId =
    practice_id !== undefined ? practice_id : existingUser.practice_id;

  if (newPosition !== "bidan_praktik") {
    newPracticeId = null;
  }

  if (newPracticeId) {
    const practiceExists = await prisma.practice_place.findUnique({
      where: { practice_id: newPracticeId },
    });

    if (!practiceExists) {
      throw new Error("Tempat praktik tidak ditemukan");
    }
  }

  // Siapkan data yang akan diupdate (hanya field yang dikirim)
  const dataToUpdate = {};

  if (full_name !== undefined) dataToUpdate.full_name = full_name;
  if (phone_number !== undefined) dataToUpdate.phone_number = phone_number;
  if (email !== undefined) dataToUpdate.email = email;
  if (address !== undefined) dataToUpdate.address = address;
  if (position_user !== undefined) dataToUpdate.position_user = position_user;
  if (role !== undefined) dataToUpdate.role = role;
  if (village_id !== undefined) dataToUpdate.village_id = village_id;
  if (practice_id !== undefined || newPosition !== "bidan_praktik") {
    dataToUpdate.practice_id = newPracticeId;
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { user_id },
    data: dataToUpdate,
  });

  delete updatedUser.password;

  return updatedUser;
};

export const changePasswordService = async (
  user_id,
  oldPassword,
  newPassword,
) => {
  // Validasi: Password baru tidak boleh kosong
  if (!newPassword || newPassword.trim() === "") {
    throw new Error("Password baru tidak boleh kosong");
  }

  // Validasi: Password baru minimal 6 karakter
  if (newPassword.length < 6) {
    throw new Error("Password baru minimal 6 karakter");
  }

  // Cek apakah user ada
  const user = await prisma.user.findUnique({
    where: { user_id },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  // Validasi: Cek apakah password lama benar
  const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordMatch) {
    throw new Error("Password lama tidak sesuai");
  }

  // Hash password baru
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  const updatedUser = await prisma.user.update({
    where: { user_id },
    data: { password: hashedNewPassword },
  });

  delete updatedUser.password;

  return updatedUser;
};

export const resetPasswordByAdminService = async (user_id, newPassword) => {
  // Validasi: Password baru tidak boleh kosong
  if (!newPassword || newPassword.trim() === "") {
    throw new Error("Password baru tidak boleh kosong");
  }

  // Validasi: Password baru minimal 6 karakter
  if (newPassword.length < 6) {
    throw new Error("Password baru minimal 6 karakter");
  }

  // Cek apakah user ada
  const user = await prisma.user.findUnique({
    where: { user_id },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  // Hash password baru
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password (tanpa validasi password lama)
  const updatedUser = await prisma.user.update({
    where: { user_id },
    data: { password: hashedNewPassword },
  });

  delete updatedUser.password;

  return updatedUser;
};
