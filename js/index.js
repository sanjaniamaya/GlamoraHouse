if (history.scrollRestoration) { history.scrollRestoration = 'manual'; }
        window.onload = function() { window.scrollTo(0, 0); };

        function toggleMenu() { document.getElementById('navLinks').classList.toggle('active'); }

        // Mobile Menu Button Logic
        const navLinks = document.getElementById('navLinks');
        const menuToggle = document.querySelector('.menu-toggle');
        const closeMenu = document.querySelector('.close-menu');

        window.toggleMenu = function() {
            const isActive = navLinks.classList.toggle('active');
            if (isActive) {
                menuToggle.classList.add('hide');
            } else {
                menuToggle.classList.remove('hide');
            }
        }

        if(menuToggle) menuToggle.addEventListener('click', window.toggleMenu);
        if(closeMenu) closeMenu.addEventListener('click', window.toggleMenu);

        // Reset Form UI Logic
        window.resetForm = function() {
            document.getElementById('success-msg').style.display = 'none';
            document.getElementById('bookingForm').style.display = 'block';
            document.getElementById('bookingForm').reset();
        }

        // Navbar Scroll Effect
        let lastScrollTop = 0; const navbar = document.getElementById("navbar");
        window.addEventListener("scroll", function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop < 0) scrollTop = 0;
            if (scrollTop <= 0) { navbar.classList.remove("nav-hidden"); }
            else if (scrollTop > lastScrollTop) { navbar.classList.add("nav-hidden"); } 
            else { navbar.classList.remove("nav-hidden"); }
            lastScrollTop = scrollTop;
        });

        // Scroll Reveal Animation
        window.addEventListener('scroll', reveal);
        function reveal(){
            var reveals = document.querySelectorAll('.reveal');
            for(var i = 0; i < reveals.length; i++){
                var windowHeight = window.innerHeight;
                var revealTop = reveals[i].getBoundingClientRect().top;
                var revealPoint = 150;
                if(revealTop < windowHeight - revealPoint){ reveals[i].classList.add('active'); }
            }
        }

        // Pricing Filters
        window.filterPrices = function(category) {
            const rows = document.querySelectorAll('.price-row');
            const btns = document.querySelectorAll('.filter-btn');
            btns.forEach(btn => {
                btn.classList.remove('active');
                if(btn.innerText.toLowerCase().includes(category) || (category === 'all' && btn.innerText === 'All')) { btn.classList.add('active'); }
            });
            rows.forEach(row => {
                if(category === 'all') { row.style.display = 'flex'; } else {
                    if(row.classList.contains(category)) { row.style.display = 'flex'; } else { row.style.display = 'none'; }
                }
            });
        }

        // Reviews Carousel
        window.currentSlide = 0;
        window.moveSlide = function(direction) {
            const slides = document.querySelectorAll('.review-card');
            if(slides.length === 0) return;
            slides.forEach(s => s.classList.remove('active'));
            window.currentSlide = (window.currentSlide + direction + slides.length) % slides.length;
            slides[window.currentSlide].classList.add('active');
        }

        // Modal Logic
        window.openModal = function(title, desc, price, img) {
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDesc').innerText = desc;
            document.getElementById('modalPrice').innerText = price;
            document.getElementById('modalPrice').style.display = 'block';
            document.getElementById('modalImg').src = img;
            document.getElementById('serviceModal').classList.add('active');
        }

        window.openStaffModal = function(name, bio, img) {
            document.getElementById('modalTitle').innerText = name;
            document.getElementById('modalDesc').innerText = bio;
            document.getElementById('modalPrice').style.display = 'none';
            document.getElementById('modalImg').src = img;
            document.getElementById('serviceModal').classList.add('active');
        }

        window.closeModal = function(event) {
            if (event.target === document.getElementById('serviceModal')) {
                document.getElementById('serviceModal').classList.remove('active');
            }
        }
        window.closeModalBtn = function() {
            document.getElementById('serviceModal').classList.remove('active');
        }

        // Staff Carousel
        let currentStaffIndex = 0;
        const staffTrack = document.querySelector('.staff-track');
        window.totalStaff = 0;
        let cardsToShow = 4; 

        function updateCardsToShow() {
            if (window.innerWidth <= 768) { cardsToShow = 1; }
            else if (window.innerWidth <= 1024) { cardsToShow = 2; }
            else { cardsToShow = 4; }
        }
        window.addEventListener('resize', updateCardsToShow);
        updateCardsToShow();

        window.moveStaffSlide = function(direction) {
            if (window.totalStaff === 0) return;
            const maxIndex = Math.max(0, window.totalStaff - cardsToShow);
            currentStaffIndex += direction;
            if (currentStaffIndex < 0) { currentStaffIndex = maxIndex; }
            if (currentStaffIndex > maxIndex) { currentStaffIndex = 0; }
            const cardWidth = 100 / cardsToShow;
            if(document.getElementById('staffTrackContainer')) {
                document.getElementById('staffTrackContainer').style.transform = `translateX(-${currentStaffIndex * cardWidth}%)`;
            }
        }
    

        import { auth, db, onAuthStateChanged, doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from './firebase-config.js';

        // DOM Elements
        const loginBtns = document.querySelectorAll('.btn-login');
        const bookingForm = document.getElementById('bookingForm');
        const submitBtn = bookingForm.querySelector('button');
        
        let currentUser = null;

        // 1. AUTH STATE OBSERVER
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Ignore and PURGE Admin Login Context on Frontend User Site
                if (user.email === "admin@glamorahouse.lk") {
                    await signOut(auth); // Clear legacy cache
                    return;
                }

                currentUser = user;
                let displayName = "Member";
                try {
                    const docSnap = await getDoc(doc(db, "users", user.uid));
                    if (docSnap.exists()) {
                        displayName = docSnap.data().fullName.split(' ')[0]; 
                    } else if (user.displayName) {
                        displayName = user.displayName.split(' ')[0];
                    }
                } catch (e) { console.error(e); }

                loginBtns.forEach(btn => {
                    btn.href = "profile.html"; 
                    btn.innerHTML = `
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" 
                             style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover; border: 1px solid #bd00ff;">
                        <span>${displayName}</span>
                    `;
                    btn.style.display = "flex"; btn.style.alignItems = "center"; btn.style.gap = "6px"; btn.style.padding = "5px 20px"; btn.style.border = "1px solid #bd00ff";
                });

                if(displayName !== "Member") document.getElementById('c_name').value = displayName; 
                if(user.email) document.getElementById('c_email').value = user.email;

                submitBtn.innerText = "Confirm Booking";
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
                submitBtn.style.background = "var(--gradient-text)";
                submitBtn.style.cursor = "pointer";

            } else {
                currentUser = null;
                submitBtn.innerText = "🔒 Login to Book Appointment";
                submitBtn.style.background = "#333";
                submitBtn.style.border = "1px solid #555";
                submitBtn.style.cursor = "not-allowed";
                submitBtn.disabled = false; 
            }
        });

        submitBtn.addEventListener('click', (e) => {
            if (!currentUser) {
                e.preventDefault();
                if(confirm("You must be logged in to book an appointment. Go to login page?")) {
                    window.location.href = "login.html";
                }
            }
        });

        // 2. HANDLE BOOKING SUBMISSION (DATABASE + EMAIL)
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            if (!currentUser) return;

            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Processing...";
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";

            // A. Prepare Database Data
            const bookingData = {
                userId: currentUser.uid,
                customerName: document.getElementById('c_name').value,
                phone: document.getElementById('c_phone').value,
                email: document.getElementById('c_email').value,
                date: document.getElementById('c_date').value,
                time: document.getElementById('c_time').value,
                staff: document.getElementById('c_staff').value,
                service: document.getElementById('c_service').value,
                notes: document.getElementById('c_msg').value,
                status: "Pending",
                createdAt: serverTimestamp()
            };

            // B. Prepare Email Data (FormSubmit)
            const emailFormData = new FormData(bookingForm);

            try {
                // TASK 1: Save to Firebase
                await addDoc(collection(db, "bookings"), bookingData);
                console.log("Saved to Database");

                // TASK 2: Send Email via FormSubmit
                await fetch("https://formsubmit.co/ajax/dilshankasun352@gmail.com", {
                    method: "POST",
                    body: emailFormData
                });
                console.log("Email Sent");
                
                // Success UI
                bookingForm.style.display = 'none';
                document.getElementById('success-msg').style.display = 'block';

            } catch (error) {
                console.error("Error: ", error);
                alert("Something went wrong. Please check your connection.");
                
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
            }
        });

        // 3. DYNAMIC DATA LOADING (Services & Staff)
        async function loadFrontendData() {
            try {
                // Fetch in Parallel for MAXIMUM Speed!
                const [servicesSnap, staffSnap, feedbacksSnap] = await Promise.all([
                    getDocs(collection(db, "services")),
                    getDocs(collection(db, "staff")),
                    getDocs(collection(db, "feedbacks"))
                ]);
                
                const servicesData = servicesSnap.docs.map(d => d.data());
                const staffData = staffSnap.docs.map(d => d.data());
                const allFeedbacks = feedbacksSnap.docs.map(d => d.data());

                // --- Popular Services Grid ---
                const popContainer = document.getElementById('popularServicesContainer');
                if(popContainer) {
                    if(servicesData.length === 0) {
                        popContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #aaa;">No services added yet.</p>`;
                    } else {
                        let popHtml = '';
                        // Show first 3 for 'Popular'
                        servicesData.slice(0, 3).forEach(s => {
                            const safeTitle = (s.title || '').replace(/'/g, "\\'");
                            const safeDesc = (s.description || '').replace(/'/g, "\\'");
                            const safePrice = (s.price || '').replace(/'/g, "\\'");
                            const safeImg = (s.image || '').replace(/'/g, "\\'");
                            popHtml += `
                                <div class="service-card" onclick="openModal('${safeTitle}', '${safeDesc}', '${safePrice}', '${safeImg}')">
                                    <img src="${s.image}" class="card-img" alt="${s.title}">
                                    <div class="card-info"><h3>${s.title}</h3><p>${s.category}</p></div>
                                </div>
                            `;
                        });
                        popContainer.innerHTML = popHtml;
                    }
                }

                // --- Staff Carousel ---
                const staffContainer = document.getElementById('staffTrackContainer');
                if(staffContainer) {
                    if(staffData.length === 0) {
                        staffContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #aaa;">No experts added yet.</p>`;
                        window.totalStaff = 0;
                    } else {
                        let staffHtml = '';
                        staffData.forEach(s => {
                            const safeName = (s.name || '').replace(/'/g, "\\'");
                            const safeBio = (s.bio || '').replace(/'/g, "\\'");
                            const safeImg = (s.image || '').replace(/'/g, "\\'");
                            staffHtml += `
                                <div class="staff-card" onclick="openStaffModal('${safeName}', '${safeBio}', '${safeImg}')">
                                    <img src="${s.image}" class="staff-img" alt="${s.name}">
                                    <div class="staff-info"><h3>${s.name}</h3><p>${s.role}</p></div>
                                </div>
                            `;
                        });
                        staffContainer.innerHTML = staffHtml;
                        window.totalStaff = staffData.length;
                    }
                }

                // --- Booking Dropdowns ---
                const cService = document.getElementById('c_service');
                if(cService) {
                    // Start filling below the default 'Select Your Service' option
                    servicesData.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.title;
                        opt.textContent = `${s.title} - ${s.price}`;
                        cService.appendChild(opt);
                    });
                }

                const cStaff = document.getElementById('c_staff');
                if(cStaff) {
                    staffData.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.name;
                        opt.textContent = `${s.name} (${s.role})`;
                        cStaff.appendChild(opt);
                    });
                }

                // --- Pricing Menu ---
                const pricingContainer = document.getElementById('pricingRowsContainer');
                if(pricingContainer) {
                    if(servicesData.length === 0) {
                        pricingContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #aaa;">No pricing data available.</p>`;
                    } else {
                        let pHtml = '';
                        servicesData.forEach(s => {
                            const catClass = (s.category || 'hair').toLowerCase();
                            pHtml += `
                            <div class="price-row ${catClass}">
                                <div class="price-name">
                                    <h4>${s.title}</h4>
                                    <span>${(s.description || '').substring(0, 40)}...</span>
                                </div>
                                <div class="price-cost">${s.price}</div>
                            </div>
                            `;
                        });
                        pricingContainer.innerHTML = pHtml;
                    }
                }

                // --- Client Love Feedbacks ---
                const reviewsContainer = document.getElementById('reviewsContainer');
                if(reviewsContainer) {
                    const approvedFeedbacks = allFeedbacks.filter(f => f.approved === true);
                    
                    if(approvedFeedbacks.length === 0) {
                        reviewsContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #aaa; margin-bottom:0;">No client reviews to display yet.</p>`;
                    } else {
                        // Sort newest first
                        approvedFeedbacks.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));

                        let rHtml = `<div class="carousel-btn prev" onclick="moveSlide(-1)"><i class="fas fa-chevron-left"></i></div>`;
                        
                        approvedFeedbacks.forEach((f, idx) => {
                            const activeCls = idx === 0 ? "active" : "";
                            const safeComment = (f.comment || "").replace(/"/g, '&quot;');
                            const rNum = f.rating || 5;
                            const emptyStar = 5 - rNum;
                            rHtml += `
                            <div class="review-card ${activeCls}">
                                <i class="fas fa-quote-left"></i>
                                <p class="review-text">"${safeComment}"</p>
                                <div class="client-info">
                                    <h4>${f.customerName || 'Anonymous'}</h4>
                                    <span style="display:flex; justify-content:center; gap:5px; margin-top:5px; color:var(--neon-pink);">
                                        ${'<i class="fas fa-star"></i>'.repeat(rNum)}${'<i class="far fa-star"></i>'.repeat(emptyStar)}
                                    </span>
                                </div>
                            </div>
                            `;
                        });
                        
                        rHtml += `<div class="carousel-btn next" onclick="moveSlide(1)"><i class="fas fa-chevron-right"></i></div>`;
                        reviewsContainer.innerHTML = rHtml;
                        window.currentSlide = 0;
                    }
                }

            } catch (err) {
                console.error("Error loading frontend data:", err);
                // Clear loading spinners if permission fails
                const errHtml = `<p style='text-align:center; width:100%; color:#ff3399;'>Failed to load data. Please check Firestore Security Rules.</p>`;
                const p = document.getElementById('popularServicesContainer');
                const s = document.getElementById('staffTrackContainer');
                const r = document.getElementById('reviewsContainer');
                if(p) p.innerHTML = errHtml;
                if(s) s.innerHTML = errHtml;
                if(r) r.innerHTML = errHtml;
            }
        }
        
        // Trigger Front-end Hydration
        document.addEventListener('DOMContentLoaded', loadFrontendData);
