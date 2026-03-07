document.addEventListener("DOMContentLoaded", function() {
    
    // --- 0. SECURITY CHECK: Is user logged in? ---
    if (localStorage.getItem('crm_auth') !== 'true') {
        window.location.href = 'login.html'; // Login aagala na veliya anuppidu
        return; 
    }

    // --- 1. Toast Notification System ---
    const toast = document.getElementById('custom-toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('.toast-icon-wrapper i');
    let toastTimer;

    function showToast(title, msg, iconClass = 'ph-info', color = '#FFD166') {
        clearTimeout(toastTimer);
        toastTitle.textContent = title;
        toastMessage.textContent = msg;
        toastIcon.className = `ph-fill ${iconClass}`;
        toast.querySelector('.toast-icon-wrapper').style.background = color;
        
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('show'), 10);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 400);
        }, 3000);
    }

    document.getElementById('btn-settings').addEventListener('click', () => showToast('Settings', 'Opening system preferences...', 'ph-gear', '#8E8E93'));
    document.getElementById('btn-help').addEventListener('click', () => showToast('Help Center', 'Connecting to support...', 'ph-question', '#4EA8DE'));
    document.getElementById('btn-bell').addEventListener('click', () => showToast('Notifications', 'You have 3 new alerts.', 'ph-bell-ringing', '#FF8A9C'));
    document.getElementById('btn-view-all').addEventListener('click', (e) => { e.preventDefault(); showToast('Activity Log', 'Loading full history...', 'ph-clock-counter-clockwise', '#65A30D');});

    // Logout Button Logic Updated
    document.getElementById('logout-btn').addEventListener('click', () => {
        showToast('Logging out', 'See you soon, Shanthini!', 'ph-sign-out', '#EF4444');
        setTimeout(() => {
            localStorage.removeItem('crm_auth'); // Session-a azhikkurom
            window.location.href = 'login.html'; // Login page-kku porom
        }, 1500);
    });

    const navLinks = document.querySelectorAll('.nav-btn');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
            this.parentElement.classList.add('active');
            showToast('Navigation', `Switching to ${this.innerText.trim()} dashboard...`, 'ph-rocket-launch', '#FFCF69');
        });
    });

    // --- 2. 3D Hover Effect ---
    const cards3D = document.querySelectorAll('.card-3d, .card-3d-wrapper');
    cards3D.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;  
            const centerX = rect.width / 2; const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10; 
            const rotateY = ((x - centerX) / centerX) * 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        card.addEventListener('mouseleave', () => card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
    });

    // --- 3. REAL DATABASE INTEGRATION (With Delete Feature & Live URLs) ---
    const leadsBody = document.getElementById('leads-body');
    const activitiesList = document.getElementById('recent-activities-list');
    const addModal = document.getElementById('add-modal');
    const updateModal = document.getElementById('update-modal');
    const addForm = document.getElementById('add-lead-form');
    const updateForm = document.getElementById('update-form');
    
    let leadsData = []; 
    let leadToUpdateId = null; 

    // URL Updated to '/api/leads'
    async function fetchLeads() {
        try {
            const response = await fetch('/api/leads'); // <-- LIVE URL UPDATE
            leadsData = await response.json();
            renderTable();
            updateStats();
            renderActivities();
        } catch (error) {
            showToast('Database Error', 'Make sure Node.js server is running!', 'ph-warning-circle', '#EF4444');
        }
    }

    function updateStats() {
        const totalVal = leadsData.length * 1500;
        const contactedCount = leadsData.filter(l => l.status === 'Contacted').length;
        const newCount = leadsData.filter(l => l.status === 'New').length;
        
        document.querySelector('.card:nth-child(1) .card-value').textContent = `$${totalVal.toLocaleString()}.00`;
        document.querySelector('.card:nth-child(2) .card-value').textContent = `$${(contactedCount * 1500).toLocaleString()}.00`;
        document.querySelector('.card:nth-child(3) .card-value').textContent = `$${(newCount * 1500).toLocaleString()}.00`;
    }

    function renderActivities() {
        activitiesList.innerHTML = ''; 
        if (leadsData.length === 0) {
            activitiesList.innerHTML = '<li class="empty-state" style="text-align: center; color: #8E8E93; font-style: italic; padding-top: 20px;">No recent activities. Add a lead!</li>';
            return;
        }
        const recentLeads = leadsData.slice(0, 4);
        recentLeads.forEach(lead => {
            let actionText = lead.status === 'New' ? 'New Lead' : lead.status;
            let colorClass = lead.status === 'New' ? 'text-pink' : (lead.status === 'Converted' ? 'text-green' : 'text-blue');
            const dateString = new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

            const li = document.createElement('li');
            li.className = 'hover-gradient-row';
            li.innerHTML = `
                <div class="recent-user">
                    <img src="https://ui-avatars.com/api/?name=${lead.name.replace(/ /g, '+')}&background=random" class="mini-avatar avatar-3d"> 
                    ${lead.name}
                </div>
                <div class="recent-date" style="color: #8E8E93; font-size: 12px;">${dateString}</div>
                <div class="recent-action text-bold ${colorClass}">- ${actionText}</div>
            `;
            activitiesList.appendChild(li);
        });
    }

    function renderTable() {
        leadsBody.innerHTML = '';
        leadsData.forEach(lead => {
            let statusBadge = lead.status === 'New' ? '<span class="status-badge status-new">New</span>' : 
                              lead.status === 'Contacted' ? '<span class="status-badge status-contacted">Contacted</span>' : 
                              '<span class="status-badge status-converted">Converted</span>';
            let iconClass = lead.source.includes('LinkedIn') ? 'ph-linkedin-logo' : lead.source.includes('Referral') ? 'ph-users' : 'ph-globe';
            const formattedDate = new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            const row = document.createElement('tr');
            row.className = 'table-row hover-table-row';
            row.innerHTML = `
                <td class="text-muted">#LD-${lead.id}</td>
                <td>
                    <div class="table-user"><img src="https://ui-avatars.com/api/?name=${lead.name.replace(/ /g, '+')}&background=random" class="mini-avatar avatar-3d">
                        <div><div class="user-name">${lead.name}</div><div class="user-role">${lead.email}</div></div>
                    </div>
                </td>
                <td>${formattedDate}</td>
                <td class="text-bold"><i class="ph ${iconClass} 3d-icon"></i> ${lead.source}</td>
                <td class="text-bold">$1,500.00</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="action-pill update-btn yellow-pill" data-id="${lead.id}">Review</button>
                        <button class="action-pill delete-btn" data-id="${lead.id}" style="padding: 8px 12px; color: #EF4444; border-color: #FECACA; background: #FFF5F5;" title="Delete Lead">
                            <i class="ph ph-trash" style="font-size: 16px;"></i>
                        </button>
                    </div>
                </td>
            `;
            leadsBody.appendChild(row);
        });

        attachTableEvents();
    }

    function attachTableEvents() {
        // Update Button Event
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                leadToUpdateId = parseInt(this.getAttribute('data-id'));
                const lead = leadsData.find(l => l.id === leadToUpdateId);
                if (lead) {
                    document.getElementById('lead-status').value = lead.status;
                    document.getElementById('lead-notes').value = lead.notes || "";
                    updateModal.classList.remove('hidden');
                    setTimeout(() => updateModal.querySelector('.modal-content').style.transform = 'translateZ(50px) scale(1)', 10);
                }
            });
        });

        // DELETE Button Event
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const leadId = this.getAttribute('data-id');
                const confirmDelete = window.confirm("Are you sure you want to delete this lead? This action cannot be undone.");
                
                if (confirmDelete) {
                    try {
                        await fetch(`/api/leads/${leadId}`, { // <-- LIVE URL UPDATE
                            method: 'DELETE'
                        });
                        fetchLeads(); 
                        showToast('Deleted', 'Lead removed from database.', 'ph-trash', '#EF4444');
                    } catch (error) {
                        showToast('Error', 'Failed to delete lead.', 'ph-warning-circle', '#EF4444');
                    }
                }
            });
        });
    }

    // POST: Add Lead
    addForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const newLead = {
            name: document.getElementById('add-name').value,
            email: document.getElementById('add-email').value,
            source: document.getElementById('add-source').value
        };

        try {
            await fetch('/api/leads', { // <-- LIVE URL UPDATE
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newLead)
            });
            fetchLeads(); addForm.reset(); closeModals();
            showToast('Success!', 'New lead saved to database.', 'ph-database', '#65A30D');
        } catch (error) {
            showToast('Error', 'Failed to save lead.', 'ph-warning-circle', '#EF4444');
        }
    });

    // PUT: Update Lead
    updateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const updatedData = {
            status: document.getElementById('lead-status').value,
            notes: document.getElementById('lead-notes').value
        };

        try {
            await fetch(`/api/leads/${leadToUpdateId}`, { // <-- LIVE URL UPDATE
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData)
            });
            fetchLeads(); closeModals();
            showToast('Updated!', 'Lead status updated in database.', 'ph-check-circle', '#4EA8DE');
        } catch (error) {
            showToast('Error', 'Failed to update lead.', 'ph-warning-circle', '#EF4444');
        }
    });

    function closeModals() {
        document.querySelectorAll('.modal-content').forEach(m => m.style.transform = 'translateZ(0) scale(0.95)');
        setTimeout(() => { addModal.classList.add('hidden'); updateModal.classList.add('hidden'); }, 200);
    }

    document.querySelectorAll('.close-x').forEach(btn => btn.addEventListener('click', closeModals));
    document.getElementById('add-lead-main').addEventListener('click', () => {
        addModal.classList.remove('hidden');
        setTimeout(() => addModal.querySelector('.modal-content').style.transform = 'translateZ(50px) scale(1)', 10);
    });

    fetchLeads();
});