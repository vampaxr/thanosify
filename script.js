const themeToggle = document.querySelector('.theme-toggle');
const scrollWrapper = document.querySelector('.scroll-wrapper');
const scrollContainer = document.querySelector('.scroll-container');
const progressBar = document.querySelector('.scroll-progress-bar');
const progressContainer = document.querySelector('.scroll-progress');
const nameWrapper = document.querySelector('.name-wrapper');
const nameEl = document.querySelector('.name');
const nowBox = document.getElementById('now-box');
const nowLabel = document.getElementById('now-label');
const nowText = document.getElementById('now-text');
const diaryToggle = document.getElementById('diary-toggle');
const diaryLabel = document.getElementById('diary-label');
const floatingQuoteEls = Array.from(document.querySelectorAll('.floating-quote'));
const QUOTE_SPIN_CHANCE = 0.16;
const NAME_STRETCH_BURST_CHANCE = 0.14;
const reviewItems = Array.from(document.querySelectorAll('.review-item[data-full]'));
const tipMarquee = document.getElementById('tip-marquee');
const tipModal = document.getElementById('tip-modal');
const tipAmountInput = document.getElementById('tip-amount');
const tipSubmitButton = document.getElementById('tip-submit');
const tipGroups = Array.from(document.querySelectorAll('.tip-group'));
let tipHoverTooltip = null;


function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);
themeToggle.addEventListener('click', toggleTheme);


let scrollTarget = 0;
let isScrolling = false;

function smoothScroll() {
    const current = scrollWrapper.scrollLeft;
    const diff = scrollTarget - current;
    if (Math.abs(diff) > 0.5) {
        scrollWrapper.scrollLeft = current + diff * 0.12;
        requestAnimationFrame(smoothScroll);
    } else {
        scrollWrapper.scrollLeft = scrollTarget;
        isScrolling = false;
    }
}

function handleWheel(e) {
    if (window.innerWidth <= 768) return;

    const scrollFrame = e.target.closest('.project-grid.scroll-frame');
    if (scrollFrame) {
        
        return;
    }

    e.preventDefault();
    const maxScroll = scrollWrapper.scrollWidth - scrollWrapper.clientWidth;
    scrollTarget = Math.max(0, Math.min(maxScroll, scrollTarget + e.deltaY));
    if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(smoothScroll);
    }
}

scrollTarget = scrollWrapper.scrollLeft || 0;
scrollWrapper.addEventListener('wheel', handleWheel, { passive: false });



let progressTimeout;

function updateProgress() {
    const scrollLeft = scrollWrapper.scrollLeft;
    const maxScroll = scrollWrapper.scrollWidth - scrollWrapper.clientWidth;
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    progressBar.style.width = `${progress}%`;
    progressContainer.classList.add('visible');
    clearTimeout(progressTimeout);
    progressTimeout = setTimeout(() => {
        progressContainer.classList.remove('visible');
    }, 1500);
}

scrollWrapper.addEventListener('scroll', updateProgress);


let activeFloatingQuote = null;

function setActiveFloatingQuote(nextQuote) {
    if (activeFloatingQuote === nextQuote) return;
    if (activeFloatingQuote) {
        activeFloatingQuote.classList.remove('is-hovered');
    }
    activeFloatingQuote = nextQuote;
    if (activeFloatingQuote) {
        activeFloatingQuote.classList.add('is-hovered');
    }
}

if (floatingQuoteEls.length) {
    floatingQuoteEls.forEach((quote) => {
        quote.addEventListener('mouseenter', () => {
            if (Math.random() > QUOTE_SPIN_CHANCE) return;
            quote.classList.remove('spin-nudge');
            void quote.offsetWidth;
            quote.classList.add('spin-nudge');
        });

        quote.addEventListener('animationend', () => {
            quote.classList.remove('spin-nudge');
        });
    });

    document.addEventListener('mousemove', (e) => {
        let found = null;
        for (const quote of floatingQuoteEls) {
            const rect = quote.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                found = quote;
                break;
            }
        }
        setActiveFloatingQuote(found);
    });

    document.addEventListener('mouseleave', () => {
        setActiveFloatingQuote(null);
    });
}


