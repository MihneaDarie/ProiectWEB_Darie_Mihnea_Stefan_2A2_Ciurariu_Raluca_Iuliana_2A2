class ProfileManager {
    constructor() {
        this.elements = {
            statsBtn: document.getElementById('statsButton'),
            editBtn: document.getElementById('editButton'),
            expandedPanel: document.getElementById('expandedPanel'),
            panelContent: document.getElementById('panelContent'),
            closeBtn: document.getElementById('closePanel'),
            overlay: document.querySelector('.overlay'),
            profileContainer: document.querySelector('.profile-container'),
            usernameEl: document.querySelector('.user-name')
        };

        this.endpoints = {
            username: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=getUsername',
            userData: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=getUserData',
            updateProfile: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=updateProfile',
            stats: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=distribution'
        };

        this.init();
    }

    async init() {
        await this.loadUsername();
        this.setupEventListeners();
        this.setupCloseButton();
    }

    async loadUsername() {
        try {
            const res = await fetch(this.endpoints.username, {
                credentials: 'include'
            });
            const json = await res.json();

            if (res.ok && json.username && this.elements.usernameEl) {
                this.elements.usernameEl.textContent = json.username;
            }
        } catch (err) {
            console.error('Error loading username:', err);
        }
    }

    setupEventListeners() {
        if (this.elements.statsBtn) {
            this.elements.statsBtn.addEventListener('click', () => this.handleStatsClick());
        }

        if (this.elements.editBtn) {
            this.elements.editBtn.addEventListener('click', () => this.handleEditClick());
        }

        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }

    setupCloseButton() {
        if (this.elements.closeBtn) {
            this.elements.closeBtn.innerHTML = '×';
            this.elements.closeBtn.addEventListener('click', () => this.closePanel());
        }
    }

    async handleStatsClick() {
        if (this.elements.expandedPanel.classList.contains('active')) {
            this.closePanel();
            return;
        }

        this.openPanel();
        await this.loadStatistics();
    }

    async handleEditClick() {
        if (this.elements.expandedPanel.classList.contains('active')) {
            this.closePanel();
            return;
        }

        this.openPanel();
        await this.loadEditForm();
    }

    handleOutsideClick(e) {
        if (this.elements.expandedPanel.classList.contains('active') && 
            !this.elements.expandedPanel.contains(e.target) && 
            !this.elements.statsBtn.contains(e.target) &&
            !this.elements.editBtn.contains(e.target)) {
            this.closePanel();
        }
    }

    openPanel() {
        this.elements.expandedPanel.classList.add('active');
        this.elements.profileContainer.classList.add('panel-open');
        if (this.elements.overlay) this.elements.overlay.classList.add('active');
    }

    closePanel() {
        this.elements.expandedPanel.classList.remove('active');
        this.elements.profileContainer.classList.remove('panel-open');
        if (this.elements.overlay) this.elements.overlay.classList.remove('active');
        this.elements.statsBtn.classList.remove('active');
        this.elements.editBtn.classList.remove('active');
        
        setTimeout(() => {
            this.elements.panelContent.innerHTML = '';
        }, 300);
    }

    async loadStatistics() {
        this.elements.panelContent.innerHTML = '<p class="stats-loading">Se încarcă statisticile...</p>';

        try {
            const res = await fetch(this.endpoints.stats, { credentials: 'include' });
            const json = await res.json();

            if (!res.ok) throw new Error(json.error || 'Unknown error');

            this.renderStatistics(json.data);
        } catch (err) {
            this.showError(err.message);
        }
    }

    renderStatistics(data) {
        this.elements.panelContent.innerHTML = '';
        
        const header = document.createElement('h3');
        header.className = 'stats-header';
        header.textContent = 'Statistics';
        this.elements.panelContent.appendChild(header);

        if (!data || !data.length) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'stats-empty';
            emptyMsg.textContent = 'No statistical data available.';
            this.elements.panelContent.appendChild(emptyMsg);
            return;
        }

        this.elements.panelContent.appendChild(this.buildBars(data));
    }

    buildBars(rows) {
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-list';
        const palette = ['#007bff', '#ff4757', '#ffa502', '#2ed573', '#8e44ad'];

        rows.forEach((row, idx) => {
            const barRow = this.createBarRow(row, palette[idx % palette.length], idx);
            wrapper.appendChild(barRow);
        });

        return wrapper;
    }

    createBarRow(data, color, index) {
        const row = document.createElement('div');
        row.className = 'bar-row';

        const label = document.createElement('span');
        label.className = 'bar-label';
        label.textContent = data.TYPE;

        const track = document.createElement('div');
        track.className = 'bar-track';

        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = '0%';
        fill.style.background = color;

        const value = document.createElement('span');
        value.className = 'bar-value';
        value.textContent = `${data.TYPE_COUNT} (${data.PERCENTAGE}%)`;

        track.appendChild(fill);
        row.append(label, track, value);

        setTimeout(() => {
            fill.style.width = `${data.PERCENTAGE}%`;
        }, 100 + (index * 50));

        return row;
    }

    async loadEditForm() {
        const formHTML = this.getEditFormTemplate();
        this.elements.panelContent.innerHTML = formHTML;

        const form = document.getElementById('editProfileForm');
        await this.populateForm();
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    getEditFormTemplate() {
        return `
            <h3 class="stats-header">Edit Profile</h3>
            <form id="editProfileForm" class="edit-form">
                <div class="form-group">
                    <label class="form-label" for="username">Username</label>
                    <input type="text" id="username" name="username" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="email">Email</label>
                    <input type="email" id="email" name="email" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" name="currentPassword" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="newPassword">New Password (leave blank if unchanged)</label>
                    <input type="password" id="newPassword" name="newPassword" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" class="form-input">
                </div>
                <button type="submit" class="submit-button">Save Changes</button>
            </form>
        `;
    }

    async populateForm() {
        try {
            const res = await fetch(this.endpoints.userData, {
                credentials: 'include'
            });
            const userData = await res.json();
            
            if (res.ok && userData) {
                document.getElementById('username').value = userData.username || '';
                document.getElementById('email').value = userData.email || '';
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            this.showFormError('Failed to load user data');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = {
            username: form.username.value,
            email: form.email.value,
            currentPassword: form.currentPassword.value,
            newPassword: form.newPassword.value,
            confirmPassword: form.confirmPassword.value
        };

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            this.showFormError('New passwords do not match');
            return;
        }

        try {
            const res = await fetch(this.endpoints.updateProfile, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                this.showFormSuccess('Profile updated successfully');
                if (formData.username !== this.elements.usernameEl.textContent) {
                    this.elements.usernameEl.textContent = formData.username;
                }
            } else {
                this.showFormError(data.error || 'Failed to update profile');
            }
        } catch (err) {
            this.showFormError('An error occurred. Please try again.');
            console.error(err);
        }
    }

    showFormError(message) {
        const existingError = document.querySelector('.form-error');
        if (existingError) existingError.remove();

        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = message;
        
        const form = document.getElementById('editProfileForm');
        form.insertBefore(error, form.querySelector('.submit-button'));
    }

    showFormSuccess(message) {
        const existingSuccess = document.querySelector('.form-success');
        if (existingSuccess) existingSuccess.remove();

        const success = document.createElement('div');
        success.className = 'form-success';
        success.textContent = message;
        
        const form = document.getElementById('editProfileForm');
        form.insertBefore(success, form.firstChild);
    }

    showError(message) {
        this.elements.panelContent.innerHTML = '';
        const errorMsg = document.createElement('div');
        errorMsg.className = 'stats-error';
        errorMsg.textContent = `Error: ${message}`;
        this.elements.panelContent.appendChild(errorMsg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});