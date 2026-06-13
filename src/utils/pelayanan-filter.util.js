const getCurrentYear = () => new Date().getFullYear().toString();

export const normalizePelayananListFilters = (query = {}, extraFilters = {}) => {
  const month = query.month ?? query.bulan;
  const yearInput = query.year ?? query.tahun;
  const year = month ? yearInput ?? getCurrentYear() : yearInput;

  return {
    page: query.page,
    limit: query.limit,
    village_id: query.village_id,
    practice_id: query.practice_id,
    pasien_id: query.pasien_id,
    tanggal_start: query.tanggal_start ?? query.dari_tanggal,
    tanggal_end: query.tanggal_end ?? query.sampai_tanggal,
    search: query.search,
    status_verifikasi: query.status_verifikasi,
    month,
    year,
    ...extraFilters,
  };
};