let activeReviewItem = null;
let reviewsTooltip = null;

function ensureReviewsTooltip() {
    if (reviewsTooltip) return reviewsTooltip;
    reviewsTooltip = document.createElement('div');
    reviewsTooltip.className = 'reviews-tooltip';
    document.body.appendChild(reviewsTooltip);
    return reviewsTooltip;
}

function positionReviewsTooltip(clientX, clientY) {
    if (!reviewsTooltip) return;

    const margin = 12;
    const offset = 14;
    const tipRect = reviewsTooltip.getBoundingClientRect();
    let x = clientX + offset;
    let y = clientY + offset;

    if (x + tipRect.width > window.innerWidth - margin) {
        x = window.innerWidth - tipRect.width - margin;
    }

    if (y + tipRect.height > window.innerHeight - margin) {
        y = clientY - tipRect.height - offset;
    }

    if (x < margin) x = margin;
    if (y < margin) y = margin;

    reviewsTooltip.style.left = `${x}px`;
    reviewsTooltip.style.top = `${y}px`;
}

function showReviewsTooltip(item, clientX, clientY) {
    const fullText = item.dataset.full?.trim();
    if (!fullText) return;
    const tip = ensureReviewsTooltip();

    const starsText = item.querySelector('.review-stars')?.textContent?.trim() || '';
    const rawText = item.textContent || '';
    const clientPart = rawText.includes('•') ? rawText.split('•').pop() : '';
    const clientName = (clientPart || '').trim() || 'Client';

    tip.innerHTML = `
        <div class="reviews-tooltip-header">
            <span class="reviews-tooltip-client">${escapeHtml(clientName)}</span>
            <span class="reviews-tooltip-stars">${escapeHtml(starsText)}</span>
        </div>
        <p class="reviews-tooltip-body">${escapeHtml(fullText)}</p>
    `;
    tip.classList.add('visible');
    positionReviewsTooltip(clientX, clientY);
}

function hideReviewsTooltip() {
    if (!reviewsTooltip) return;
    reviewsTooltip.classList.remove('visible');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

if (reviewItems.length) {
    document.addEventListener('mousemove', (e) => {
        const item = e.target.closest('.review-item[data-full]');
        if (!item) {
            if (activeReviewItem) {
                activeReviewItem = null;
                hideReviewsTooltip();
            }
            return;
        }

        if (activeReviewItem !== item) {
            activeReviewItem = item;
            showReviewsTooltip(item, e.clientX, e.clientY);
            return;
        }

        positionReviewsTooltip(e.clientX, e.clientY);
    });

    document.addEventListener('mouseleave', () => {
        activeReviewItem = null;
        hideReviewsTooltip();
    });
}


function openTipModal() {
    if (!tipModal) return;
    tipModal.classList.add('is-open');
    tipModal.setAttribute('aria-hidden', 'false');
    if (tipAmountInput) {
        setTimeout(() => tipAmountInput.focus(), 30);
    }
}

function closeTipModal() {
    if (!tipModal) return;
    tipModal.classList.remove('is-open');
    tipModal.setAttribute('aria-hidden', 'true');
}

function toPayAmount(raw) {
    const normalized = String(raw || '').trim().replace(',', '.').replace(/[^0-9.]/g, '');
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value) || value <= 0) return null;
    return (Math.round(value * 100) / 100).toFixed(2);
}

function submitTipAmount() {
    if (!tipAmountInput) return;
    const amt = toPayAmount(tipAmountInput.value);
    if (!amt) {
        tipAmountInput.focus();
        return;
    }
    window.location.href = `https://ziin.dev/pay/${amt}`;
}

