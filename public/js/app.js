// Global state
let currentPage = 'dashboard';
let wishlists = [];
let savings = [];
let dashboardData = null;
let currentWishlistId = null;
let confirmAction = null;
let availableMoney = 0;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Add wishlist form
    document.getElementById('add-wishlist-form').addEventListener('submit', handleAddWishlist);
    
    // Edit wishlist form
    document.getElementById('edit-wishlist-form').addEventListener('submit', handleEditWishlist);
    
    // Quick save form
    document.getElementById('quick-save-form').addEventListener('submit', handleQuickSave);
    
    // Add money form
    document.getElementById('add-money-form').addEventListener('submit', handleAddMoney);
}

// Navigation
function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
        p.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(page + '-page').classList.remove('hidden');
    document.getElementById(page + '-page').classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll(`[data-page="${page}"]`).forEach(btn => {
        btn.classList.add('active');
    });
    
    currentPage = page;
    
    // Load page-specific data
    if (page === 'dashboard') {
        loadDashboardData();
    } else if (page === 'wishlist') {
        loadWishlistData();
    } else if (page === 'money-history') {
        loadMoneyHistory();
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        dashboardData = await response.json();
        updateDashboard();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboard() {
    if (!dashboardData) return;
    
    // Update financial summary cards
    document.getElementById('total-income').textContent = formatCurrency(dashboardData.totalIncome || 0);
    document.getElementById('total-expenses').textContent = formatCurrency(dashboardData.totalExpenses || 0);
    
    document.getElementById('available-money').textContent = formatCurrency(dashboardData.availableMoney || 0);
    
    // Update global available money
    availableMoney = dashboardData.availableMoney || 0;
    
    // Update wishlist preview
    updateWishlistPreview(dashboardData.wishlists ? dashboardData.wishlists.slice(0, 3) : []);
}

function updateWishlistPreview(items) {
    const container = document.getElementById('wishlist-preview');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-sage-600 mb-2">No wishlist items yet</h3>
                <p class="text-sage-500 mb-4">Start by adding items you want to save for</p>
                <button onclick="showPage('wishlist')" class="btn-primary">Add Your First Item</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="soft-card rounded-2xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer" onclick="openItemDetail('${item.id}')">
            <div class="flex items-center space-x-4 mb-3">
                <div class="w-12 h-12 bg-gradient-to-br from-sage-100 to-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover rounded-xl">` :
                        `<svg class="w-6 h-6 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>`
                    }
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-sage-800 truncate text-sm">${item.name}</h3>
                    <p class="text-sage-600 text-xs">${formatCurrency(item.price)}</p>
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium text-sage-800">${Math.round(item.progress)}%</div>
                    <div class="text-xs text-sage-600">${formatCurrency(item.totalSaved)}</div>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(item.progress, 100)}%"></div>
            </div>
        </div>
    `).join('');
}



// Wishlist Functions
async function loadWishlistData() {
    try {
        const response = await fetch('/api/wishlists');
        wishlists = await response.json();
        updateWishlistGrid();
    } catch (error) {
        console.error('Error loading wishlist data:', error);
    }
}

function updateWishlistGrid() {
    const container = document.getElementById('wishlist-grid');
    
    if (wishlists.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="w-24 h-24 bg-sage-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg class="w-12 h-12 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-semibold text-sage-600 mb-3">Start Your Wishlist Journey</h3>
                <p class="text-sage-500 mb-8 max-w-md mx-auto">Add items you want to save for and track your progress towards achieving your financial goals.</p>
                <button onclick="openAddWishlistModal()" class="btn-primary">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Your First Item
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = wishlists.map(item => `
        <div class="soft-card rounded-3xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group" onclick="openItemDetail('${item.id}')">
            <div class="relative mb-6">
                <div class="w-full h-48 bg-gradient-to-br from-sage-100 to-sky-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300">` :
                        `<svg class="w-16 h-16 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>`
                    }
                </div>
                <div class="absolute top-4 right-4">
                    <div class="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-sage-700">
                        ${Math.round(item.progress)}%
                    </div>
                </div>
            </div>
            
            <div class="mb-4">
                <h3 class="text-xl font-semibold text-sage-800 mb-2">${item.name}</h3>
                <p class="text-2xl font-light text-sage-600">${formatCurrency(item.price)}</p>
            </div>
            
            <div class="progress-bar mb-4">
                <div class="progress-fill" style="width: ${Math.min(item.progress, 100)}%"></div>
            </div>
            
            <div class="flex justify-between items-center text-sm">
                <span class="text-sage-600">${formatCurrency(item.totalSaved)} saved</span>
                <span class="font-medium text-sage-800">${formatCurrency(item.price - item.totalSaved)} to go</span>
            </div>
            
            <div class="mt-4 pt-4 border-t border-sage-100 space-y-2">
                <button onclick="event.stopPropagation(); openQuickSaveModal('${item.id}')" 
                        class="w-full btn-secondary text-sm">
                    Add Saving
                </button>
                <div class="flex space-x-2">
                    <button onclick="event.stopPropagation(); editWishlistItem('${item.id}')" 
                            class="flex-1 bg-sky-100 hover:bg-sky-200 text-sky-700 px-3 py-2 rounded-xl font-medium transition-all duration-200 text-sm">
                        <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit
                    </button>
                    <button onclick="event.stopPropagation(); deleteWishlistItem('${item.id}')" 
                            class="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-xl font-medium transition-all duration-200 text-sm">
                        <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal Functions
