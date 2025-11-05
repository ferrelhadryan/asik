// Sample dataset for Red Snipper — status: 'suitable' | 'less' | 'unsuitable'
const locations = [
  {
    id: 'raja-ampat',
    name: 'Raja Ampat, Papua Barat',
    coords: [-0.5539, 130.6738],
    thumbnail: 'https://picsum.photos/seed/rajaampat/400/240',
    image: 'https://picsum.photos/seed/rajaampat/1200/800',
    status: 'suitable',
    analysis: {
      title: 'Perairan jernih & arus teratur',
      statusText: 'Cocok',
      suhuPermukaanLaut: '28.5–30°C',
      klorofilA: '0.10 mg/m³',
      salinitas: '33-34 ppt',
      arusLaut: '0.2–0.5 m/s (teratur)',
      kedalaman: '30–70 m',
      notes: 'Area konservasi laut, penting memerhatikan izin dan praktik ramah lingkungan.'
    }
  },
  {
    id: 'karimunjawa',
    name: 'Karimunjawa, Jawa Tengah',
    coords: [-5.8427, 110.4431],
    thumbnail: 'https://picsum.photos/seed/karimunjawa/400/240',
    image: 'https://picsum.photos/seed/karimunjawa/1200/800',
    status: 'suitable',
    analysis: {
      title: 'Perairan dangkal dengan arus terjaga',
      statusText: 'Cocok',
      suhuPermukaanLaut: '28–29°C',
      klorofilA: '0.18 mg/m³',
      salinitas: '33 ppt',
      arusLaut: '0.1–0.4 m/s',
      kedalaman: '10–30 m',
      notes: 'Cocok untuk budidaya skala kecil hingga menengah dengan pengelolaan limbah.'
    }
  },
  {
    id: 'teluk-lampung',
    name: 'Teluk Lampung, Lampung',
    coords: [-5.4853, 105.3033],
    thumbnail: 'https://picsum.photos/seed/teluklampung/400/240',
    image: 'https://picsum.photos/seed/teluklampung/1200/800',
    status: 'less',
    analysis: {
      title: 'Dekat pelabuhan dan aktivitas industri',
      statusText: 'Kurang Cocok',
      suhuPermukaanLaut: '29–30°C',
      klorofilA: '0.6 mg/m³',
      salinitas: '30-32 ppt',
      arusLaut: '0.0–0.2 m/s (tenang)',
      kedalaman: '5–20 m',
      notes: 'Memerlukan pemilihan titik jauh dari muara dan pemantauan kualitas air rutin.'
    }
  },
  {
    id: 'selat-lombok',
    name: 'Selat Lombok, NTB',
    coords: [-8.4879, 116.0371],
    thumbnail: 'https://picsum.photos/seed/selatlombok/400/240',
    image: 'https://picsum.photos/seed/selatlombok/1200/800',
    status: 'unsuitable',
    analysis: {
      title: 'Arus sangat kuat (Arlindo)',
      statusText: 'Tidak Cocok',
      suhuPermukaanLaut: '29°C',
      klorofilA: '0.05 mg/m³',
      salinitas: '35 ppt',
      arusLaut: '>1.5 m/s (sangat kuat)',
      kedalaman: '50–200 m',
      notes: 'Arus kuat dapat merusak instalasi KJA dan menyebabkan stres pada ikan.'
    }
  },
  {
    id: 'banda-sea',
    name: 'Perairan Banda, Maluku',
    coords: [-4.5, 129.8],
    thumbnail: 'https://picsum.photos/seed/banda/400/240',
    image: 'https://picsum.photos/seed/banda/1200/800',
    status: 'suitable',
    analysis: {
      title: 'Perairan dalam & bersih',
      statusText: 'Cocok',
      suhuPermukaanLaut: '28–30°C',
      klorofilA: '0.08 mg/m³',
      salinitas: '34 ppt',
      arusLaut: '0.2–0.6 m/s',
      kedalaman: '80–300 m',
      notes: 'Lokasi menjanjikan, namun perlu kajian lokasi rinci sebelum investasi.'
    }
  },
  {
    id: 'balikpapan',
    name: 'Perairan Balikpapan, Kalimantan Timur',
    coords: [-1.2736, 116.8286],
    thumbnail: 'https://picsum.photos/seed/balikpapan/400/240',
    image: 'https://picsum.photos/seed/balikpapan/1200/800',
    status: 'less',
    analysis: {
      title: 'Dekat aktivitas industri & pelabuhan',
      statusText: 'Kurang Cocok',
      suhuPermukaanLaut: '29–31°C',
      klorofilA: '0.45 mg/m³',
      salinitas: '31–33 ppt',
      arusLaut: '0.1–0.6 m/s (variatif)',
      kedalaman: '15–60 m',
      notes: 'Permintaan pasar bagus, tapi perlu pemantauan kontaminan dan pemilihan titik jauh dari muara.'
    }
  }
];
