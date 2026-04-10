import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.js";

export const authenticateToken = async (req, res, next) => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek apakah user masih ada di database
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        role: true,
        status_user: true,
        position_user: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan.",
      });
    }

    if (user.status_user === "INACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Akun Anda tidak aktif. Hubungi administrator.",
      });
    }

    // Attach user data ke request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Token tidak valid.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        message: "Token sudah kadaluarsa. Silakan login kembali.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memverifikasi token.",
      error: error.message,
    });
  }
};

// Middleware untuk cek role
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke resource ini.",
      });
    }

    next();
  };
};

// Middleware untuk cek position
export const authorizePosition = (...allowedPositions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi.",
      });
    }

    if (!allowedPositions.includes(req.user.position_user)) {
      return res.status(403).json({
        success: false,
        message: "Posisi Anda tidak memiliki akses ke resource ini.",
      });
    }

    next();
  };
};

// Shared access rules for pelayanan modules
export const authorizePelayananMutation =
  authorizePosition("bidan_praktik");

export const authorizePelayananVerification = authorizePosition("bidan_desa");