function ensureTipHoverTooltip() {
    if (tipHoverTooltip) return tipHoverTooltip;
    tipHoverTooltip = document.createElement('div');
    tipHoverTooltip.className = 'tip-hover-tooltip';
    tipHoverTooltip.textContent = 'Tip Zin';
    document.body.appendChild(tipHoverTooltip);
    return tipHoverTooltip;
}

function positionTipHoverTooltip(clientX, clientY) {
    const tooltip = ensureTipHoverTooltip();
    const margin = 10;
    const offset = 14;

    let x = clientX + offset;
    let y = clientY + offset;

    const rect = tooltip.getBoundingClientRect();

    if (x + rect.width > window.innerWidth - margin) {
        x = window.innerWidth - rect.width - margin;
    }

    if (y + rect.height > window.innerHeight - margin) {
        y = clientY - rect.height - offset;
    }

    if (x < margin) x = margin;
    if (y < margin) y = margin;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

function showTipHoverTooltip(clientX, clientY) {
    const tooltip = ensureTipHoverTooltip();
    positionTipHoverTooltip(clientX, clientY);
    tooltip.classList.add('visible');
}

function hideTipHoverTooltip() {
    if (!tipHoverTooltip) return;
    tipHoverTooltip.classList.remove('visible');
}

function isMobileDeviceForTipTrigger() {
    return window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;
}

if (tipMarquee && tipModal && tipAmountInput && tipSubmitButton) {
    const buildTipTicker = () => {
        if (!tipGroups.length) return;
        const count = Math.max(160, Math.ceil(window.innerHeight / 10) + 120);
        const stream = Array.from({ length: count }, () => '<span class="tip-item">$</span>').join('');
        tipGroups.forEach((group) => {
            group.innerHTML = stream;
        });
    };

    const sanitizeTipAmountValue = (value) => {
        const onlyAllowed = String(value).replace(/[^0-9.]/g, '');
        const firstDot = onlyAllowed.indexOf('.');
        if (firstDot === -1) return onlyAllowed;
        return onlyAllowed.slice(0, firstDot + 1) + onlyAllowed.slice(firstDot + 1).replace(/\./g, '');
    };

    buildTipTicker();
    window.addEventListener('resize', buildTipTicker);

    tipMarquee.addEventListener('click', openTipModal);
    tipMarquee.addEventListener('mouseenter', (e) => {
        showTipHoverTooltip(e.clientX, e.clientY);
    });
    tipMarquee.addEventListener('mousemove', (e) => {
        positionTipHoverTooltip(e.clientX, e.clientY);
    });
    tipMarquee.addEventListener('mouseleave', () => {
        hideTipHoverTooltip();
    });
    tipMarquee.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openTipModal();
        }
    });

    if (nameWrapper) {
        nameWrapper.addEventListener('click', () => {
            if (isMobileDeviceForTipTrigger()) return;
            openTipModal();
        });
        nameWrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isMobileDeviceForTipTrigger()) return;
                openTipModal();
            }
        });
    }

    tipModal.addEventListener('click', (e) => {
        if (e.target instanceof Element && e.target.matches('[data-tip-close]')) {
            closeTipModal();
        }
    });

    tipSubmitButton.addEventListener('click', submitTipAmount);
    tipAmountInput.addEventListener('input', () => {
        const sanitized = sanitizeTipAmountValue(tipAmountInput.value);
        if (tipAmountInput.value !== sanitized) {
            tipAmountInput.value = sanitized;
        }
    });

    tipAmountInput.addEventListener('keydown', (e) => {
        const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'];
        if (controlKeys.includes(e.key)) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitTipAmount();
            }
            return;
        }

        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }

        if (e.key === '.') {
            if (tipAmountInput.value.includes('.')) {
                e.preventDefault();
            }
            return;
        }

        if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault();
        }
    });

    tipAmountInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = e.clipboardData?.getData('text') || '';
        const sanitized = sanitizeTipAmountValue(pasted);
        if (!sanitized) return;
        const start = tipAmountInput.selectionStart ?? tipAmountInput.value.length;
        const end = tipAmountInput.selectionEnd ?? tipAmountInput.value.length;
        const next = tipAmountInput.value.slice(0, start) + sanitized + tipAmountInput.value.slice(end);
        tipAmountInput.value = sanitizeTipAmountValue(next);
    });

    tipAmountInput.addEventListener('drop', (e) => {
        e.preventDefault();
    });

    tipAmountInput.addEventListener('beforeinput', (e) => {
        if (e.inputType.startsWith('delete')) return;
        if (!e.data) return;
        if (/[^0-9.]/.test(e.data)) {
            e.preventDefault();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tipModal.classList.contains('is-open')) {
            closeTipModal();
        }
    });

    window.addEventListener('scroll', hideTipHoverTooltip, { passive: true });
}


