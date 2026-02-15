-- AlterTable
ALTER TABLE "imunisasi" ADD COLUMN     "alasan_penolakan" TEXT,
ADD COLUMN     "diverifikasi_oleh" TEXT,
ADD COLUMN     "status_verifikasi" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tanggal_verifikasi" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "keluarga_berencana" ADD COLUMN     "alasan_penolakan" TEXT,
ADD COLUMN     "diverifikasi_oleh" TEXT,
ADD COLUMN     "status_verifikasi" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tanggal_verifikasi" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pemeriksaan_kehamilan" ADD COLUMN     "alasan_penolakan" TEXT,
ADD COLUMN     "diverifikasi_oleh" TEXT,
ADD COLUMN     "status_verifikasi" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tanggal_verifikasi" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "persalinan" ADD COLUMN     "alasan_penolakan" TEXT,
ADD COLUMN     "diverifikasi_oleh" TEXT,
ADD COLUMN     "status_verifikasi" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tanggal_verifikasi" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "pemeriksaan_kehamilan" ADD CONSTRAINT "pemeriksaan_kehamilan_diverifikasi_oleh_fkey" FOREIGN KEY ("diverifikasi_oleh") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persalinan" ADD CONSTRAINT "persalinan_diverifikasi_oleh_fkey" FOREIGN KEY ("diverifikasi_oleh") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keluarga_berencana" ADD CONSTRAINT "keluarga_berencana_diverifikasi_oleh_fkey" FOREIGN KEY ("diverifikasi_oleh") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imunisasi" ADD CONSTRAINT "imunisasi_diverifikasi_oleh_fkey" FOREIGN KEY ("diverifikasi_oleh") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
