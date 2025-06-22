class AdminDashboard {
    constructor() {
        this.users = [];
        this.stats = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAllData();
        this.setupSearch();
    }

    setupEventListeners() {
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    async loadAllData() {
        await Promise.all([
            this.loadDashboardData(),
            this.loadUsers()
        ]);
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=admin&action=dashboard_stats');
            const result = await response.json();

            if (result.success) {
                this.stats = result.data;
                this.updateDashboardStats();
            } else {
                this.showNotification('Error loading dashboard data', 'error');
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    updateDashboardStats() {
        document.getElementById('total-users').textContent = this.stats.total_users || 0;
        document.getElementById('total-datasets').textContent = this.stats.total_datasets || 0;
        document.getElementById('recent-users').textContent = this.stats.recent_users || 0;
        document.getElementById('admin-count').textContent = this.stats.users_by_role?.admin || 0;
    }

    async loadUsers() {
        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=admin&action=users');
            const result = await response.json();

            if (result.success) {
                this.users = result.data;
                this.displayUsers(this.users);
            } else {
                this.showNotification('Error loading users', 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            let date = new Date(dateString);
            if (isNaN(date.getTime())) {
                const oracleMatch = dateString.match(/(\d{2})-(\w{3})-(\d{2})/);
                if (oracleMatch) {
                    const months = {
                        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
                        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
                    };
                    const day = parseInt(oracleMatch[1]);
                    const month = months[oracleMatch[2].toUpperCase()];
                    const year = 2000 + parseInt(oracleMatch[3]);
                    date = new Date(year, month, day);
                }
            }
            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
        } catch (error) {
            console.warn('Date parsing error:', error, dateString);
            return 'N/A';
        }
    }

    displayUsers(users) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #6b7280; font-style: italic; padding: 2rem;">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            const username = escapeHTML(user.username || 'N/A');
            const email = escapeHTML(user.email || 'N/A');
            const role = escapeHTML(user.role || 'user');
            const datasets = user.total_datasets || 0;
            const joinDate = this.formatDate(user.created_at);

            row.innerHTML = `
                <td>
                    <div class="user-id">${user.id}</div>
                </td>
                <td>
                    <div class="user-details">
                        <div class="user-name">${username}</div>
                        <div class="user-email">${email}</div>
                    </div>
                </td>
                <td>
                    <span class="role-badge role-${role}">${role}</span>
                </td>
                <td style="font-weight: 600; color: #8a2be2;">
                    ${datasets}
                </td>
                <td style="color: #6b7280;">
                    ${joinDate}
                </td>
                <td>
                    <button class="action-btn btn-delete" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            const deleteBtn = row.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', () => {
                this.deleteUser(user.id, username);
            });

            tbody.appendChild(row);
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('users-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredUsers = this.users.filter(user => 
                    (user.username && user.username.toLowerCase().includes(searchTerm)) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm))
                );
                this.displayUsers(filteredUsers);
            });
        }
    }

    deleteUser(userId, username) {
        this.showConfirmModal(
            `Are you sure you want to delete user "${escapeHTML(username)}"? This action cannot be undone and will delete all their data.`,
            () => this.confirmDeleteUser(userId)
        );
    }

    async confirmDeleteUser(userId) {
        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=admin&action=delete_user', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('User deleted successfully', 'success');
                await this.loadUsers();
                await this.loadDashboardData();
            } else {
                this.showNotification(result.message || 'Error deleting user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Error deleting user', 'error');
        }

        this.closeConfirmModal();
    }

    showConfirmModal(message, onConfirm) {
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-action').onclick = onConfirm;
        const modal = document.getElementById('confirm-modal');
        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelectorAll('.notification');
        existing.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function closeConfirmModal() {
    if (window.admin) {
        window.admin.closeConfirmModal();
    }
}

async function logout() {
    try {
        const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=logout');
        const result = await response.json();

        if (result.success) {
            window.location.href = '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/index.php?page=login';
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/index.php?page=login';
    }
}

let admin;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    
    admin = new AdminDashboard();
    window.admin = admin;
});

(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideModals);
    } else {
        hideModals();
    }
    
    function hideModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }
})();