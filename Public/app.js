document.addEventListener('DOMContentLoaded', () => {

    const loginButton = document.getElementById('login-btn');
    const helpButton = document.getElementById('help-btn');
    const messageDisplay = document.getElementById('message');
    const backButton = document.getElementById('back-btn'); 

    function showTemporaryMessage(messageText) {
        if (!messageDisplay) return;
        messageDisplay.textContent = messageText;
        setTimeout(() => {
            messageDisplay.textContent = '';
        }, 1000);
    }

    
    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            event.preventDefault();
    
            window.location.href = 'dashboard.html';
        });
    }

    if (helpButton) {
        helpButton.addEventListener('click', (event) => {
            event.preventDefault();
            showTemporaryMessage('Contact support@sentinelchain.com');
        });
    }

    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'index.html';
        });


        window.onpopstate = function () {
            window.location.href = 'index.html';
        };

    
        history.replaceState(null, '', location.href);
    }

});
