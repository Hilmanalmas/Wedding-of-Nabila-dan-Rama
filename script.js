// Script.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Parse URL Parameters for Guest Name
    const params = new URLSearchParams(window.location.search);
    const guestName = params.get('to') || "Guest"; // Default to "Guest" if no parameter

    const nameElement = document.getElementById('guest-name');
    if (nameElement) {
        // Sanitize input to prevent XSS (basic)
        nameElement.textContent = guestName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Initialize Music Button State
    const musicBtn = document.getElementById('music-btn');
    // Initially hidden or paused state visual is handled by CSS (paused animation)

    // Hide Scroll Indicator on Scroll
    window.addEventListener('scroll', () => {
        const scrollIndicator = document.getElementById('scroll-indicator');
        if (scrollIndicator && scrollIndicator.style.display !== 'none') {
            if (window.scrollY > 50) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    scrollIndicator.style.display = 'none';
                }, 500);
            }
        }
    });
});

// 2. Open Invitation (Welcome Screen Transition & Music Start)
function openInvitation() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainContent = document.getElementById('main-content');
    const audio = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');

    // Slide up animation
    welcomeScreen.classList.add('slide-up');

    // Reveal main content and enable scrolling
    setTimeout(() => {
        mainContent.classList.remove('hidden');
        document.body.style.overflowY = "auto"; // Re-enable scrolling

        // Show Scroll Indicator on Mobile
        if (window.innerWidth <= 768) {
            const scrollIndicator = document.getElementById('scroll-indicator');
            if (scrollIndicator) {
                scrollIndicator.classList.remove('hidden');
                scrollIndicator.style.display = 'block';

                // Auto hide after 5 seconds
                setTimeout(() => {
                    scrollIndicator.style.opacity = '0';
                    setTimeout(() => scrollIndicator.style.display = 'none', 500);
                }, 5000);
            }
        }
    }, 500);

    // Play Music
    if (audio) {
        audio.play().then(() => {
            musicBtn.classList.add('playing');
        }).catch(err => {
            console.log("Auto-play blocked, waiting for interaction", err);
        });
    }
}

// 3. Toggle Music
function toggleMusic() {
    const audio = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');

    if (audio.paused) {
        audio.play();
        musicBtn.classList.add('playing');
        musicBtn.innerHTML = "<i class='bx bxs-music'></i>";
    } else {
        audio.pause();
        musicBtn.classList.remove('playing');
        musicBtn.innerHTML = "<i class='bx bx-pause'></i>";
    }
}

// 4. Handle RSVP Submission
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyHWZKq17bBZPi37abZ_rgOKFL4_1zvs8cKGJbnq1gfd9dAjLh2xjgADuGsUOzSK5vB1A/exec";

function submitRSVP(event) {
    event.preventDefault(); // Prevent page reload

    const form = event.target;
    const name = form.name.value;
    const attendance = form.attendance.value;
    const message = form.message.value;

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    // Data to send
    // using FormData is often easier with Apps Script if you didn't set up JSON parsing,
    // but our script handles JSON body or parameters. Let's use simple textual JSON for clarity.
    const rsvpData = {
        name: name,
        attendance: attendance,
        message: message
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // 'no-cors' needed because Apps Script redirects, which fetch can't handle with CORS sometimes. 
                         // With no-cors we can't check response, but it sends the data.
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(rsvpData)
    })
    .then(() => {
        // Since we use no-cors, we assume success if it didn't throw network error
        alert(`Thank you, ${name}! Your RSVP has been sent.`);
        
        form.reset();

        // Refresh and Scroll to Message Wall
        // Give it a moment for the sheet to update
        setTimeout(() => {
            renderMessages();
            const wall = document.getElementById('message-wall-section');
            wall.classList.remove('hidden');
            wall.scrollIntoView({ behavior: 'smooth' });
        }, 1000);
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Something went wrong. Please check your connection.");
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// 5. Render Message Wall
function renderMessages() {
    const container = document.getElementById('message-container');
    const wallSection = document.getElementById('message-wall-section');
    if (!container) return;

    // Show loading indicator or retain old content while loading?
    // Let's just fetch silently.

    fetch(SCRIPT_URL)
    .then(response => response.json())
    .then(data => {
        // data is array of objects {timestamp, name, attendance, message}
        
        // Filter only those with messages
        const messages = data.filter(r => r.message && r.message.toString().trim() !== "");

        if (messages.length === 0) {
            wallSection.classList.add('hidden');
            return;
        }

        wallSection.classList.remove('hidden');
        container.innerHTML = ""; // Clear current

        // Shuffle
        const shuffled = messages.sort(() => 0.5 - Math.random());

        shuffled.forEach(msg => {
            const bubble = document.createElement('div');
            bubble.className = "message-bubble";

            // Random slight rotation
            const randomRot = (Math.random() * 4 - 2).toFixed(1); 
            bubble.style.transform = `rotate(${randomRot}deg)`;

            bubble.innerHTML = `
                <strong>${escapeHtml(msg.name)}</strong>
                <p>"${escapeHtml(msg.message)}"</p>
            `;
            container.appendChild(bubble);
        });
    })
    .catch(error => {
        console.error('Error fetching messages:', error);
    });
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Initial render check
document.addEventListener('DOMContentLoaded', renderMessages);
