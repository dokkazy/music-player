import songs from './songs.js';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const LOCAL_STORAGE_KEY = 'MUSIC_PLAYER';

const playlist = $('.playlist');
const CD = $('.cd');
const heading = $('header h2');
const cdThumb = $('.cd-thumb');
const audio = $('#audio');
const volumeBox = $('.volume-box');
const volume = $('#volume');
const player = $('.player');
const togglePlay = $('.btn-toggle-play');
const progress = $('#progress');
const nextBtn = $('.btn-next');
const prevBtn = $('.btn-prev');
const randomBtn = $('.btn-random');
const repeatBtn = $('.btn-repeat');

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {},
    songs: [...songs],
    playedSongs: [],
    setConfig: function (key, value) {
        this.config[key] = value;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.config));
    },

    render: function () {
        const htmls = this.songs.map((song, index) => {
            return `
            <div data-index="${index}" class="song ${index === this.currentIndex ? 'active' : ''}">
                <div class="thumb"
                    style="background-image: url('${song.image}')">
                </div>
                <div class="body">
                    <h3 class="title">${song.name}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>
            `
        })
        playlist.innerHTML = htmls.join('');
    },
    defineProperties: function () {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex];
            }
        })
    },
    scrollToActiveSong: function () {
        setTimeout(() => {
            $('.song.active').scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        }, 300);
    },
    loadCurrentSong: function () {
        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.path;

        console.log(heading, cdThumb, audio);
    },
    loadConfig: function () {
        this.isRandom = this.config.isRandom;
        this.isRepeat = this.config.isRepeat;
    },
    handleEvents: function () {
        const _this = this;
        const cdWidth = CD.offsetWidth;
        const volumeBoxWidth = volumeBox.offsetWidth;
        // Xử lý CD quay / dừng
        const cdThumbAnimate = cdThumb.animate([
            {
                transform: 'rotate(360deg)'
            }
        ], {
            duration: 10000,
            iterations: Infinity
        });
        cdThumbAnimate.pause();


        // Xử lý phóng to / thu nhỏ CD
        document.onscroll = function () {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const newVolumeBoxWidth = volumeBoxWidth - scrollTop;
            const newCdWidth = cdWidth - scrollTop;
            volumeBox.style.width = newVolumeBoxWidth > 0 ? `${newVolumeBoxWidth}px` : 0;
            volumeBox.style.opacity = newVolumeBoxWidth / volumeBoxWidth;
            CD.style.width = newCdWidth > 0 ? `${newCdWidth}px` : 0;
            CD.style.opacity = newCdWidth / cdWidth;
        }

        //Xử lí khi click play
        togglePlay.onclick = function () {
            if (audio.src) {
                if (_this.isPlaying) {
                    audio.pause();
                } else {
                    audio.play();
                }
            }
        }

        // Khi song được play
        audio.onplay = function () {
            _this.isPlaying = true;
            player.classList.add('playing');
            cdThumbAnimate.play();
            if (_this.playedSongs.indexOf(_this.currentIndex) === -1) {
                _this.playedSongs.push(_this.currentIndex);
            }
        }

        // Khi song bị pause
        audio.onpause = function () {
            _this.isPlaying = false;
            player.classList.remove('playing');
            cdThumbAnimate.pause();
        }

        // Khi tiến độ bài hát thay đổi
        audio.ontimeupdate = function () {
            if (audio.duration) {
                const progressPercent = Math.floor((audio.currentTime / audio.duration) * 100);
                progress.value = progressPercent;
            }
        }

        // Xử lý khi tua song
        progress.oninput = function (e) {
            const seekTime = (audio.duration / 100) * e.target.value;
            audio.currentTime = seekTime;
        }

        // Khi next song
        nextBtn.onclick = function () {
            _this.nextSong();
            _this.render();
            _this.scrollToActiveSong();
            audio.play();
        }

        // Khi prev song
        prevBtn.onclick = function () {
            _this.prevSong();
            _this.render();
            _this.scrollToActiveSong();
            audio.play();
        }

        // Khi random song
        randomBtn.onclick = function (e) {
            _this.isRandom = !_this.isRandom;
            _this.setConfig('isRandom', _this.isRandom);
            randomBtn.classList.toggle('active', _this.isRandom);
        }

        // Khi repeat song
        repeatBtn.onclick = function (e) {
            _this.isRepeat = !_this.isRepeat;
            _this.setConfig('isRepeat', _this.isRepeat);
            repeatBtn.classList.toggle('active', _this.isRepeat);
        }

        // Xử lý next song khi audio ended
        audio.onended = function () {
            if (_this.isRepeat) {
                audio.play();
            } else {
                nextBtn.click();
            }
        }

        // Lắng nghe hành vi click vào playlist
        playlist.onclick = function (e) {
            const songNode = e.target.closest('.song:not(.active)');

            if (songNode || e.target.closest('.option')) {
                // Xử lý khi click vào song
                if (songNode) {
                    _this.currentIndex = Number(songNode.dataset.index);
                    _this.loadCurrentSong();
                    _this.render();
                    audio.play();
                }
            }
        }

        // điều chỉnh âm thanh
        volume.value = audio.volume * 100;
        volume.style.backgroundImage = `linear-gradient(90deg, #ec1f55 ${volume.value}%, transparent 0%)`;
        volume.oninput = function (e) {
            audio.volume = e.target.value / 100;
            volume.style.backgroundImage = `linear-gradient(90deg, #ec1f55 ${volume.value}%, transparent 0%)`; 
        }

    },
    nextSong: function () {
        if (this.isRandom) {
            this.randomSong();
        } else {
            this.currentIndex++;
            if (this.currentIndex >= this.songs.length) {
                this.currentIndex = 0;
            }
        }
        this.loadCurrentSong();
    },
    prevSong: function () {
        if (this.isRandom) {
            this.randomSong();
        } else {
            this.currentIndex--;
            if (this.currentIndex < 0) {
                this.currentIndex = this.songs.length - 1;
            }
        }
        this.loadCurrentSong();
    },
    randomSong: function () {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.songs.length);
        } while (newIndex === this.currentIndex);
        this.currentIndex = newIndex;
    },
    start: function () {
        this.loadConfig();
        this.defineProperties();
        this.handleEvents();
        this.loadCurrentSong();
        this.render();
        randomBtn.classList.toggle('active', this.isRandom);
        repeatBtn.classList.toggle('active', this.isRepeat);
    }
}

export default app;