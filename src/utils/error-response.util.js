const FRIENDLY_FIELD_NAMES = {
  email: "Email",
  phone_number: "Nomor telepon",
  village_id: "Desa",
  practice_id: "Tempat praktik",
  user_id: "User",
  pasien_id: "Pasien",
  nik: "NIK",
  token_hash: "Token",
  jti: "Token",
};

const VALIDATION_MESSAGE_HINTS = [
  "wajib",
  "tidak boleh",
  "minimal",
  "harus",
  "sudah digunakan",
  "sudah terdaftar",
  "tidak sesuai",
  "belum",
];

const FORBIDDEN_MESSAGE_HINTS = [
  "tidak memiliki izin",
  "tidak diperbolehkan",
  "hanya diperbolehkan",
];

const RAW_PRISMA_MESSAGE_HINTS = [
  "Invalid `prisma.",
  "Unique constraint failed on the fields",
  "Foreign key constraint failed",
];

const toFriendlyFieldName = (fieldName) => {
  if (!fieldName) {
    return "Data";
  }

  return (
    FRIENDLY_FIELD_NAMES[fieldName] ||
    fieldName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

const extractPrismaTargetFields = (meta = {}) => {
  if (Array.isArray(meta.target)) {
    return meta.target;
  }

  if (typeof meta.target === "string") {
    return meta.target
      .split(",")
      .map((field) => field.replace(/[^a-zA-Z0-9_]/g, "").trim())
      .filter(Boolean);
  }

  if (typeof meta.field_name === "string") {
    return meta.field_name
      .split(",")
      .map((field) => field.replace(/[^a-zA-Z0-9_]/g, "").trim())
      .filter(Boolean);
  }

  return [];
};

const formatFieldList = (fields) => fields.map(toFriendlyFieldName).join(", ");

const isRawPrismaMessage = (message = "") =>
  RAW_PRISMA_MESSAGE_HINTS.some((hint) => message.includes(hint));

export const getErrorResponse = (
  error,
  fallbackMessage = "Terjadi kesalahan pada server",
) => {
  const message = error?.message || "";
  const prismaCode = error?.code;
  const prismaFields = extractPrismaTargetFields(error?.meta);

  if (prismaCode === "P2002") {
    const fieldLabel = formatFieldList(prismaFields);

    return {
      statusCode: 409,
      message:
        prismaFields.length > 1
          ? `Kombinasi ${fieldLabel} sudah digunakan`
          : `${fieldLabel} sudah digunakan`,
    };
  }

  if (prismaCode === "P2003") {
    const fieldLabel = formatFieldList(prismaFields);

    return {
      statusCode: 400,
      message: `${fieldLabel} tidak valid`,
    };
  }

  if (prismaCode === "P2025") {
    return {
      statusCode: 404,
      message: "Data yang diminta tidak ditemukan",
    };
  }

  if (FORBIDDEN_MESSAGE_HINTS.some((hint) => message.includes(hint))) {
    return {
      statusCode: 403,
      message,
    };
  }

  if (message.includes("tidak ditemukan")) {
    return {
      statusCode: 404,
      message,
    };
  }

  if (VALIDATION_MESSAGE_HINTS.some((hint) => message.includes(hint))) {
    return {
      statusCode: 400,
      message,
    };
  }

  if (isRawPrismaMessage(message)) {
    return {
      statusCode: 500,
      message: fallbackMessage,
    };
  }

  return {
    statusCode: error?.statusCode || 500,
    message: message || fallbackMessage,
  };
};
