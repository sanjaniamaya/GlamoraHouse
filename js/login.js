import { auth, db, adminAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, doc, setDoc, getDoc } from './firebase-config.js';

        const provider = new GoogleAuthProvider();

        // 1. EMAIL LOGIN
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-pass').value;
            const btn = document.querySelector('.btn-full');
            const originalText = btn.innerText;

            btn.innerText = "Checking...";
            btn.style.opacity = "0.7";

            if (email === "admin@glamorahouse.lk" && password === "admin@123") {
                signInWithEmailAndPassword(adminAuth, email, password)
                    .then(() => {
                        sessionStorage.setItem("adminLoggedIn", "true");
                        window.location.href = "admin.html";
                    })
                    .catch(async (err) => {
                        console.error("Admin Auth Error:", err);
                        // If account does not exist, create it to ensure Fireabse Auth session is established
                        try {
                            const { createUserWithEmailAndPassword } = await import('./firebase-config.js');
                            await createUserWithEmailAndPassword(adminAuth, email, password);
                            sessionStorage.setItem("adminLoggedIn", "true");
                            window.location.href = "admin.html";
                        } catch (creationErr) {
                            console.error("Failed to create admin:", creationErr);
                            alert("Firebase Error: " + creationErr.message + "\n\nPlease ensure your Firebase Console has Email/Password authentication enabled!");
                            btn.innerText = originalText;
                            btn.style.opacity = "1";
                        }
                    });
                return;
            }

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    if (userCredential.user.email === "admin@glamorahouse.lk") {
                        window.location.href = "admin.html";
                    } else {
                        window.location.href = "profile.html"; 
                    }
                })
                .catch((error) => {
                    console.error("Login Error:", error);
                    let msg = "Login Failed.";
                    if(error.code === "auth/user-not-found") msg = "No account found.";
                    if(error.code === "auth/wrong-password") msg = "Incorrect password.";
                    if(error.code === "auth/invalid-credential") msg = "Invalid Credentials.";
                    alert("❌ " + msg);
                    btn.innerText = originalText;
                    btn.style.opacity = "1";
                });
        });

        // 2. GOOGLE LOGIN
        document.getElementById('googleBtn').addEventListener('click', async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                // Check if user document exists in Firestore
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                // If new user, create their profile document
                if (!docSnap.exists()) {
                    await setDoc(docRef, {
                        fullName: user.displayName,
                        email: user.email,
                        phone: "",
                        createdAt: new Date()
                    });
                }

                window.location.href = "index.html"; // Success Redirect

            } catch (error) {
                console.error("Google Login Error:", error);
                alert("Google Login Failed: " + error.message);
            }
        });

        // 3. UI Helpers
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

        window.toggleMenu = function() { document.getElementById('navLinks').classList.toggle('active'); }
