import { adminAuth as auth, adminDb as db, onAuthStateChanged, signOut, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from './firebase-config.js';

// Global Data Trackers
let usersData = [];
let staffData = [];
let servicesData = [];
let bookingsData = [];
let feedbacksData = [];

// 1. Auth Check & Redirect
let authInitialized = false;
onAuthStateChanged(auth, async (user) => {
    // Allow E2E testing bypass
    if (sessionStorage.getItem("adminLoggedIn") === "true") {
        if (!authInitialized) {
            authInitialized = true;
            loadDashboardData();
        }
        return;
    }

    if (user && user.email === "admin@glamorahouse.lk") {
        sessionStorage.setItem("adminLoggedIn", "true");
        if (!authInitialized) {
            authInitialized = true;
            loadDashboardData();
        }
    } else {
        sessionStorage.removeItem("adminLoggedIn");
        window.location.href = "login.html";
    }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("adminLoggedIn");
    signOut(auth).then(() => window.location.href = "login.html").catch(() => window.location.href = "login.html");
});

    // Modals
    const staffModal = new bootstrap.Modal(document.getElementById('staffModal'));
    const serviceModal = new bootstrap.Modal(document.getElementById('serviceModal'));

    // Loading State Utils
    function toggleLoader(show) {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = show ? 'block' : 'none';
    }

    // --- MAIN EXPORTED LOADER ---
    async function loadDashboardData() {
        toggleLoader(true);
        try {
            await Promise.all([
                fetchUsers(),
                fetchStaff(),
                fetchServices(),
                fetchBookings(),
                fetchFeedbacks()
            ]);
            updateDashboardCounts();
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            alert("Failed to load data from Firebase! Error: " + error.message + "\n\nIf this says 'Missing or insufficient permissions', please ensure you are logged into the admin account correctly, or check your Firestore Security Rules.");
        }
        toggleLoader(false);
    }

    // --- FETCH FUNCTIONS ---
    async function fetchUsers() {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsers();
    }

    async function fetchStaff() {
        const q = query(collection(db, "staff"));
        const snapshot = await getDocs(q);
        staffData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderStaff();
    }

    async function fetchServices() {
        const q = query(collection(db, "services"));
        const snapshot = await getDocs(q);
        servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderServices();
    }

    async function fetchBookings() {
        const q = query(collection(db, "bookings"));
        const snapshot = await getDocs(q);
        bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort in memory to avoid index requirements
        bookingsData.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        renderAppointments();
    }

    async function fetchFeedbacks() {
        const q = query(collection(db, "feedbacks"));
        const snapshot = await getDocs(q);
        feedbacksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in memory to avoid index requirements
        feedbacksData.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        renderFeedbacks();
    }

    function updateDashboardCounts() {
        document.getElementById("count-users").innerText = usersData.length;
        document.getElementById("count-staff").innerText = staffData.length;
        document.getElementById("count-services").innerText = servicesData.length;

        // NEW: Analytics
        updateDashboardAnalytics();
    }

    function updateDashboardAnalytics() {
        // 1. All Appointments Box
        const countBox = document.getElementById("total-appointments-right");
        if(countBox) countBox.innerText = bookingsData.length;

        // 2. Latest 5 Appointments
        const latest5 = bookingsData.slice(0, 5);
        const tbody = document.getElementById("tbl-recent-bookings");
        tbody.innerHTML = latest5.map(b => `
            <tr>
                <td>${b.date}</td>
                <td>${b.customerName || 'N/A'}</td>
                <td>${b.service || 'N/A'}</td>
                <td><span class="badge ${getStatusBadgeClass(b.status)}">${b.status}</span></td>
            </tr>
        `).join('');

        // 3. Render Chart
        renderChart();
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const numbers = priceStr.replace(/[^0-9]/g, '');
        return parseInt(numbers) || 0;
    }

    function getStatusBadgeClass(status) {
        switch(status) {
            case 'Completed': return 'bg-success text-light border border-success';
            case 'Confirmed': return 'bg-info text-dark border border-info';
            case 'Cancelled': return 'bg-danger text-light border border-danger';
            case 'Pending': return 'bg-warning text-dark border border-warning';
            default: return 'bg-secondary text-light';
        }
    }

    let myChart = null;
    function renderChart() {
        const canvas = document.getElementById('bookingsChart');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Data processing for Bar chart: Current Statuses
        let completeCount = bookingsData.filter(b => b.status === "Completed").length;
        let confirmCount = bookingsData.filter(b => b.status === "Confirmed").length;
        let cancelCount = bookingsData.filter(b => b.status === "Cancelled").length;
        let pendingCount = bookingsData.filter(b => b.status === "Pending").length;

        if (myChart) myChart.destroy();
        
        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Completed', 'Confirmed', 'Cancelled', 'Pending'],
                datasets: [{
                    label: 'Appointments',
                    data: [completeCount, confirmCount, cancelCount, pendingCount],
                    backgroundColor: [
                        'rgba(25, 135, 84, 0.8)',   // success
                        'rgba(13, 202, 240, 0.8)',  // info
                        'rgba(220, 53, 69, 0.8)',   // danger
                        'rgba(255, 193, 7, 0.8)'    // warning
                    ],
                    borderColor: [
                        '#198754',
                        '#0dcaf0',
                        '#dc3545',
                        '#ffc107'
                    ],
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0a0', stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: '#a0a0a0' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // --- RENDER FUNCTIONS ---
    function renderUsers() {
        const tbody = document.getElementById("tbl-users");
        tbody.innerHTML = usersData.map(u => `
            <tr>
                <td>${u.fullName || 'N/A'}</td>
                <td>${u.email || 'N/A'}</td>
                <td>${u.phone || 'N/A'}</td>
                <td class="text-muted" style="font-size: 0.8rem;">${u.id}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${u.id}', '${u.email}')"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `).join('');
    }

    window.deleteUser = async function(id, email) {
        if (email === "admin@glamorahouse.lk") {
            alert("Security: The Master Admin account cannot be deleted!");
            return;
        }
        if(confirm("Are you sure you want to delete this user? This will NOT delete their auth account, only their database profile.")) {
            await deleteDoc(doc(db, "users", id));
            await fetchUsers();
        }
    }

    window.editStaff = function(id) {
        const staff = staffData.find(s => s.id === id);
        if(staff) {
            document.getElementById("staffId").value = staff.id;
            document.getElementById("staffName").value = staff.name;
            document.getElementById("staffRole").value = staff.role;
            document.getElementById("staffBio").value = staff.bio;
            document.getElementById("staffImg").value = staff.image;
            document.getElementById("staffModalTitle").innerText = "Edit Staff";
            staffModal.show();
        }
    }

    window.deleteStaff = async function(id) {
        if(confirm("Are you sure you want to delete this staff member?")) {
            await deleteDoc(doc(db, "staff", id));
            await fetchStaff();
        }
    }

    function renderStaff() {
        const tbody = document.getElementById("tbl-staff");
        tbody.innerHTML = staffData.map(s => `
            <tr>
                <td><img src="${s.image}" class="admin-thumbnail"></td>
                <td>${s.name}</td>
                <td>${s.role}</td>
                <td>${s.bio.substring(0, 50)}...</td>
                <td>
                    <button class="btn btn-sm btn-outline-info me-2" onclick="editStaff('${s.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff('${s.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    window.editService = function(id) {
        const s = servicesData.find(s => s.id === id);
        if(s) {
            document.getElementById("serviceId").value = s.id;
            document.getElementById("serviceTitle").value = s.title;
            document.getElementById("serviceCategory").value = s.category;
            document.getElementById("servicePrice").value = s.price;
            document.getElementById("serviceDesc").value = s.description;
            document.getElementById("serviceImg").value = s.image;
            document.getElementById("serviceModalTitle").innerText = "Edit Service";
            serviceModal.show();
        }
    }

    window.deleteService = async function(id) {
        if(confirm("Are you sure you want to delete this service?")) {
            await deleteDoc(doc(db, "services", id));
            await fetchServices();
        }
    }

    function renderServices() {
        const tbody = document.getElementById("tbl-services");
        tbody.innerHTML = servicesData.map(s => `
            <tr>
                <td><img src="${s.image}" class="admin-thumbnail"></td>
                <td>${s.title}</td>
                <td><span class="badge bg-secondary">${s.category}</span></td>
                <td>${s.price}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info me-2" onclick="editService('${s.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteService('${s.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    window.changeStatus = async function(id, newStatus) {
        if(confirm(`Change booking status to ${newStatus}?`)) {
            await updateDoc(doc(db, "bookings", id), { status: newStatus });
            await fetchBookings();
        }
    }

    function renderAppointments() {
        const tbody = document.getElementById("tbl-appointments");
        tbody.innerHTML = bookingsData.map(b => {
        let badgeUrl = 'bg-warning text-dark';
            if (b.status === 'Completed') badgeUrl = 'bg-success text-light border border-success';
            if (b.status === 'Confirmed') badgeUrl = 'bg-info text-dark border border-info';
            if (b.status === 'Cancelled') badgeUrl = 'bg-danger text-light border border-danger';
            if (b.status === 'Pending') badgeUrl = 'bg-warning text-dark border border-warning';
            
            return `
            <tr>
                <td>${b.date}<br><small class="text-muted">${b.time}</small></td>
                <td>${b.customerName}<br><small class="text-muted">${b.phone}</small></td>
                <td>${b.service}</td>
                <td>${b.staff}</td>
                <td><span class="badge ${badgeUrl}">${b.status}</span></td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Action
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a class="dropdown-item" href="#" onclick="changeStatus('${b.id}', 'Pending')">Pending</a></li>
                            <li><a class="dropdown-item" href="#" onclick="changeStatus('${b.id}', 'Confirmed')">Confirm</a></li>
                            <li><a class="dropdown-item" href="#" onclick="changeStatus('${b.id}', 'Completed')">Complete</a></li>
                            <li><a class="dropdown-item" href="#" onclick="changeStatus('${b.id}', 'Cancelled')">Cancel</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteAppointment('${b.id}')"><i class="fas fa-trash-alt me-2"></i>Delete</a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    window.deleteAppointment = async function(id) {
        if(confirm("Are you sure you want to permanently delete this appointment record?")) {
            await deleteDoc(doc(db, "bookings", id));
            await fetchBookings();
        }
    }

    function renderFeedbacks() {
        const tbody = document.getElementById("tbl-feedbacks");
        if (!tbody) return;

        if (feedbacksData.length === 0) {
            tbody.innerHTML = "<tr><td colspan='7' class='text-center'>No feedbacks yet.</td></tr>";
            return;
        }

        tbody.innerHTML = feedbacksData.map(f => {
            const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            let stars = '';
            for(let i=0; i<5; i++) {
                stars += `<i class="fa${i<f.rating ? 's' : 'r'} fa-star" style="color:var(--neon-pink)"></i>`;
            }

            const isApproved = f.approved === true;
            const badgeCls = isApproved ? "bg-success" : "bg-warning text-dark";
            const badgeText = isApproved ? "Approved" : "Pending";
            
            const btnCls = isApproved ? "btn-outline-warning" : "btn-success";
            const btnIcon = isApproved ? "fa-eye-slash" : "fa-check";
            const btnTitle = isApproved ? "Hide from website" : "Approve for website";

            return `
            <tr>
                <td>${date}</td>
                <td>${f.customerName}</td>
                <td>${f.service} <br><small class="text-secondary">with ${f.staff || 'N/A'}</small></td>
                <td>${stars}</td>
                <td>${f.comment}</td>
                <td><span class="badge ${badgeCls}">${badgeText}</span></td>
                <td>
                    <button class="btn btn-sm ${btnCls}" title="${btnTitle}" onclick="toggleFeedbackApproval('${f.id}', ${isApproved})">
                        <i class="fas ${btnIcon}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-2" title="Delete" onclick="deleteFeedback('${f.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }

    // --- NEW: Toggle Approval ---
    window.toggleFeedbackApproval = async function(id, currentStatus) {
        try {
            await updateDoc(doc(db, "feedbacks", id), { approved: !currentStatus });
            fetchFeedbacks(); // Refresh
        } catch (error) {
            console.error("Error toggling status:", error);
            alert("Failed to update status.");
        }
    }

    window.deleteFeedback = async function(id) {
        if(confirm("Are you sure you want to delete this feedback?")) {
            try {
                await deleteDoc(doc(db, "feedbacks", id));
                fetchFeedbacks();
            } catch (error) {
                console.error("Err:", error);
            }
        }
    }

    // --- SAVE LOGIC ---
    document.getElementById("saveStaffBtn").addEventListener("click", async () => {
        const id = document.getElementById("staffId").value;
        const data = {
            name: document.getElementById("staffName").value,
            role: document.getElementById("staffRole").value,
            bio: document.getElementById("staffBio").value,
            image: document.getElementById("staffImg").value
        };
        
        const btn = document.getElementById("saveStaffBtn");
        btn.innerText = "Saving...";
        try {
            if(id) { await updateDoc(doc(db, "staff", id), data); } 
            else { await addDoc(collection(db, "staff"), data); }
            staffModal.hide();
            await fetchStaff();
        } catch(e) { console.error(e); alert("Failed to save staff"); }
        btn.innerText = "Save Staff";
    });

    document.getElementById("saveServiceBtn").addEventListener("click", async () => {
        const id = document.getElementById("serviceId").value;
        const data = {
            title: document.getElementById("serviceTitle").value,
            category: document.getElementById("serviceCategory").value,
            price: document.getElementById("servicePrice").value,
            description: document.getElementById("serviceDesc").value,
            image: document.getElementById("serviceImg").value
        };

        const btn = document.getElementById("saveServiceBtn");
        btn.innerText = "Saving...";
        try {
            if(id) { await updateDoc(doc(db, "services", id), data); } 
            else { await addDoc(collection(db, "services"), data); }
            serviceModal.hide();
            await fetchServices();
        } catch(e) { console.error(e); alert("Failed to save service"); }
        btn.innerText = "Save Service";
    });

    // Make window functions available for modals
    window.openStaffModal = function() {
        document.getElementById("staffForm").reset();
        document.getElementById("staffId").value = "";
        document.getElementById("staffModalTitle").innerText = "Add Staff";
        staffModal.show();
    }

    window.openServiceModal = function() {
        document.getElementById("serviceForm").reset();
        document.getElementById("serviceId").value = "";
        document.getElementById("serviceModalTitle").innerText = "Add Service";
        serviceModal.show();
    }
