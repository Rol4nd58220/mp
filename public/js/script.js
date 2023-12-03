document.addEventListener('DOMContentLoaded', function() {
    const loadingText = document.getElementById('loading-text');
    const launchButton = document.getElementById('launch-button');
    const loadingGif = document.querySelector('.loading-gif');
    const homeSection = document.getElementById('home-section');
    const dynamicText = document.getElementById('dynamic-text');
    const loadingSteps = [50, 75, 93, 100];
    const phrases = ["Developer", "3D Artist", "Frontend Developer", "Artist"];
    const emailReplyButton = document.getElementById('email-reply-button');
    const emailReplyInput = document.getElementById('email-reply-input');
    let currentStepIndex = 0;
    let phraseIndex = 0;
    let deleting = false;
    let textIndex = 0;
    const socket = io();


    socket.on('updateMessages', function(updatedMessages) {
        console.log('Messages updated:', updatedMessages);
        updateChatBox('sms-chatbox', updatedMessages.sms);
        updateChatBox('email-chatbox', updatedMessages.email);
    });

    setTimeout(progressLoading, 500);

    function handleLaunchButtonClick() {
        document.getElementById('loading-screen').style.display = 'none';
        console.log('Launch button clicked');
        homeSection.style.display = 'block';
        typewriterEffect();
    }
    
    function handleEmailReplyButtonClick() {
        const replyText = emailReplyInput.value; // Define replyText here
        const senderEmail = document.querySelector('#email-chatbox .body div:last-child').dataset.senderEmail;
        console.log('Email reply button clicked');
        if (replyText && senderEmail) {
            socket.emit('sendEmailReply', { replyText, senderEmail });
            emailReplyInput.value = ''; // Clear the input field
        }
    }
    
    if (launchButton) {
        launchButton.addEventListener('click', handleLaunchButtonClick);
    } else {
        console.log('Launch button not found');
    }
    
    if (emailReplyButton) {
        emailReplyButton.addEventListener('click', handleEmailReplyButtonClick);
    } else {
        console.log('Email reply button not found');
    }
    

    


    function updateLoadingText(percent) {
        loadingText.textContent = percent + '% Loading...';
    }

    function progressLoading() {
        if (currentStepIndex < loadingSteps.length - 1) {
            updateLoadingText(loadingSteps[++currentStepIndex]);
            setTimeout(progressLoading, 300);
        } else {
            updateLoadingText(loadingSteps[currentStepIndex]);
            setTimeout(() => {
                loadingText.style.display = 'none';
                launchButton.style.display = 'block';
                loadingGif.style.display = 'block';
            }, 500);
        }
    }

    function typewriterEffect() {
        const currentPhrase = phrases[phraseIndex];
        dynamicText.textContent = currentPhrase.slice(0, deleting ? textIndex-- : ++textIndex);
        if (textIndex === 0 || textIndex === currentPhrase.length) {
            deleting = !deleting;
            phraseIndex = textIndex ? phraseIndex : (phraseIndex + 1) % phrases.length;
            setTimeout(typewriterEffect, 1000);
        } else {
            setTimeout(typewriterEffect, deleting ? 100 : 150);
        }
    }

    function updateChatBox(chatBoxId, messages) {
        const chatBox = document.getElementById(chatBoxId);
        const bodyDiv = chatBox.querySelector('.body');
        bodyDiv.innerHTML = ''; 
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            const msgDiv = document.createElement('div');
            msgDiv.textContent = latestMessage.text;
            msgDiv.dataset.senderEmail = latestMessage.sender; // Ensure this is being correctly set
            bodyDiv.appendChild(msgDiv);
        }
    }

});