let nameBounceTimer;

function clearNameBounce() {
    if (!nameEl) return;
    nameEl.classList.remove('bounce');
}

function maybeTriggerNameStretchBurst() {
    if (!nameEl) return;
    if (Math.random() > NAME_STRETCH_BURST_CHANCE) return;
    nameEl.classList.remove('stretch-burst');
    void nameEl.offsetWidth;
    nameEl.classList.add('stretch-burst');
}

function armNameBounce() {
    if (!nameWrapper || !nameEl) return;
    clearTimeout(nameBounceTimer);
    clearNameBounce();
    nameBounceTimer = setTimeout(() => {
        if (!nameWrapper.matches(':hover')) return;
        clearNameBounce();
        void nameEl.offsetWidth;
        nameEl.classList.add('bounce');
    }, 5000);
}

if (nameWrapper && nameEl) {
    nameWrapper.addEventListener('mouseenter', () => {
        maybeTriggerNameStretchBurst();
        armNameBounce();
    });
    nameWrapper.addEventListener('mouseleave', () => {
        clearTimeout(nameBounceTimer);
        clearNameBounce();
        nameEl.classList.remove('stretch-burst');
    });
    nameEl.addEventListener('animationend', (e) => {
        if (e.animationName === 'nameBounce') {
            clearNameBounce();
        }
        if (e.animationName === 'nameStretchBurst') {
            nameEl.classList.remove('stretch-burst');
        }
    });
}


function parseMarkdown(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

let nowEntries = [];
let nowIndex = 0;

function renderNowEntry(index) {
    if (!nowEntries.length || !nowLabel || !nowText) return;
    const entry = nowEntries[index];
    nowLabel.textContent = entry.label || 'Now';
    nowText.innerHTML = parseMarkdown(entry.text || '');
}

async function loadNow() {
    if (!nowBox || !nowLabel || !nowText) return;
    try {
        const res = await fetch('now.json');
        if (!res.ok) throw new Error('Failed to load now.json');
        nowEntries = await res.json();
    } catch (err) {
        console.error(err);
        nowEntries = [{ label: 'Now', text: 'Update now.json to configure this box.' }];
    }

    if (!Array.isArray(nowEntries) || !nowEntries.length) {
        nowEntries = [{ label: 'Now', text: 'Add entries to now.json.' }];
    }

    nowIndex = 0;
    renderNowEntry(nowIndex);

    nowBox.addEventListener('click', () => {
        nowIndex = (nowIndex + 1) % nowEntries.length;
        renderNowEntry(nowIndex);
    });
}

function closeActiveVideos() {
    const activeWrappers = document.querySelectorAll('.video-wrapper.active');
    activeWrappers.forEach((wrapper) => {
        const iframe = wrapper.querySelector('iframe');
        if (iframe) {
            iframe.src = '';
        }
        wrapper.classList.remove('active');
    });
}


function toEmbedUrl(url) {
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return url;
}

function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : null;
}

function getYouTubeThumbnail(url) {
    const id = extractYouTubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}


let workProjects = [];
let diaryProjects = [];
let showingDiary = false;

