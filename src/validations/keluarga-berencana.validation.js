import { z } from "zod";

const KONTRASEPSI_CANONICAL_MAP = {
  PIL: "PIL",
  SUNTIK: "SUNTIK",
  "SUNTIK 1 BULAN": "SUNTIK",
  "SUNTIK 3 BULAN": "SUNTIK",
  IMPLANT: "IMPLANT",
  IUD: "IUD",
  KONDOM: "KONDOM",
  MOW: "MOW",
  MOP: "MOP",
  MAL: "MAL",
};

const normalizeKontrasepsi = (value) =>
  value
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

const alatKontrasepsiSchema = z
  .string()
  .transform(normalizeKontrasepsi)
  .refine((value) => value in KONTRASEPSI_CANONICAL_MAP, {
    message:
      "Alat kontrasepsi harus PIL, SUNTIK, SUNTIK 1 BULAN, SUNTIK 3 BULAN, IMPLANT, IUD, KONDOM, MOW, MOP, atau MAL",
  })
  .transform((value) => KONTRASEPSI_CANONICAL_MAP[value]);

export const createKeluargaBerencanaSchema = z.object({
  body: z.object({
    practice_id: z
      .string()
      .uuid({ message: "Practice ID harus berupa UUID valid" })
      .optional(),
    pasien_id: z
      .string()
      .uuid({ message: "Pasien ID harus berupa UUID valid" }),
    tanggal_kunjungan: z
      .string()
      .datetime({ message: "Tanggal harus format ISO 8601" })
      .optional()
      .or(z.date()),

    // Data Anak (Historis)
    jumlah_anak_laki: z.coerce.number().int().min(0).default(0),
    jumlah_anak_perempuan: z.coerce.number().int().min(0).default(0),

    // Indikasi
    at: z.boolean().default(false), // Abortus Terancam

    // Alat Kontrasepsi (Single Choice)
    alat_kontrasepsi: alatKontrasepsiSchema,

    keterangan: z.string().optional(),
  }),
});

export const updateKeluargaBerencanaSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID KB harus berupa UUID valid" }),
  }),
  body: z.object({
    tanggal_kunjungan: z.string().datetime().optional().or(z.date()),
    jumlah_anak_laki: z.coerce.number().int().min(0).optional(),
    jumlah_anak_perempuan: z.coerce.number().int().min(0).optional(),
    at: z.boolean().optional(),
    alat_kontrasepsi: alatKontrasepsiSchema.optional(),
    keterangan: z.string().optional(),
  }),
});
