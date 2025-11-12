document.addEventListener('DOMContentLoaded', () => {
    // === Navbar Toggle (Hamburger Menu) ===
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            const icon = navToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('show');
                const icon = navToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // === Hero Text Slider Logic ===
    const slidesData = [
        {
            subtitle: "Potensi Lokasi",
            title: "Penangkapan Kakap Merah",
            description: "Temukan wilayah terbaik untuk penangkapan ikan Kakap Merah di perairan Indonesia melalui analisis faktor oseanografi dan data satelit terbaru.",
            link: "#factors", // Link tombol "Jelajahi Sekarang"
            linkText: "Jelajahi Sekarang"
        },
        {
        subtitle: "Mengenal Lebih Dekat",
        title: "Apa Itu Ikan Kakap Merah?",
        description: "Ikan Kakap Merah (Lutjanus campechanus) adalah spesies ikan laut penting yang dikenal karena dagingnya yang lezat dan nilai ekonominya yang tinggi. Ia mendiami perairan tropis dan subtropis.",
        link: "#about-redsnapper-fish", // <-- Link ke section baru di bawah
        linkText: "Pelajari Lebih Lanjut"
        },
        {
            subtitle: "Faktor Penting",
            title: "Kualitas Air Optimal",
            description: "Memahami parameter kunci seperti suhu, salinitas, dan klorofil-a untuk memastikan lingkungan yang ideal bagi pertumbuhan kakap merah.",
            link: "#factors",
            linkText: "Lihat Faktor"
        },
        {
            subtitle: "Teknologi Terdepan",
            title: "Analisis WebGIS Cerdas",
            description: "Manfaatkan kekuatan Sistem Informasi Geografis berbasis web untuk visualisasi data interaktif dan pengambilan keputusan yang presisi.",
            link: "map.html", // Contoh link ke halaman peta
            linkText: "Coba Peta Interaktif"
        },
        {
            subtitle: "Produksi Berkelanjutan",
            title: "Masa Depan Akuakultur",
            description: "Dukung praktik budidaya yang ramah lingkungan dan efisien untuk mencapai keberlanjutan ekonomi dan ekologi jangka panjang.",
            link: "#about",
            linkText: "Tentang Kami"
        }
        // Tambahkan lebih banyak slide sesuai kebutuhan Anda
    ];

    let currentSlideIndex = 0; // Indeks slide yang sedang aktif

    const heroTextSlider = document.querySelector('.hero-text-slider');
    const carouselIndicators = document.querySelector('.carousel-indicators');
    const leftArrow = document.querySelector('.carousel-arrow.left-arrow');
    const rightArrow = document.querySelector('.carousel-arrow.right-arrow');

    function createSlidesAndIndicators() {
        heroTextSlider.innerHTML = ''; // Kosongkan dulu
        carouselIndicators.innerHTML = ''; // Kosongkan indikator

        slidesData.forEach((slide, index) => {
            // Buat elemen slide
            const slideItem = document.createElement('div');
            slideItem.classList.add('slider-item');
            if (index === currentSlideIndex) {
                slideItem.classList.add('active');
            }
            slideItem.innerHTML = `
                <p class="slide-subtitle">${slide.subtitle}</p>
                <h1 class="slide-title">${slide.title}</h1>
                <p class="slide-description">${slide.description}</p>
                <a href="${slide.link}" class="learn-more-btn">
                    ${slide.linkText} <i class="fas fa-arrow-right"></i>
                </a>
            `;
            heroTextSlider.appendChild(slideItem);

            // Buat elemen indikator (dot)
            const dot = document.createElement('span');
            dot.classList.add('indicator-dot');
            if (index === currentSlideIndex) {
                dot.classList.add('active');
            }
            dot.dataset.index = index;
            dot.addEventListener('click', () => {
                currentSlideIndex = index;
                updateSliderContent();
            });
            carouselIndicators.appendChild(dot);
        });
    }

    function updateSliderContent() {
        const slides = heroTextSlider.querySelectorAll('.slider-item');
        const dots = carouselIndicators.querySelectorAll('.indicator-dot');

        slides.forEach((slide, index) => {
            if (index === currentSlideIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        dots.forEach((dot, index) => {
            if (index === currentSlideIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Navigasi panah
    leftArrow.addEventListener('click', () => {
        currentSlideIndex = (currentSlideIndex - 1 + slidesData.length) % slidesData.length;
        updateSliderContent();
    });

    rightArrow.addEventListener('click', () => {
        currentSlideIndex = (currentSlideIndex + 1) % slidesData.length;
        updateSliderContent();
    });

    // Inisialisasi: Buat slide dan indikator pertama kali
    createSlidesAndIndicators();
    updateSliderContent(); // Pastikan konten pertama ditampilkan

    // Otomatis berganti slide setiap 7 detik (opsional)
    // let autoSlideInterval = setInterval(() => {
    //     currentSlideIndex = (currentSlideIndex + 1) % slidesData.length;
    //     updateSliderContent();
    // }, 7000);

    // Hentikan auto-slide saat mouse hover (opsional)
    // heroTextSlider.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    // heroTextSlider.addEventListener('mouseleave', () => {
    //     autoSlideInterval = setInterval(() => {
    //         currentSlideIndex = (currentSlideIndex + 1) % slidesData.length;
    //         updateSliderContent();
    //     }, 7000);
    // });
});
