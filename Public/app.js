document.addEventListener('DOMContentLoaded', () => {
    
    const loginButton = document.getElementById('login-btn');
    const helpButton = document.getElementById('help-btn');
    const messageDisplay = document.getElementById('message');

    
    function showTemporaryMessage(messageText) {
        
        messageDisplay.textContent = messageText;
        
        setTimeout(() => {
            messageDisplay.textContent = ''; 
        }, 1000); 
    }

    
    loginButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        
        // **PROTOTYPE NAVIGATION:** Immediately redirects to the dashboard.
        window.location.href = 'dashboard.html'; 
    });


    helpButton.addEventListener('click', (event) => {
        event.preventDefault();
        
        // Help button still shows the contact message
        showTemporaryMessage('Contact support@sentinelchain.com');
    });
});