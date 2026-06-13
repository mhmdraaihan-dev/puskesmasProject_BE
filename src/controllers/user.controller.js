import {
  createUserService,
  getUserService,
  getUserByIdService,
  updateUserStatusService,
  updateUserService,
  changePasswordService,
  resetPasswordByAdminService,
} from "../services/user.service.js";
import { getErrorResponse } from "../utils/error-response.util.js";

const sendErrorResponse = (res, error, fallbackMessage) => {
  const { statusCode, message } = getErrorResponse(error, fallbackMessage);

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export const createUserController = async (req, res) => {
  try {
    const user = await createUserService(req.body);
    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: user,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Gagal membuat user");
  }
};

export const getUserController = async (req, res) => {
  try {
    const result = await getUserService();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Gagal mengambil data user");
  }
};

export const getUserByIdController = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await getUserByIdService(user_id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Gagal mengambil detail user");
  }
};

export const updateUserStatusController = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { status_user } = req.body;

    const result = await updateUserStatusService(user_id, status_user);
    res.status(200).json({
      success: true,
      message: "Status user berhasil diubah",
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Gagal mengubah status user");
  }
};

export const updateUserController = async (req, res) => {
  try {
    const { user_id } = req.params;
    const requesterId = req.user.user_id;
    const requesterRole = req.user.role;

    // VALIDASI AKSES: Admin boleh edit siapa saja, User hanya boleh edit diri sendiri
    if (requesterRole !== "ADMIN" && requesterId !== user_id) {
      return res.status(403).json({
        success: false,
        message: "Anda hanya diperbolehkan mengedit profil sendiri",
      });
    }

    // VALIDASI FIELD: User biasa tidak boleh ubah role/posisi/status/village
    if (requesterRole !== "ADMIN") {
      const allowedFields = ["full_name", "phone_number", "email", "address"];
      const requestedFields = Object.keys(req.body);
      const hasForbiddenFields = requestedFields.some(
        (field) => !allowedFields.includes(field),
      );

      if (hasForbiddenFields) {
        return res.status(403).json({
          success: false,
          message:
            "Anda tidak memiliki izin untuk mengubah data sensitif (Role, Posisi, Status, Desa)",
        });
      }
    }

    const result = await updateUserService(user_id, req.body);
    res.status(200).json({
      success: true,
      message: "Data user berhasil diubah",
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Gagal mengubah data user");
  }
};

export const changePasswordController = async (req, res) => {
  try {
    const { user_id } = req.params;
    const requesterId = req.user.user_id;
    const { old_password, new_password } = req.body;

    // VALIDASI AKSES: Hanya boleh ganti password sendiri
    if (requesterId !== user_id) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak diperbolehkan mengganti password user lain",
      });
    }

    // Validasi input
    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Password lama dan password baru harus diisi",
      });
    }

    const result = await changePasswordService(
      user_id,
      old_password,
      new_password,
    );
    res.status(200).json({
      success: true,
      message: "Password berhasil diubah",
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Gagal mengubah password");
  }
};

export const resetPasswordByAdminController = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { new_password } = req.body;

    // Validasi input
    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: "Password baru harus diisi",
      });
    }

    const result = await resetPasswordByAdminService(user_id, new_password);
    res.status(200).json({
      success: true,
      message: "Password berhasil direset oleh admin",
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Gagal mereset password user");
  }
};
