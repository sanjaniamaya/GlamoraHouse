import { auth, db, signOut, onAuthStateChanged, doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from './firebase-config.js';

        let currentUserUid = null;
        let userDocRef = null;

        // 1. CHECK LOGIN & FETCH PROFILE + BOOKINGS
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (user.email === "admin@glamorahouse.lk") {
                    await signOut(auth); // Clear legacy contaminated token
                    window.location.href = "admin.html";
                    return;
                }

                currentUserUid = user.uid;
                userDocRef = doc(db, "users", user.uid);
                
                // --- A. GET PROFILE DATA ---
                try {
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        document.getElementById('display-name').innerText = data.fullName || "Valued Member";
                        document.getElementById('p_name').value = data.fullName || "";
                        document.getElementById('p_email').value = user.email;
                        document.getElementById('p_phone').value = data.phone || "";
                    } else {
                        // Fallback for Google Users with no DB entry yet
                        document.getElementById('display-name').innerText = user.displayName || "Member";
                        document.getElementById('p_name').value = user.displayName || "";
                        document.getElementById('p_email').value = user.email;
                    }
                } catch (error) { console.error("Error fetching profile:", error); }

                // --- B. GET BOOKINGS & FEEDBACKS ---
                fetchBookings(user.uid);
                fetchUserFeedbacks(user.uid);

            } else {
                window.location.href = "login.html";
            }
        });

        // 2. FETCH BOOKINGS FUNCTION
        async function fetchBookings(uid) {
            const list = document.getElementById('booking-list');
            list.innerHTML = ""; // Clear loader

            try {
                // Query: Select * from bookings where userId == uid
                const q = query(
                    collection(db, "bookings"), 
                    where("userId", "==", uid),
                    orderBy("createdAt", "desc") // Show newest first
                );

                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    list.innerHTML = `<p style="color:#777; text-align:center;">No bookings found. <a href="index.html#contact" style="color:var(--neon-pink)">Book now!</a></p>`;
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const b = doc.data();
                    // Format status class
                    let statusClass = "status-pending";
                    let feedbackBtn = "";
                    if (b.status === "Completed") {
                        statusClass = "status-completed";
                        feedbackBtn = `<button class="btn-feedback" onclick="openFeedbackModal('${doc.id}', '${b.service}', '${b.staff}')" style="margin-top: 10px; padding: 5px 15px; border-radius: 20px; background: var(--gradient-text); border: none; color: white; cursor: pointer; font-size: 0.8rem;">Leave Feedback</button>`;
                    }
                    if (b.status === "Upcoming") statusClass = "status-upcoming";

                    const html = `
                        <div class="booking-item">
                            <div class="b-info">
                                <h4>${b.service} <span style="font-size:0.8rem; font-weight:normal; color:#777;">with ${b.staff}</span></h4>
                                <p><i class="far fa-calendar-alt"></i> ${b.date} &nbsp;|&nbsp; <i class="far fa-clock"></i> ${b.time}</p>
                                <p style="font-size:0.8rem; color:#666;">Note: ${b.notes || "None"}</p>
                                ${feedbackBtn}
                            </div>
                            <div class="b-status ${statusClass}">${b.status}</div>
                        </div>
                    `;
                    list.innerHTML += html;
                });

            } catch (error) {
                console.error("Error fetching bookings:", error);
                if(error.message.includes("requires an index")) {
                    list.innerHTML = `<p style="color:orange;">Setup Required: Check Console for Firebase Index Link</p>`;
                } else {
                    list.innerHTML = `<p style="color:red;">Error loading bookings.</p>`;
                }
            }
        }

        // 2.5 FETCH USER FEEDBACKS
        async function fetchUserFeedbacks(uid) {
            const list = document.getElementById('feedback-list');
            list.innerHTML = ""; 

            try {
                // Fetch without orderBy to prevent Firebase Composite Index requirement
                const q = query(
                    collection(db, "feedbacks"), 
                    where("userId", "==", uid)
                );

                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    list.innerHTML = `<p style="color:#777; text-align:center;">No feedbacks submitted yet.</p>`;
                    return;
                }

                let feedbacksList = [];
                querySnapshot.forEach((doc) => feedbacksList.push(doc.data()));

                // Sort descending in memory
                feedbacksList.sort((a, b) => {
                    const timeA = a.createdAt ? a.createdAt.seconds : 0;
                    const timeB = b.createdAt ? b.createdAt.seconds : 0;
                    return timeB - timeA;
                });

                feedbacksList.forEach((f) => {
                    let stars = '';
                    for(let i=0; i<5; i++) {
                        stars += `<i class="fa${i<f.rating ? 's' : 'r'} fa-star" style="color:var(--neon-pink)"></i>`;
                    }
                    const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString() : 'Recent';

                    const html = `
                        <div class="booking-item" style="border-left: 3px solid var(--neon-pink);">
                            <div class="b-info" style="width: 100%;">
                                <h4>${f.service} <span style="font-size:0.8rem; font-weight:normal; color:#777;">with ${f.staff}</span></h4>
                                <p style="margin-top: 5px;">${stars} <span style="color:#aaa; font-size:0.8rem; margin-left: 10px;">${date}</span></p>
                                <p style="font-size:0.95rem; color:#fff; margin-top: 10px; font-style: italic;">"${f.comment}"</p>
                            </div>
                        </div>
                    `;
                    list.innerHTML += html;
                });
            } catch (error) {
                console.error("Error fetching feedbacks:", error);
                list.innerHTML = `<p style="color:red;">Error loading feedbacks.</p>`;
            }
        }

        // 3. EDIT PROFILE LOGIC
        window.enableEdit = function() {
            const inputs = document.querySelectorAll('.profile-input');
            inputs.forEach(input => {
                if (input.id !== 'p_email') input.removeAttribute('disabled');
            });
            document.getElementById('editBtn').style.display = 'none';
            document.getElementById('saveBtn').style.display = 'block';
            document.getElementById('p_name').focus();
        };

        window.saveProfile = async function() {
            const btn = document.getElementById('saveBtn');
            btn.innerText = "Saving...";
            
            const newName = document.getElementById('p_name').value;
            const newPhone = document.getElementById('p_phone').value;

            try {
                await updateDoc(userDocRef, {
                    fullName: newName,
                    phone: newPhone
                });
                document.getElementById('display-name').innerText = newName;
                alert("Profile Updated Successfully!");
                
                // Reset UI
                const inputs = document.querySelectorAll('.profile-input');
                inputs.forEach(input => input.setAttribute('disabled', 'true'));
                document.getElementById('editBtn').style.display = 'block';
                btn.style.display = 'none';
                btn.innerText = "Save Changes";

            } catch (error) {
                console.error("Error saving profile:", error);
                alert("Could not save changes. Check console.");
                btn.innerText = "Save Changes";
            }
        };

        // 4. LOGOUT LOGIC
        document.querySelectorAll('.logout-link').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if(confirm("Are you sure you want to log out?")) {
                    signOut(auth).then(() => {
                        window.location.href = "login.html";
                    }).catch((error) => console.error("Logout Error:", error));
                }
            });
        });

        // 5. FEEDBACK LOGIC
        window.openFeedbackModal = function(bookingId, service, staff) {
            document.getElementById('f_bookingId').value = bookingId;
            document.getElementById('f_service').value = service;
            document.getElementById('f_staff').value = staff;
            document.getElementById('feedbackModal').classList.add('active');
        }

        window.closeFeedbackModalCtx = function(event) {
            if (event.target === document.getElementById('feedbackModal')) {
                document.getElementById('feedbackModal').classList.remove('active');
            }
        }
        
        window.closeFeedbackModalBtn = function() {
            document.getElementById('feedbackModal').classList.remove('active');
        }

        window.submitFeedback = async function() {
            const btn = document.getElementById('submitFeedbackBtn');
            const rating = document.getElementById('f_rating').value;
            const comment = document.getElementById('f_comment').value;

            if(!rating || !comment) {
                alert("Please provide both rating and comment.");
                return;
            }

            btn.innerText = "Submitting...";
            btn.disabled = true;

            const feedbackData = {
                userId: currentUserUid,
                customerName: document.getElementById('display-name').innerText,
                bookingId: document.getElementById('f_bookingId').value,
                service: document.getElementById('f_service').value,
                staff: document.getElementById('f_staff').value,
                rating: parseInt(rating),
                comment: comment,
                createdAt: serverTimestamp(),
                approved: false
            };

            try {
                await addDoc(collection(db, "feedbacks"), feedbackData);
                alert("Thank you for your feedback!");
                document.getElementById('feedbackForm').reset();
                window.closeFeedbackModalBtn();
            } catch (error) {
                console.error("Error submitting feedback:", error);
                alert("Failed to submit feedback.");
            }
            
            btn.innerText = "Submit Feedback";
            btn.disabled = false;
        }

        // 6. UI UTILS
        window.toggleMenu = function() { document.getElementById('navLinks').classList.toggle('active'); }
        
        let lastScrollTop = 0; const navbar = document.getElementById("navbar");
        window.addEventListener("scroll", function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop) { navbar.classList.add("nav-hidden"); } 
            else { navbar.classList.remove("nav-hidden"); }
            lastScrollTop = scrollTop;
        });
