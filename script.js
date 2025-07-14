let songs = [];
let currentSongIndex = 0;
let audio = new Audio();
let isPlaying = false;

// Utility function to format time
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Function to decode URL-encoded strings
function decodeFileName(fileName) {
    return decodeURIComponent(fileName).replace(/%20/g, ' ');
}

// Fetch songs from the server
async function fetchSongs() {
    try {
        const response = await fetch('/songs/');
        const data = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const links = doc.querySelectorAll('a');
        
        songs = Array.from(links)
            .map(link => link.href)
            .filter(href => href.endsWith('.mp3'))
            .map(href => {
                const fileName = href.split('/').pop();
                return {
                    url: href,
                    name: decodeFileName(fileName.replace('.mp3', ''))
                };
            });
        
        displaySongs();
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
}

// Display songs in the playlist
function displaySongs(filteredSongs = songs) {
    const songList = document.querySelector('.list ul');
    songList.innerHTML = '';
    
    filteredSongs.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
            <span>${song.name}</span>
            <button class="play-btn" data-index="${index}">Play</button>
        `;
        songList.appendChild(li);
        
        // Add click event to play the song
        li.querySelector('.play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            playSong(index);
        });
        
        // Add click event to the entire list item
        li.addEventListener('click', () => {
            playSong(index);
        });
    });
}

// Play a specific song
function playSong(index) {
    if (index >= 0 && index < songs.length) {
        currentSongIndex = index;
        const song = songs[index];
        audio.src = song.url;
        audio.play();
        isPlaying = true;
        updatePlayerUI();
    }
}

// Update player UI
function updatePlayerUI() {
    const songName = document.querySelector('.songname');
    const playPauseBtn = document.querySelector('.control-btn:nth-child(2)');
    
    if (songs[currentSongIndex]) {
        songName.textContent = songs[currentSongIndex].name;
        playPauseBtn.src = isPlaying ? 
            'pause_circle_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg' : 
            'play_circle_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg';
    }
}

// Initialize the player
function initPlayer() {
    fetchSongs();
    
    // Add event listeners for player controls
    const prevBtn = document.querySelector('.control-btn:nth-child(1)');
    const playPauseBtn = document.querySelector('.control-btn:nth-child(2)');
    const nextBtn = document.querySelector('.control-btn:nth-child(3)');
    
    prevBtn.addEventListener('click', () => {
        playSong((currentSongIndex - 1 + songs.length) % songs.length);
    });
    
    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        isPlaying = !isPlaying;
        updatePlayerUI();
    });
    
    nextBtn.addEventListener('click', () => {
        playSong((currentSongIndex + 1) % songs.length);
    });
    
    // Add event listener for search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredSongs = songs.filter(song => 
            song.name.toLowerCase().includes(searchTerm)
        );
        displaySongs(filteredSongs);
    });
    
    // Update duration and progress bar
    audio.addEventListener('timeupdate', () => {
        
        const duration = document.querySelector('.duration');
        const currentTime = formatTime(audio.currentTime);
        const totalTime = formatTime(audio.duration);
        duration.textContent = `${currentTime} / ${totalTime}`;

        // Progress bar logic
        const progressBar = document.getElementById('progressBar');
        const progressHandle = document.getElementById('progressHandle');
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = percent + '%';
            progressHandle.style.right = (100 - percent) + '%';
        } else {
            progressBar.style.width = '0%';
            progressHandle.style.right = '100%';
        }
    });

    // Seek logic for progress bar
    const progressContainer = document.getElementById('progressContainer');
    let isSeeking = false;

    function seek(e) {
        const rect = progressContainer.getBoundingClientRect();
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        let percent = (x - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        audio.currentTime = percent * audio.duration;
    }

    progressContainer.addEventListener('mousedown', (e) => {
        isSeeking = true;
        seek(e);
    });
    progressContainer.addEventListener('mousemove', (e) => {
        if (isSeeking) seek(e);
    });
    document.addEventListener('mouseup', () => {
        isSeeking = false;
    });
    // Touch events for mobile
    progressContainer.addEventListener('touchstart', (e) => {
        isSeeking = true;
        seek(e);
    });
    progressContainer.addEventListener('touchmove', (e) => {
        if (isSeeking) seek(e);
    });
    document.addEventListener('touchend', () => {
        isSeeking = false;
    });

    // Handle song end
    audio.addEventListener('ended', () => {
        playSong((currentSongIndex + 1) % songs.length);
    });
}

// Initialize the player when the page loads
document.addEventListener('DOMContentLoaded', initPlayer); 