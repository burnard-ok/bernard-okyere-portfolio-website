const analyticsConsent = (() => {
    const consentStorageKey = 'portfolio-analytics-consent';
    const windowNamePrefix = '__bernardokyere_consent=';
    const measurementId = 'G-3RS9DEQXCL';
    let analyticsLoaded = false;

    const readStoredChoice = storage => {
        try {
            const choice = storage.getItem(consentStorageKey);
            return choice === 'granted' || choice === 'denied' ? choice : null;
        } catch {
            return null;
        }
    };

    const getChoice = () => {
        const sessionChoice = readStoredChoice(sessionStorage);
        if (sessionChoice) {
            return sessionChoice;
        }

        const savedChoice = readStoredChoice(localStorage);
        if (savedChoice) {
            return savedChoice;
        }

        const cookiePrefix = `${consentStorageKey}=`;
        const consentCookie = document.cookie.split('; ').find(cookie => cookie.startsWith(cookiePrefix));
        if (consentCookie) {
            return consentCookie.slice(cookiePrefix.length);
        }

        const windowChoice = window.name.split('|').find(value => value.startsWith(windowNamePrefix));
        const choice = windowChoice ? windowChoice.slice(windowNamePrefix.length) : null;
        return choice === 'granted' || choice === 'denied' ? choice : null;
    };

    const saveChoice = choice => {
        try {
            sessionStorage.setItem(consentStorageKey, choice);
        } catch {
            // Continue with local storage and the first-party cookie.
        }
        try {
            localStorage.setItem(consentStorageKey, choice);
        } catch {
            // The first-party cookie below preserves the choice if storage is blocked.
        }
        const cookieDomain = location.hostname.endsWith('bernardokyere.com') ? '; Domain=bernardokyere.com' : '';
        document.cookie = `${consentStorageKey}=${choice}; Max-Age=31536000; Path=/; SameSite=Lax; Secure${cookieDomain}`;
        const retainedWindowName = window.name.split('|').filter(value => !value.startsWith(windowNamePrefix));
        retainedWindowName.push(`${windowNamePrefix}${choice}`);
        window.name = retainedWindowName.join('|');
    };

    const clearAnalyticsCookies = () => {
        document.cookie.split(';').forEach(cookie => {
            const name = cookie.trim().split('=')[0];
            if (name.startsWith('_ga')) {
                document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
            }
        });
    };

    const loadAnalytics = () => {
        if (analyticsLoaded) {
            return;
        }

        analyticsLoaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag() {
            window.dataLayer.push(arguments);
        };

        window.gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
        window.gtag('js', new Date());
        window.gtag('config', measurementId);

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.append(script);
    };

    const grant = () => {
        saveChoice('granted');
        loadAnalytics();
    };

    const deny = () => {
        saveChoice('denied');
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', { analytics_storage: 'denied' });
        }
        clearAnalyticsCookies();
    };

    if (getChoice() === 'granted') {
        loadAnalytics();
    }

    return { getChoice, grant, deny };
})();

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.copyright-year').forEach(year => {
        year.textContent = new Date().getFullYear();
    });

    const cookieBanner = document.createElement('section');
    cookieBanner.className = 'cookie-banner';
    cookieBanner.setAttribute('role', 'dialog');
    cookieBanner.setAttribute('aria-modal', 'false');
    cookieBanner.setAttribute('aria-labelledby', 'cookie-banner-title');
    cookieBanner.setAttribute('aria-describedby', 'cookie-banner-description');
    cookieBanner.hidden = true;
    cookieBanner.innerHTML = `
        <h2 id="cookie-banner-title">Your privacy choices</h2>
        <p id="cookie-banner-description">This site uses optional analytics cookies to understand visitor activity. You can accept or reject analytics cookies and change your choice at any time.</p>
        <p class="cookie-banner-link"><a href="/contact#privacy-notice" data-privacy-notice>Read the privacy notice</a></p>
        <div class="cookie-banner-actions">
            <button class="btn btn-outline-primary" type="button" data-cookie-reject>Reject</button>
            <button class="btn btn-primary" type="button" data-cookie-accept>Accept analytics</button>
        </div>
    `;

    const showCookieBanner = () => {
        cookieBanner.hidden = false;
        cookieBanner.querySelector('[data-cookie-accept]').focus();
    };

    const hideCookieBanner = () => {
        cookieBanner.hidden = true;
    };

    cookieBanner.querySelector('[data-cookie-accept]').addEventListener('click', () => {
        analyticsConsent.grant();
        hideCookieBanner();
    });

    cookieBanner.querySelector('[data-cookie-reject]').addEventListener('click', () => {
        analyticsConsent.deny();
        hideCookieBanner();
    });

    document.querySelectorAll('.footer-cookie-settings').forEach(button => {
        button.addEventListener('click', showCookieBanner);
    });

    const privacyModal = document.createElement('section');
    privacyModal.className = 'privacy-modal';
    privacyModal.setAttribute('role', 'dialog');
    privacyModal.setAttribute('aria-modal', 'true');
    privacyModal.setAttribute('aria-labelledby', 'privacy-modal-title');
    privacyModal.hidden = true;
    privacyModal.innerHTML = `
        <div class="privacy-modal-backdrop" data-privacy-close></div>
        <div class="privacy-modal-card" role="document">
            <button class="privacy-modal-close" type="button" aria-label="Close privacy notice" data-privacy-close>&times;</button>
            <h2 id="privacy-modal-title">Privacy notice</h2>
            <p>This website uses optional Google Analytics cookies to understand aggregate visitor activity, including pages viewed, browser and device information, and approximate location.</p>
            <p>Contact-form submissions are processed by Google Forms and include the information you choose to provide, such as your name, organisation, email address, phone number, and message.</p>
            <p>You can accept or reject analytics cookies and change your choice at any time through Cookie settings in the footer.</p>
        </div>
    `;

    let privacyModalTrigger = null;
    const openPrivacyModal = trigger => {
        privacyModalTrigger = trigger;
        privacyModal.hidden = false;
        privacyModal.querySelector('.privacy-modal-close').focus();
    };
    const closePrivacyModal = () => {
        privacyModal.hidden = true;
        if (privacyModalTrigger) {
            privacyModalTrigger.focus();
        }
    };

    cookieBanner.querySelector('[data-privacy-notice]').addEventListener('click', event => {
        event.preventDefault();
        openPrivacyModal(event.currentTarget);
    });

    document.querySelectorAll('[data-privacy-notice]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            openPrivacyModal(link);
        });
    });

    privacyModal.querySelectorAll('[data-privacy-close]').forEach(element => {
        element.addEventListener('click', closePrivacyModal);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !privacyModal.hidden) {
            closePrivacyModal();
        }
    });

    document.body.append(cookieBanner, privacyModal);
    if (analyticsConsent.getChoice() !== 'granted' && analyticsConsent.getChoice() !== 'denied') {
        showCookieBanner();
    }

    document.querySelectorAll('[data-phone-input]').forEach(phoneInput => {
        phoneInput.addEventListener('input', () => {
            phoneInput.value = phoneInput.value.replace(/[^0-9+\s()-]/g, '');
        });
    });

    document.querySelectorAll('[data-contact-form]').forEach(contactForm => {
        const successMessage = document.getElementById(contactForm.dataset.successTarget);
        const submitButton = contactForm.querySelector('[type="submit"]');

        contactForm.addEventListener('submit', event => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            if (successMessage) {
                successMessage.hidden = true;
            }
            if (submitButton) {
                submitButton.disabled = true;
            }

            fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            })
                .then(() => {
                    contactForm.reset();
                    if (successMessage) {
                        successMessage.hidden = false;
                    }
                })
                .catch(() => {
                    if (successMessage) {
                        successMessage.classList.remove('alert-success');
                        successMessage.classList.add('alert-danger');
                        successMessage.textContent = 'Unable to send your message. Please try again.';
                        successMessage.hidden = false;
                    }
                })
                .finally(() => {
                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                });
        });
    });

    const themeStorageKey = 'portfolio-theme';
    const root = document.documentElement;
    const savedTheme = localStorage.getItem(themeStorageKey);
    const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)');

    if (savedTheme === 'dark' || (savedTheme === null && prefersDarkTheme.matches)) {
        root.dataset.theme = 'dark';
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-pressed', root.dataset.theme === 'dark' ? 'true' : 'false');

    const updateToggle = () => {
        const isDark = root.dataset.theme === 'dark';
        toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        toggle.setAttribute('aria-pressed', String(isDark));
        toggle.innerHTML = isDark
            ? '<i class="bi bi-sun-fill" aria-hidden="true"></i><span>Light mode</span>'
            : '<i class="bi bi-moon-stars-fill" aria-hidden="true"></i><span>Dark mode</span>';
    };

    toggle.addEventListener('click', () => {
        const isDark = root.dataset.theme === 'dark';
        if (isDark) {
            delete root.dataset.theme;
            localStorage.setItem(themeStorageKey, 'light');
        } else {
            root.dataset.theme = 'dark';
            localStorage.setItem(themeStorageKey, 'dark');
        }
        updateToggle();
    });

    prefersDarkTheme.addEventListener('change', event => {
        if (localStorage.getItem(themeStorageKey) !== null) {
            return;
        }

        if (event.matches) {
            root.dataset.theme = 'dark';
        } else {
            delete root.dataset.theme;
        }
        updateToggle();
    });

    updateToggle();
    document.body.append(toggle);

    const zoomStorageKey = 'portfolio-zoom';
    const zoomLevels = [50, 75, 90, 100, 110, 125, 150, 175, 200];
    const savedZoom = Number.parseInt(localStorage.getItem(zoomStorageKey), 10);
    let zoom = zoomLevels.includes(savedZoom) ? savedZoom : 100;

    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.setAttribute('role', 'group');
    zoomControls.setAttribute('aria-label', 'Page zoom controls');

    const decreaseZoom = document.createElement('button');
    decreaseZoom.type = 'button';
    decreaseZoom.innerHTML = '<i class="bi bi-dash-lg" aria-hidden="true"></i>';
    decreaseZoom.setAttribute('aria-label', 'Decrease page size');
    decreaseZoom.setAttribute('title', 'Decrease page size');

    const resetZoom = document.createElement('button');
    resetZoom.type = 'button';
    resetZoom.innerHTML = '<span aria-hidden="true">100%</span>';
    resetZoom.setAttribute('aria-label', 'Reset page size');
    resetZoom.setAttribute('title', 'Reset page size');

    const increaseZoom = document.createElement('button');
    increaseZoom.type = 'button';
    increaseZoom.innerHTML = '<i class="bi bi-plus-lg" aria-hidden="true"></i>';
    increaseZoom.setAttribute('aria-label', 'Increase page size');
    increaseZoom.setAttribute('title', 'Increase page size');

    const updateZoom = () => {
        root.style.fontSize = `${zoom}%`;
        localStorage.setItem(zoomStorageKey, String(zoom));
        resetZoom.innerHTML = `<span aria-hidden="true">${zoom}%</span>`;
        decreaseZoom.disabled = zoom === zoomLevels[0];
        increaseZoom.disabled = zoom === zoomLevels[zoomLevels.length - 1];
    };

    decreaseZoom.addEventListener('click', () => {
        zoom = zoomLevels[Math.max(0, zoomLevels.indexOf(zoom) - 1)];
        updateZoom();
    });

    resetZoom.addEventListener('click', () => {
        zoom = 100;
        updateZoom();
    });

    increaseZoom.addEventListener('click', () => {
        zoom = zoomLevels[Math.min(zoomLevels.length - 1, zoomLevels.indexOf(zoom) + 1)];
        updateZoom();
    });

    zoomControls.append(decreaseZoom, resetZoom, increaseZoom);
    updateZoom();
    document.body.append(zoomControls);
});
