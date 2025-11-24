
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
        
   
        showTemporaryMessage('Backend in development');
    });


    helpButton.addEventListener('click', (event) => {
        event.preventDefault();
      
        showTemporaryMessage('Contact support@sentinelchain.com');
    });
});