function openAddWishlistModal() {
    document.getElementById('add-wishlist-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAddWishlistModal() {
    document.getElementById('add-wishlist-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('add-wishlist-form').reset();
}

function openQuickSaveModal(wishlistId = null) {
    const modal = document.getElementById('quick-save-modal');
    const select = document.getElementById('save-wishlist-select');
    
    // Populate wishlist select
    select.innerHTML = '<option value="">Choose an item</option>';
    wishlists.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        if (wishlistId && item.id === wishlistId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeQuickSaveModal() {
    document.getElementById('quick-save-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('quick-save-form').reset();
}

async function openItemDetail(wishlistId) {
    const item = wishlists.find(w => w.id === wishlistId);
    if (!item) return;
    
    // Load saving history
    try {
        const response = await fetch(`/api/savings/wishlist/${wishlistId}`);
        const savingsHistory = await response.json();
        
        const modal = document.getElementById('item-detail-modal');
        const content = document.getElementById('item-detail-content');
        
        // Calculate remaining amount
        const remaining = item.price - item.totalSaved;
        
        content.innerHTML = `
            <div class="space-y-6">
                <!-- Item Info -->
                <div class="flex items-start space-x-6">
                    <div class="w-24 h-24 bg-gradient-to-br from-sage-100 to-sky-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        ${item.image ? 
                            `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover rounded-2xl">` :
                            `<svg class="w-12 h-12 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>`
                        }
                    </div>
                    <div class="flex-1">
                        <h3 class="text-2xl font-semibold text-sage-800 mb-2">${item.name}</h3>
                        <p class="text-3xl font-light text-sage-600 mb-2">${formatCurrency(item.price)}</p>
                        ${item.description ? `<p class="text-sage-600 mt-2">${item.description}</p>` : ''}
                    </div>
                </div>
                
                <!-- Progress -->
                <div class="glass-card rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-semibold text-sage-800">Progress</h4>
                        <span class="text-2xl font-light text-sage-600">${Math.round(item.progress)}%</span>
                    </div>
                    <div class="progress-bar mb-4">
                        <div class="progress-fill" style="width: ${Math.min(item.progress, 100)}%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-sage-600">
                        <span>${formatCurrency(item.totalSaved)} saved</span>
                        <span>${formatCurrency(item.price - item.totalSaved)} remaining</span>
                    </div>
                </div>
                

                
                <!-- Saving History -->
                <div class="glass-card rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-semibold text-sage-800">Saving History</h4>
                        <button onclick="closeItemDetailModal(); openQuickSaveModal('${item.id}')" class="btn-secondary text-sm">
                            Add Saving
                        </button>
                    </div>
                    
                    ${savingsHistory.length > 0 ? `
                        <div class="space-y-3">
                            ${savingsHistory.reverse().map(saving => `
                                <div class="flex items-center justify-between p-3 bg-sage-50 rounded-xl">
                                    <div class="flex-1">
                                        <div class="font-medium text-sage-800">${formatCurrency(saving.amount)}</div>
                                        ${saving.note ? `<div class="text-sm text-sage-600">${saving.note}</div>` : ''}
                                    </div>
                                    <div class="flex items-center space-x-3">
                                        <div class="text-sm text-sage-500">${formatDate(saving.date)}</div>
                                        <button onclick="deleteSavingEntry('${saving.id}')" 
                                                class="text-red-400 hover:text-red-600 transition-colors">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <div class="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <svg class="w-6 h-6 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                            <p class="text-sage-500">No savings recorded yet</p>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error loading item details:', error);
    }
}

function closeItemDetailModal() {
    document.getElementById('item-detail-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Form Handlers
async function handleAddWishlist(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('wishlist-name').value,
        price: parseFloat(document.getElementById('wishlist-price').value),
        image: document.getElementById('wishlist-image').value,
        description: document.getElementById('wishlist-description').value
    };
    
    try {
        const response = await fetch('/api/wishlists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Wishlist item added successfully!', 'success');
            closeAddWishlistModal();
            loadWishlistData();
            loadDashboardData();
        } else {
            throw new Error('Failed to add wishlist item');
        }
    } catch (error) {
        console.error('Error adding wishlist item:', error);
        showNotification('Error adding wishlist item. Please try again.', 'error');
    }
}

async function handleQuickSave(e) {
    e.preventDefault();
    
    const formData = {
        wishlistId: document.getElementById('save-wishlist-select').value,
        amount: parseFloat(document.getElementById('save-amount').value),
        note: document.getElementById('save-note').value
    };
    
    try {
        const response = await fetch('/api/savings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Saving entry added successfully!', 'success');
            closeQuickSaveModal();
            loadWishlistData();
            loadDashboardData();
        } else {
            const error = await response.json();
            if (error.error === 'Insufficient funds for saving') {
                showNotification(`Insufficient funds! Available: ${formatCurrency(error.available)}, Requested: ${formatCurrency(error.requested)}`, 'error');
            } else {
                showNotification(error.error || 'Failed to add saving entry', 'error');
            }
        }
    } catch (error) {
        console.error('Error adding saving entry:', error);
        showNotification('Error adding saving entry. Please try again.', 'error');
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}



function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 transform translate-x-full ${
        type === 'success' ? 'bg-sage-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-sky-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// CRUD Functions



// Wishlist CRUD
function editWishlistItem(wishlistId) {
    const item = wishlists.find(w => w.id === wishlistId);
    if (!item) return;
    
    currentWishlistId = wishlistId;
    
    // Populate edit form
    document.getElementById('edit-wishlist-name').value = item.name;
    document.getElementById('edit-wishlist-price').value = item.price;
    document.getElementById('edit-wishlist-image').value = item.image || '';
    document.getElementById('edit-wishlist-description').value = item.description || '';
    
    // Show edit modal
    document.getElementById('edit-wishlist-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEditWishlistModal() {
    document.getElementById('edit-wishlist-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('edit-wishlist-form').reset();
    currentWishlistId = null;
}

async function handleEditWishlist(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('edit-wishlist-name').value,
        price: parseFloat(document.getElementById('edit-wishlist-price').value),
        image: document.getElementById('edit-wishlist-image').value,
        description: document.getElementById('edit-wishlist-description').value
    };
    
    try {
        const response = await fetch(`/api/wishlists/${currentWishlistId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Wishlist item updated successfully!', 'success');
            closeEditWishlistModal();
            loadWishlistData();
            loadDashboardData();
        } else {
            throw new Error('Failed to update wishlist item');
        }
    } catch (error) {
        console.error('Error updating wishlist item:', error);
        showNotification('Error updating wishlist item. Please try again.', 'error');
    }
}

function deleteWishlistItem(wishlistId) {
    const item = wishlists.find(w => w.id === wishlistId);
    if (!item) return;
    
    showConfirmModal(
        'Delete Wishlist Item',
        `Are you sure you want to delete "${item.name}"? This will also delete all associated savings entries.`,
        async () => {
            try {
                const response = await fetch(`/api/wishlists/${wishlistId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showNotification('Wishlist item deleted successfully!', 'success');
                    loadWishlistData();
                    loadDashboardData();
                } else {
                    throw new Error('Failed to delete wishlist item');
                }
            } catch (error) {
                console.error('Error deleting wishlist item:', error);
                showNotification('Error deleting wishlist item. Please try again.', 'error');
            }
        }
    );
}

// Savings CRUD
async function deleteSavingEntry(savingId) {
    showConfirmModal(
        'Delete Saving Entry',
        'Are you sure you want to delete this saving entry?',
        async () => {
            try {
                const response = await fetch(`/api/savings/${savingId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showNotification('Saving entry deleted successfully!', 'success');
                    loadWishlistData();
                    loadDashboardData();
                } else {
                    throw new Error('Failed to delete saving entry');
                }
            } catch (error) {
                console.error('Error deleting saving entry:', error);
                showNotification('Error deleting saving entry. Please try again.', 'error');
            }
        }
    );
}

// Confirmation Modal Functions
function showConfirmModal(title, message, action) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    confirmAction = action;
    
    document.getElementById('confirm-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    confirmAction = null;
}

function executeConfirmAction() {
    if (confirmAction) {
        confirmAction();
    }
    closeConfirmModal();
}

// Money Entry Functions
function openAddMoneyModal() {
    document.getElementById('add-money-modal').classList.remove('hidden');
    document.getElementById('money-type').value = '';
    document.getElementById('money-amount').value = '';
    document.getElementById('money-category').value = '';
    document.getElementById('money-note').value = '';
    document.getElementById('available-money-info').classList.add('hidden');
}

function closeAddMoneyModal() {
    document.getElementById('add-money-modal').classList.add('hidden');
}

function updateMoneyForm() {
    const type = document.getElementById('money-type').value;
    const infoDiv = document.getElementById('available-money-info');
    const amountSpan = document.getElementById('available-amount');
    
    if (type === 'expense') {
        amountSpan.textContent = formatCurrency(availableMoney);
        infoDiv.classList.remove('hidden');
    } else {
        infoDiv.classList.add('hidden');
    }
}

async function handleAddMoney(e) {
    e.preventDefault();
    
    const type = document.getElementById('money-type').value;
    const amount = parseFloat(document.getElementById('money-amount').value);
    const category = document.getElementById('money-category').value;
    const note = document.getElementById('money-note').value;
    
    if (!type || !amount || amount <= 0) {
        showNotification('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/money-entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                amount,
                category,
                note,
                date: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            if (error.error === 'Insufficient funds') {
                showNotification(`Insufficient funds! Available: ${formatCurrency(error.available)}, Requested: ${formatCurrency(error.requested)}`, 'error');
            } else {
                showNotification(error.error || 'Failed to add money entry', 'error');
            }
            return;
        }
        
        showNotification('Money entry added successfully!', 'success');
        closeAddMoneyModal();
        loadDashboardData();
        if (currentPage === 'money-history') {
            loadMoneyHistory();
        }
        
    } catch (error) {
        console.error('Error adding money entry:', error);
        showNotification('Failed to add money entry', 'error');
    }
}

// Money History Functions
let moneyEntries = [];
let filteredMoneyEntries = [];

async function loadMoneyHistory() {
    try {
        const response = await fetch('/api/money-entries');
        if (response.ok) {
            moneyEntries = await response.json();
            filteredMoneyEntries = [...moneyEntries];
            updateMoneyHistoryUI();
        } else {
            throw new Error('Failed to load money history');
        }
    } catch (error) {
        console.error('Error loading money history:', error);
        showNotification('Failed to load money history', 'error');
    }
}

function updateMoneyHistoryUI() {
    // Update summary cards
    const totalIncome = moneyEntries
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalExpense = moneyEntries
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalSaving = moneyEntries
        .filter(entry => entry.type === 'saving')
        .reduce((sum, entry) => sum + entry.amount, 0);
    
    document.getElementById('total-income-history').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expense-history').textContent = formatCurrency(totalExpense);
    document.getElementById('total-saving-history').textContent = formatCurrency(totalSaving);
    
    // Update money history list
    const container = document.getElementById('money-history-list');
    
    if (filteredMoneyEntries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-sage-600 mb-2">No transactions found</h3>
                <p class="text-sage-500">Start by adding your first money entry</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredMoneyEntries.map(entry => `
        <div class="soft-card rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center ${
                        entry.type === 'income' ? 'bg-gradient-to-br from-green-100 to-green-200' :
                        entry.type === 'expense' ? 'bg-gradient-to-br from-red-100 to-red-200' :
                        'bg-gradient-to-br from-blue-100 to-blue-200'
                    }">
                        <svg class="w-6 h-6 ${
                            entry.type === 'income' ? 'text-green-600' :
                            entry.type === 'expense' ? 'text-red-600' :
                            'text-blue-600'
                        }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${entry.type === 'income' ? 
                                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>' :
                            entry.type === 'expense' ?
                                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4m16 0l-4-4m4 4l-4 4"></path>' :
                                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>'
                            }
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-semibold text-sage-800 capitalize">${entry.type}</h3>
                        <p class="text-sage-600 text-sm">${entry.category || 'No category'}</p>
                        ${entry.note ? `<p class="text-sage-500 text-xs mt-1">${entry.note}</p>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-semibold ${
                        entry.type === 'income' ? 'text-green-600' :
                        entry.type === 'expense' ? 'text-red-600' :
                        'text-blue-600'
                    }">
                        ${entry.type === 'income' ? '+' : entry.type === 'expense' ? '-' : ''}${formatCurrency(entry.amount)}
                    </div>
                    <div class="text-sage-500 text-sm">${formatDate(entry.date)}</div>
                    <button onclick="deleteMoneyEntry('${entry.id}')" class="text-red-400 hover:text-red-600 transition-colors mt-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterMoneyHistory() {
    const searchTerm = document.getElementById('money-search').value.toLowerCase();
    const typeFilter = document.getElementById('money-type-filter').value;
    
    filteredMoneyEntries = moneyEntries.filter(entry => {
        const matchesSearch = !searchTerm || 
            entry.category.toLowerCase().includes(searchTerm) ||
            entry.note.toLowerCase().includes(searchTerm) ||
            entry.type.toLowerCase().includes(searchTerm);
        
        const matchesType = !typeFilter || entry.type === typeFilter;
        
        return matchesSearch && matchesType;
    });
    
    updateMoneyHistoryUI();
}

function sortMoneyHistory() {
    const sortBy = document.getElementById('money-sort').value;
    
    filteredMoneyEntries.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.date) - new Date(a.date);
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'amount-high':
                return b.amount - a.amount;
            case 'amount-low':
                return a.amount - b.amount;
            default:
                return 0;
        }
    });
    
    updateMoneyHistoryUI();
}

async function deleteMoneyEntry(entryId) {
    showConfirmModal(
        'Delete Money Entry',
        'Are you sure you want to delete this money entry? This action cannot be undone.',
        async () => {
            try {
                const response = await fetch(`/api/money-entries/${entryId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showNotification('Money entry deleted successfully!', 'success');
                    loadMoneyHistory();
                    loadDashboardData(); // Update dashboard
                } else {
                    throw new Error('Failed to delete money entry');
                }
            } catch (error) {
                console.error('Error deleting money entry:', error);
                showNotification('Failed to delete money entry', 'error');
            }
        }
    );
}
