// Basic renderer for Steam Bot Multichat
console.log('Steam Bot Multichat - Frontend loaded');

// Basic DOM ready handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready');
    
    // Basic modal handling
    const modals = document.querySelectorAll('.modal');
    const headerButtons = document.querySelectorAll('.header_button');
    
    // Hide all modals initially except accountsLoadModal
    modals.forEach(modal => {
        if (modal.id !== 'accountsLoadModal') {
            modal.style.display = 'none';
        }
    });
    
    // Handle header button clicks
    headerButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all buttons
            headerButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all modals
            modals.forEach(modal => modal.style.display = 'none');
            
            // Show corresponding modal based on button id
            const buttonId = this.id;
            let targetModalId = '';
            
            switch(buttonId) {
                case 'console':
                    document.getElementById('terminal').style.display = 'block';
                    break;
                case 'accountsLoad':
                    targetModalId = 'accountsLoadModal';
                    break;
                case 'proxyLoad':
                    targetModalId = 'proxyLoadModal';
                    break;
                case 'friends':
                    targetModalId = 'friendsModal';
                    break;
                case 'settings':
                    targetModalId = 'settingsModal';
                    break;
                case 'actions':
                    targetModalId = 'actionsModal';
                    break;
                case 'faq':
                    targetModalId = 'faqModal';
                    break;
            }
            
            if (targetModalId) {
                const targetModal = document.getElementById(targetModalId);
                if (targetModal) {
                    targetModal.style.display = 'block';
                }
            }
        });
    });
    
    // Basic button handlers for demonstration
    const importAccountsBtn = document.getElementById('import_accounts');
    if (importAccountsBtn) {
        importAccountsBtn.addEventListener('click', function() {
            const accountsArea = document.getElementById('accountsLoadArea');
            const accounts = accountsArea.value.trim();
            if (accounts) {
                console.log('Importing accounts:', accounts.split('\n').length, 'accounts');
                // In a real app, this would send to backend
                alert('Account import feature requires backend connection');
            }
        });
    }
    
    // Handle settings save
    const settingsSaveBtn = document.getElementById('settings_save');
    if (settingsSaveBtn) {
        settingsSaveBtn.addEventListener('click', function() {
            console.log('Saving settings...');
            alert('Settings saved locally (backend required for persistence)');
        });
    }
    
    // Console toggle
    const consoleBtn = document.getElementById('console');
    const terminal = document.getElementById('terminal');
    if (consoleBtn && terminal) {
        consoleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (terminal.style.display === 'none' || !terminal.style.display) {
                terminal.style.display = 'block';
                terminal.innerHTML = '<div style="color: #00ff00; padding: 10px; background: #000; font-family: monospace;">Steam Bot Multichat Console<br/>Ready for connection...<br/>Backend server required for full functionality.</div>';
            } else {
                terminal.style.display = 'none';
            }
        });
    }
});

// Global alert function as sweetalert replacement
window.swal = function(options) {
    if (typeof options === 'string') {
        alert(options);
    } else if (options && options.text) {
        alert(options.text);
    }
    return Promise.resolve();
};

console.log('Renderer.js loaded successfully');
