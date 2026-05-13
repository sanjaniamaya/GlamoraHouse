import { auth, db, onAuthStateChanged, doc, getDoc, collection, getDocs } from './firebase-config.js';

        // 1. BACKEND: CHECK LOGIN STATUS
        onAuthStateChanged(auth, async (user) => {
            const loginBtns = document.querySelectorAll('.btn-login');
            if (user) {
                let displayName = "Member";
                try {
                    const docSnap = await getDoc(doc(db, "users", user.uid));
                    if (docSnap.exists()) displayName = docSnap.data().fullName.split(' ')[0];
                } catch (e) { console.error(e); }

                loginBtns.forEach(btn => {
                    btn.href = "profile.html";
                    btn.style.display = "flex"; btn.style.alignItems = "center"; btn.style.gap = "6px"; btn.style.padding = "5px 20px"; btn.style.border = "1px solid #bd00ff";

                    btn.innerHTML = `<img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover; border: 1px solid #bd00ff;"> <span>${displayName}</span>`;
                });
                
            }
        });

        

        // 2. UI LOGIC - TOGGLE MENU & HIDE HAMBURGER
        const navLinks = document.getElementById('navLinks');
        const menuToggle = document.querySelector('.menu-toggle');
        const closeMenu = document.querySelector('.close-menu');

        window.toggleMenu = function() {
            const isActive = navLinks.classList.toggle('active');
            // Hide hamburger when menu is open to prevent overlap
            if (isActive) {
                menuToggle.classList.add('hide');
            } else {
                menuToggle.classList.remove('hide');
            }
        }

        if(menuToggle) menuToggle.addEventListener('click', window.toggleMenu);
        if(closeMenu) closeMenu.addEventListener('click', window.toggleMenu);

        // Modal Functions
        window.openModal = function(title, desc, price, img) {
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDesc').innerText = desc;
            document.getElementById('modalPrice').innerText = price;
            document.getElementById('modalImg').src = img;
            document.getElementById('serviceModal').classList.add('active');
        }
        window.closeModal = function(event) { if (event.target === document.getElementById('serviceModal')) { document.getElementById('serviceModal').classList.remove('active'); } }
        window.closeModalBtn = function() { document.getElementById('serviceModal').classList.remove('active'); }

        // Navbar Scroll
        let lastScrollTop = 0; const navbar = document.getElementById("navbar");
        window.addEventListener("scroll", function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop < 0) scrollTop = 0;
            if (scrollTop <= 0) { navbar.classList.remove("nav-hidden"); }
            else if (scrollTop > lastScrollTop) { navbar.classList.add("nav-hidden"); } 
            else { navbar.classList.remove("nav-hidden"); }
            lastScrollTop = scrollTop;
        });

        // 4. LOAD SERVICES FROM FIREBASE
        async function loadServices() {
            const container = document.getElementById('servicesContainer');
            if (!container) return;

            try {
                const querySnapshot = await getDocs(collection(db, "services"));
                if(querySnapshot.empty) {
                    container.innerHTML = `<p style="text-align: center; width: 100%; color: #aaa; padding: 50px;">No services have been added by the admin yet.</p>`;
                    return;
                }

                let html = '';
                querySnapshot.forEach((doc) => {
                    const s = doc.data();
                    const safeTitle = (s.title || '').replace(/'/g, "\\'");
                    const safeDesc = (s.description || '').replace(/'/g, "\\'");
                    const safePrice = (s.price || '').replace(/'/g, "\\'");
                    const safeImg = (s.image || '').replace(/'/g, "\\'");

                    html += `
                        <div class="service-card" onclick="openModal('${safeTitle}', '${safeDesc}', '${safePrice}', '${safeImg}')">
                            <img src="${s.image}" class="card-img" alt="${s.title}">
                            <div class="card-info">
                                <h3>${s.title}</h3>
                                <p>${s.category}</p>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } catch (error) {
                console.error("Error loading services:", error);
                container.innerHTML = `<p style="text-align: center; width: 100%; color: #ff007f;">Error loading services. Please try again later.</p>`;
            }
        }

        document.addEventListener('DOMContentLoaded', loadServices);
