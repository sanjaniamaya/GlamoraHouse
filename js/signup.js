// Password Toggle Function
        window.togglePassword = function(id, icon) {
            const input = document.getElementById(id);
            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
                icon.style.color = "#bd00ff";
            } else {
                input.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
                icon.style.color = "#aaa";
            }
        }

        // Menu Toggle
        window.toggleMenu = function() { document.getElementById('navLinks').classList.toggle('active'); }
        const menuToggle = document.querySelector('.menu-toggle');
        if(menuToggle) menuToggle.addEventListener('click', window.toggleMenu);
        const closeMenu = document.querySelector('.close-menu');
        if(closeMenu) closeMenu.addEventListener('click', window.toggleMenu);
    




        
        console.log("Script loaded!"); 

        import { auth, db, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, doc, setDoc, getDoc } from './firebase-config.js';

        const provider = new GoogleAuthProvider();

        // 1. Email Sign Up
        const form = document.querySelector('.auth-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const fullName = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const phone = document.getElementById('phone').value;
                const password = document.getElementById('pass').value;
                const confirmPass = document.getElementById('confirmPass').value;
                const btn = document.querySelector('.btn-full');

                if(password !== confirmPass) {
                    alert("Passwords do not match!");
                    return;
                }

                btn.innerText = "Processing...";

                try {
                    // Create User
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;

                    // Save to Database
                    await setDoc(doc(db, "users", user.uid), {
                        fullName: fullName,
                        email: email,
                        phone: phone,
                        createdAt: new Date()
                    });

                    alert("✅ ACCOUNT CREATED SUCCESSFULLY!");
                    window.location.href = "profile.html";

                } catch (error) {
                    console.error("FULL ERROR:", error);
                    alert("❌ FAILED AT: " + error.code + "\nMessage: " + error.message);
                    btn.innerText = "Create Account";
                }
            });
        }

        // 2. Google Sign Up Logic
        const googleBtn = document.querySelector('.btn-google');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                try {
                    const result = await signInWithPopup(auth, provider);
                    const user = result.user;

                    // Check if user exists in database, if not, save them
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (!docSnap.exists()) {
                        await setDoc(docRef, {
                            fullName: user.displayName,
                            email: user.email,
                            phone: "", // Google doesn't provide phone
                            createdAt: new Date()
                        });
                    }

                    alert("✅ Google Sign-Up Successful!");
                    window.location.href = "profile.html";

                } catch (error) {
                    console.error("Google Signup Error:", error);
                    alert("❌ Google Sign-Up Failed: " + error.message);
                }
            });
        }