function renderProjectGrid(projects, isDiary = false) {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    const shouldScroll = projects.length > 4;
    grid.classList.toggle('scroll-frame', shouldScroll);
    grid.innerHTML = '';

    projects.forEach((project) => {
        const sourceUrl = project.video || '';
        const embedUrl = toEmbedUrl(sourceUrl);
        const thumbUrl = getYouTubeThumbnail(sourceUrl) || getYouTubeThumbnail(embedUrl);
        const overlayClass = thumbUrl ? 'video-overlay has-thumb' : 'video-overlay';
        const overlayStyle = thumbUrl ? `style="--thumb-image: url('${thumbUrl}')"` : '';
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="video-wrapper">
                <div class="${overlayClass}" ${overlayStyle}><span class="play-icon">▶</span></div>
                <iframe data-src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
            <h3>${project.title || 'Untitled'}</h3>
            ${isDiary ? '' : `<p>${parseMarkdown(project.description || '')}</p>`}
        `;
        grid.appendChild(card);
    });

}

function animateGridSwap(projects, isDiary = false) {
    const grid = document.getElementById('project-grid');
    if (!grid) {
        renderProjectGrid(projects, isDiary);
        return;
    }

    grid.classList.remove('swapping-in');
    grid.classList.add('swapping-out');

    setTimeout(() => {
        renderProjectGrid(projects, isDiary);
        grid.classList.remove('swapping-out');
        grid.classList.add('swapping-in');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                grid.classList.remove('swapping-in');
            });
        });
    }, 220);
}

async function loadWork() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    try {
        const res = await fetch('work.json');
        if (!res.ok) throw new Error('Failed to load work.json');
        workProjects = await res.json();
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p style="color:var(--text-muted)">Couldn\'t load projects.</p>';
        return;
    }

    renderProjectGrid(workProjects, false);
}

async function loadDiary() {
    try {
        const res = await fetch('diary.json');
        if (!res.ok) throw new Error('Failed to load diary.json');
        diaryProjects = await res.json();
    } catch (err) {
        console.error(err);
        diaryProjects = [];
    }
}

function syncDiaryToggleUi() {
    if (!diaryToggle || !diaryLabel) return;
    diaryToggle.classList.toggle('active', showingDiary);
    diaryToggle.setAttribute('aria-pressed', String(showingDiary));
    diaryLabel.textContent = showingDiary ? 'back to work' : 'dev diary';
}

function toggleDiaryView() {
    showingDiary = !showingDiary;
    syncDiaryToggleUi();
    closeActiveVideos();
    animateGridSwap(showingDiary ? diaryProjects : workProjects, showingDiary);
}


document.addEventListener('click', (e) => {
    const overlay = e.target.closest('.video-overlay');
    if (!overlay) return;
    const wrapper = overlay.parentElement;
    const iframe = wrapper.querySelector('iframe');
    if (iframe && iframe.dataset.src) {
        const sep = iframe.dataset.src.includes('?') ? '&' : '?';
        iframe.src = `${iframe.dataset.src}${sep}autoplay=1`;
    }
    wrapper.classList.add('active');
});

document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

    if (e.key === 'Escape') {
        closeActiveVideos();
        return;
    }

    if (window.innerWidth <= 768) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const delta = Math.round(window.innerWidth * 0.68);
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const maxScroll = scrollWrapper.scrollWidth - scrollWrapper.clientWidth;
        scrollTarget = Math.max(0, Math.min(maxScroll, scrollTarget + (dir * delta)));
        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(smoothScroll);
        }
    }
});


setTimeout(() => {
    if (scrollWrapper.scrollLeft === 0) {
        progressContainer.classList.add('visible');
        setTimeout(() => progressContainer.classList.remove('visible'), 2000);
    }
}, 1500);

loadWork();
loadDiary();
loadNow();

if (diaryToggle) {
    syncDiaryToggleUi();
    diaryToggle.addEventListener('click', toggleDiaryView);
}
