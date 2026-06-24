(function () {
    'use strict';

    var CFG_KEY = 'lov_config';
    var POSTS_KEY = 'lov_posts';
    var SPOTS_KEY = 'lov_spots';

    var BAD_WORDS = ['weon', 'wn', 'ctm', 'conchetumadre', 'pico', 'mierda', 'culiao', 'puta', 'maricon', 'huevada', 'huevon', 'qlo', 'kliao', 'chucha', 'carajo', 'la concha', 'loco qlo', 'sapo conchetumadre', 'penca'];

    function filterBadWords(text) {
        var result = text;
        BAD_WORDS.forEach(function (w) {
            var re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
            result = result.replace(re, '***');
        });
        return result;
    }

    var DEFAULT_CFG = {
        primaryColor: '#ffdb00',
        yellowColor: '#ffdb00',
        bgColor: '#0a0a0a',
        cardColor: '#151515',
        textColor: '#f0f0f0',
        navColor: '#0a0a0a',
        siteName: 'LaOtraVereda',
        comunidadTitle: 'Comunidad LOV',
        comunidadDesc: 'Comparte, vota y comenta. Este es tu foro.',
        spotsTitle: 'LaOtraVereda Spots',
        spotsDesc: 'Descubre y reseña lugares alternativos.',
        nosotrosTitle: 'Nosotros',
        nosotrosDesc: 'Somos una comunidad alternativa que busca dar visibilidad a las historias, lugares y personas que normalmente no se ven.',
        contactoTitle: 'Contacto',
        contactoDesc: 'Escribenos y te responderemos a la brevedad.',
        mediaTitle: 'Media',
        mediaDesc: 'Seguinos en nuestras redes y disfruta de todo el contenido.',
        youtubeUrl: 'https://www.youtube.com/@LaOtraVereda-LOV',
        instagramUrl: 'https://instagram.com/laotravereda',
        tiktokUrl: 'https://tiktok.com/@laotravereda',
        logoUrl: '',
    };

    var cfg = loadConfig();
    var currentPage = 'comunidad';
    var currentFilter = 'nuevos';
    var spotsSort = 'nuevos';
    var spotRating = 0;
    var spotRatingInput = null;

    var defaultPosts = [
        { id: '1', title: '"Le perdi el miedo a la calle" - Historia de Don Mario', content: 'Don Mario tiene 62 anos y vive en Estacion Central. Despues de 20 anos de trabajo informal, nos cuenta como la calle le enseno a sobrevivir. Una historia de resiliencia que no te puedes perder.', category: 'Historias de Resiliencia', votes: 47, userVote: 0, comments: [{ author: 'Resiliente', text: 'Que gran historia, Don Mario es un ejemplo.' }, { author: 'Veredero', text: 'La calle tiene esas lecciones que nadie ensena.' }], timestamp: Date.now() - 3600000 },
        { id: '2', title: 'Olla comuniana en La Pintana: la solidaridad no falta', content: 'Viernes en la poblacion. Las vecinas preparan comida para mas de 100 familias. Sin ayuda del estado, puro corazon y organizacion popular.', category: 'Apoyo Comunitario', votes: 63, userVote: 0, comments: [{ author: 'Solidario', text: 'Yo fui ese dia, la empanada mas rica que he comido.' }], timestamp: Date.now() - 7200000 },
        { id: '3', title: 'La picada mas escondida del centro: Fuente Alemana', content: 'En un pasaje del centro de Santiago, detras del mercado, hay un local que vende completos desde 1953. El pan es artesanal y la salsa secreta no la sabe nadie.', category: 'Puntos de Interes', votes: 38, userVote: 0, comments: [{ author: 'Gourmet', text: 'Los completos mas grandes de Santiago!' }, { author: 'Picada', text: 'Pasan el dato de la direccion exacta?' }], timestamp: Date.now() - 10800000 },
    ];

    var defaultSpots = [
        { id: 's1', name: 'Fuente Alemana', location: 'Santiago Centro, Chile', description: 'La picada clasica del centro. Completos monumentales desde 1953. Pan artesanal, salsa secreta y atencion de la que ya no queda.', category: 'Picada', rating: 4.5, reviews: 23, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop', timestamp: Date.now() - 86400000 },
        { id: 's2', name: 'Mirador del Cerro Santa Lucia', location: 'Santiago Centro, Chile', description: 'Mirador gratuito con la mejor vista del centro de Santiago y la cordillera. Ideal para ver el atardecer.', category: 'Cultural', rating: 4, reviews: 15, image: 'https://images.unsplash.com/photo-1586363195254-76bb66e5f3a4?q=80&w=400&auto=format&fit=crop', timestamp: Date.now() - 172800000 },
        { id: 's3', name: 'Persa Bicentenario', location: 'Providencia, Chile', description: 'Feria de emprendedores locales todos los sabados. Artesanias, ropa usada, comida callejera y musica en vivo.', category: 'Urbano', rating: 5, reviews: 31, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=400&auto=format&fit=crop', timestamp: Date.now() - 259200000 },
    ];

    var posts = loadData(POSTS_KEY, defaultPosts);
    var spots = loadData(SPOTS_KEY, defaultSpots);

    /* ===== HELPERS ===== */
    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

    function getTimeAgo(ts) {
        var diff = Date.now() - ts;
        var mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return mins + 'm';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h';
        var days = Math.floor(hrs / 24);
        if (days < 30) return days + 'd';
        return Math.floor(days / 30) + 'mes';
    }

    function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function showToast(msg, type) {
        var t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast ' + (type || '');
        t.offsetHeight;
        t.classList.add('show');
        clearTimeout(t._hide);
        t._hide = setTimeout(function () { t.classList.remove('show'); }, 3000);
    }

    /* ===== STORAGE ===== */
    function loadData(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (raw) { var p = JSON.parse(raw); if (Array.isArray(p) && p.length) return p; }
        } catch (e) {}
        saveData(key, fallback);
        return fallback;
    }

    function saveData(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} }

    function loadConfig() {
        try {
            var raw = localStorage.getItem(CFG_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                var m = {};
                for (var k in DEFAULT_CFG) { m[k] = (k in p) ? p[k] : DEFAULT_CFG[k]; }
                return m;
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULT_CFG));
    }

    function saveConfig() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} }

    /* ===== THEME / CONFIG ===== */
    function applyConfig() {
        var root = document.documentElement;
        root.style.setProperty('--primary', cfg.primaryColor);
        root.style.setProperty('--bg', cfg.bgColor);
        root.style.setProperty('--bg-card', cfg.cardColor);
        root.style.setProperty('--text', cfg.textColor);
        root.style.setProperty('--nav-bg', hexToRgba(cfg.navColor, 0.95));
        root.style.setProperty('--yellow', cfg.yellowColor || '#facc15');

        document.getElementById('siteTitle').textContent = cfg.siteName;
        var logoEl = document.getElementById('navLogo');
        if (cfg.logoUrl && cfg.logoUrl.trim()) {
            logoEl.innerHTML = '<img src="' + esc(cfg.logoUrl.trim()) + '" alt="' + esc(cfg.siteName) + '">';
        } else {
            logoEl.textContent = cfg.siteName;
        }

        setText('comunidadTitle', cfg.comunidadTitle);
        setText('comunidadDesc', cfg.comunidadDesc);
        setText('spotsTitle', cfg.spotsTitle);
        setText('spotsDesc', cfg.spotsDesc);
        setText('nosotrosTitle', cfg.nosotrosTitle);
        setText('nosotrosDesc', cfg.nosotrosDesc);
        setText('contactoTitle', cfg.contactoTitle);
        setText('contactoDesc', cfg.contactoDesc);
        setText('mediaTitle', cfg.mediaTitle);
        setText('mediaDesc', cfg.mediaDesc);

        /* social links */
        var yt = document.getElementById('mediaYoutubeLink');
        if (yt) yt.href = cfg.youtubeUrl || '#';
        var ig = document.getElementById('mediaInstagramLink');
        if (ig) ig.href = cfg.instagramUrl || '#';
        var tt = document.getElementById('mediaTiktokLink');
        if (tt) tt.href = cfg.tiktokUrl || '#';

        /* settings form */
        var map = {
            cfgPrimaryColor: cfg.primaryColor,
            cfgYellowColor: cfg.yellowColor,
            cfgBgColor: cfg.bgColor,
            cfgCardColor: cfg.cardColor,
            cfgTextColor: cfg.textColor,
            cfgNavColor: cfg.navColor,
            cfgSiteName: cfg.siteName,
            cfgComunidadTitle: cfg.comunidadTitle,
            cfgComunidadDesc: cfg.comunidadDesc,
            cfgSpotsTitle: cfg.spotsTitle,
            cfgSpotsDesc: cfg.spotsDesc,
            cfgNosotrosTitle: cfg.nosotrosTitle,
            cfgNosotrosDesc: cfg.nosotrosDesc,
            cfgContactoTitle: cfg.contactoTitle,
            cfgContactoDesc: cfg.contactoDesc,
            cfgMediaTitle: cfg.mediaTitle,
            cfgMediaDesc: cfg.mediaDesc,
            cfgYoutubeUrl: cfg.youtubeUrl,
            cfgInstagramUrl: cfg.instagramUrl,
            cfgTiktokUrl: cfg.tiktokUrl,
            cfgLogoUrl: cfg.logoUrl,
        };
        for (var id in map) {
            var el = document.getElementById(id);
            if (el) el.value = map[id];
        }
    }

    function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

    function hexToRgba(hex, a) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        var r = parseInt(hex.substring(0,2), 16);
        var g = parseInt(hex.substring(2,4), 16);
        var b = parseInt(hex.substring(4,6), 16);
        return 'rgba('+r+','+g+','+b+','+a+')';
    }

    /* ===== SPA NAV ===== */
    function navigateTo(page) {
        if (page === currentPage) return;

        var prev = document.getElementById('page-' + currentPage);
        var next = document.getElementById('page-' + page);

        if (prev) { prev.classList.remove('page-active'); }
        if (next) {
            next.classList.add('page-active');
            next.scrollTop = 0;
        }

        document.querySelectorAll('.nav-link[data-page]').forEach(function (l) {
            l.classList.toggle('active', l.dataset.page === page);
        });

        currentPage = page;
        if (page === 'comunidad') renderPosts();
        if (page === 'spots') renderSpots();
        if (page === 'media') applyConfig(); /* refresh social links */
    }

    function initNav() {
        document.querySelectorAll('[data-page]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                navigateTo(this.dataset.page);
                document.getElementById('navMenu').classList.remove('show');
            });
        });

        var toggle = document.getElementById('navToggle');
        var menu = document.getElementById('navMenu');
        toggle.addEventListener('click', function () { menu.classList.toggle('show'); });
    }

    /* ===== POSTS (Reddit) ===== */
    function renderPosts() {
        var feed = document.getElementById('postsFeed');
        if (!feed) return;

        var sorted = posts.slice();
        if (currentFilter === 'top') { sorted.sort(function (a, b) { return b.votes - a.votes; }); }
        else { sorted.sort(function (a, b) { return b.timestamp - a.timestamp; }); }

        var count = document.getElementById('postCount');
        if (count) count.textContent = sorted.length + ' publicaciones';

        if (!sorted.length) {
            feed.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><h3>Sin publicaciones</h3><p>Sé el primero en publicar.</p></div>';
            return;
        }

        feed.innerHTML = sorted.map(function (p) {
            var vc = p.userVote === 1 ? 'active-up' : p.userVote === -1 ? 'active-down' : '';
            var ch = (p.comments && p.comments.length)
                ? p.comments.map(function (c) { return '<div class="comment"><span class="comment-author">'+esc(c.author)+'</span><p class="comment-text">'+esc(c.text)+'</p></div>'; }).join('')
                : '<p style="color:var(--text-muted);font-size:.8125rem;padding:4px 0;">Sin comentarios.</p>';

            return '<div class="post-card" data-id="'+p.id+'">'
                +'<div class="post-votes">'
                +'<button class="vote-btn up" data-id="'+p.id+'" data-vote="1"><i class="fas fa-arrow-up"></i></button>'
                +'<span class="vote-count">'+p.votes+'</span>'
                +'<button class="vote-btn down" data-id="'+p.id+'" data-vote="-1"><i class="fas fa-arrow-down"></i></button>'
                +'</div>'
                +'<div style="flex:1;display:flex;flex-direction:column;">'
                +'<div class="post-body">'
                +'<div class="post-meta"><span class="post-badge">'+esc(p.category)+'</span><span>'+getTimeAgo(p.timestamp)+'</span></div>'
                +'<div class="post-title">'+esc(p.title)+'</div>'
                +(p.content ? '<p class="post-text">'+esc(p.content)+'</p>' : '')
                +'<div class="post-actions">'
                +'<button class="post-action-btn toggle-comments"><i class="far fa-comment"></i> '+(p.comments ? p.comments.length : 0)+'</button>'
                +'</div></div>'
                +'<div class="comments-section" style="display:none;">'+ch
                +'<div class="comment-form">'
                +'<input type="text" class="comment-input" placeholder="Comentar..." maxlength="300">'
                +'<button class="comment-submit" data-id="'+p.id+'">Enviar</button>'
                +'</div></div></div></div>';
        }).join('');

        /* bind events */
        feed.querySelectorAll('.vote-btn').forEach(function (b) {
            b.addEventListener('click', function () { handleVote(this.dataset.id, parseInt(this.dataset.vote)); });
        });
        feed.querySelectorAll('.toggle-comments').forEach(function (b) {
            b.addEventListener('click', function () {
                var s = this.closest('.post-card').querySelector('.comments-section');
                s.style.display = s.style.display === 'none' ? 'block' : 'none';
            });
        });
        feed.querySelectorAll('.comment-submit').forEach(function (b) {
            b.addEventListener('click', function () {
                var inp = this.parentElement.querySelector('.comment-input');
                var t = inp.value.trim();
                if (!t) return;
                addComment(this.dataset.id, t);
                inp.value = '';
            });
        });
        feed.querySelectorAll('.comment-input').forEach(function (b) {
            b.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); var btn = this.parentElement.querySelector('.comment-submit'); if (btn) btn.click(); }
            });
        });
    }

    function handleVote(id, vote) {
        var p = posts.find(function (x) { return x.id === id; });
        if (!p) return;
        if (p.userVote === vote) { p.votes -= vote; p.userVote = 0; }
        else { p.votes += vote - (p.userVote || 0); p.userVote = vote; }
        saveData(POSTS_KEY, posts);
        renderPosts();
    }

    function addComment(id, text) {
        var p = posts.find(function (x) { return x.id === id; });
        if (!p) return;
        if (!p.comments) p.comments = [];
        var clean = filterBadWords(text.trim());
        p.comments.push({ author: 'Anonimo', text: clean });
        saveData(POSTS_KEY, posts);
        renderPosts();
    }

    function createPost(title, content, category) {
        if (!title.trim()) { showToast('El titulo es obligatorio', 'error'); return; }
        posts.unshift({ id: uid(), title: filterBadWords(title.trim()), content: filterBadWords(content.trim() || ''), category: category, votes: 0, userVote: 0, comments: [], timestamp: Date.now() });
        saveData(POSTS_KEY, posts);
        renderPosts();
        showToast('Publicado!', 'success');
    }

    /* ===== SPOTS (TravelAdvisor) ===== */
    function renderSpots() {
        var grid = document.getElementById('spotsGrid');
        if (!grid) return;

        var sorted = spots.slice();
        if (spotsSort === 'rating') { sorted.sort(function (a, b) { return b.rating - a.rating; }); }
        else { sorted.sort(function (a, b) { return b.timestamp - a.timestamp; }); }

        var count = document.getElementById('spotsCount');
        if (count) count.textContent = sorted.length + ' spots';

        if (!sorted.length) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-map-pin"></i><h3>Sin spots</h3><p>Agrega el primero.</p></div>';
            return;
        }

        grid.innerHTML = sorted.map(function (s) {
            var stars = '';
            var full = Math.floor(s.rating);
            var half = (s.rating - full) >= 0.5;
            for (var i = 1; i <= 5; i++) {
                if (i <= full) stars += '<i class="fas fa-star"></i>';
                else if (i === full + 1 && half) stars += '<i class="fas fa-star-half-alt"></i>';
                else stars += '<i class="far fa-star"></i>';
            }
            var hasImg = s.image && s.image.trim();
            var imgStyle = hasImg ? ' style="background-image:url(' + esc(s.image) + ')" class="spot-image has-img"' : ' class="spot-image"';
            var imgContent = hasImg ? '' : '<div class="img-placeholder"><i class="fas fa-map-marked-alt"></i></div>';
            return '<div class="spot-card" data-id="' + s.id + '">'
                + '<div' + imgStyle + '>' + imgContent + '</div>'
                + '<div class="spot-info">'
                + '<div class="spot-info-header">'
                + '<h3>' + esc(s.name) + '</h3>'
                + '<span class="spot-rating">' + stars + '</span>'
                + '</div>'
                + '<div class="spot-location"><i class="fas fa-map-marker-alt"></i>' + esc(s.location) + '</div>'
                + '<p>' + esc(s.description) + '</p>'
                + '<div class="spot-footer">'
                + '<span class="spot-tag">' + esc(s.category) + '</span>'
                + '<div><span class="spot-reviews"><i class="far fa-comment"></i> ' + s.reviews + ' reseñas</span>'
                + '<button class="spot-edit-btn" data-id="' + s.id + '"><i class="fas fa-pen"></i></button></div>'
                + '</div></div></div>';
        }).join('');

        /* bind edit buttons */
        grid.querySelectorAll('.spot-edit-btn').forEach(function (b) {
            b.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleEditSpot(this.dataset.id);
            });
        });
    }

    function toggleEditSpot(id) {
        var spot = spots.find(function (x) { return x.id === id; });
        if (!spot) return;

        var card = document.querySelector('.spot-card[data-id="' + id + '"]');
        if (!card) return;

        if (card.classList.contains('editing')) {
            /* already editing, do nothing */
            return;
        }

        /* save current data in edit mode */
        card.classList.add('editing');

        var editCategories = ['Picada', 'Cultural', 'Naturaleza', 'Urbano', 'Gastron\u00f3mico'];
        var catOpts = editCategories.map(function (c) {
            return '<option value="' + c + '"' + (spot.category === c ? ' selected' : '') + '>' + c + '</option>';
        }).join('');

        var imgHtml = '<input type="text" class="spot-edit-img-input" placeholder="URL de la imagen (dejar vacio para icono)" value="' + esc(spot.image || '') + '">';
        var infoHtml = card.querySelector('.spot-info');

        card.querySelector('.spot-image').innerHTML = imgHtml;

        var h3 = infoHtml.querySelector('h3');
        var loc = infoHtml.querySelector('.spot-location');
        var desc = infoHtml.querySelector('p');
        var footer = infoHtml.querySelector('.spot-footer');

        /* replace text with inputs */
        h3.outerHTML = '<input type="text" class="spot-edit-field spot-edit-name" value="' + esc(spot.name) + '">';
        if (loc) loc.outerHTML = '<div class="spot-location"><i class="fas fa-map-marker-alt"></i><input type="text" class="spot-edit-field spot-edit-loc" value="' + esc(spot.location) + '" style="display:inline;width:calc(100% - 20px);margin-bottom:0;"></div>';
        if (desc) desc.outerHTML = '<textarea class="spot-edit-textarea spot-edit-desc">' + esc(spot.description) + '</textarea>';

        var tag = footer ? footer.querySelector('.spot-tag') : null;
        var reviewsEl = footer ? footer.querySelector('.spot-reviews') : null;
        var editBtn = footer ? footer.querySelector('.spot-edit-btn') : null;

        var footerHtml = '<div class="spot-footer">';
        if (tag) {
            footerHtml += '<select class="spot-edit-select spot-edit-cat">' + catOpts + '</select>';
        }
        footerHtml += '<div>';
        if (reviewsEl) footerHtml += reviewsEl.outerHTML;
        footerHtml += '<div class="spot-edit-actions">'
            + '<button class="spot-save-btn" data-id="' + id + '">Guardar</button>'
            + '<button class="spot-cancel-btn" data-id="' + id + '">Cancelar</button>'
            + '</div></div></div>';

        if (footer) footer.outerHTML = footerHtml;

        /* bind save */
        card.querySelector('.spot-save-btn').addEventListener('click', function () { saveSpot(id); });
        card.querySelector('.spot-cancel-btn').addEventListener('click', function () { cancelEditSpot(id); });

        /* enter key in name field saves */
        card.querySelector('.spot-edit-name').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') saveSpot(id);
        });
    }

    function saveSpot(id) {
        var spot = spots.find(function (x) { return x.id === id; });
        if (!spot) return;

        var card = document.querySelector('.spot-card[data-id="' + id + '"]');
        if (!card) return;

        var imgInput = card.querySelector('.spot-edit-img-input');
        var nameInput = card.querySelector('.spot-edit-name');
        var locInput = card.querySelector('.spot-edit-loc');
        var descInput = card.querySelector('.spot-edit-desc');
        var catSelect = card.querySelector('.spot-edit-cat');

        if (nameInput && nameInput.value.trim()) spot.name = filterBadWords(nameInput.value.trim());
        if (locInput && locInput.value.trim()) spot.location = locInput.value.trim();
        if (descInput) spot.description = filterBadWords(descInput.value);
        if (catSelect) spot.category = catSelect.value;
        if (imgInput) spot.image = imgInput.value.trim() || '';

        saveData(SPOTS_KEY, spots);
        renderSpots();
        showToast('Spot actualizado', 'success');
    }

    function cancelEditSpot(id) {
        renderSpots();
    }

    function addSpot(name, location, description, category, rating, image) {
        if (!name.trim() || !location.trim()) { showToast('Nombre y ubicacion requeridos', 'error'); return; }
        spots.unshift({ id: uid(), name: filterBadWords(name.trim()), location: location.trim(), description: filterBadWords(description.trim() || ''), category: category, rating: rating || 0, reviews: 0, image: image || '', timestamp: Date.now() });
        saveData(SPOTS_KEY, spots);
        renderSpots();
        showToast('Spot agregado!', 'success');
    }

    /* ===== FORMS ===== */
    function initPostForm() {
        var btn = document.getElementById('postBtn');
        var title = document.getElementById('postTitle');
        var content = document.getElementById('postContent');
        var cat = document.getElementById('postCategory');
        if (!btn) return;
        btn.addEventListener('click', function () { createPost(title.value, content.value, cat.value); title.value = ''; content.value = ''; });
        title.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); content.focus(); } });
    }

    function initSpotForm() {
        var btn = document.getElementById('spotBtn');
        var name = document.getElementById('spotName');
        var loc = document.getElementById('spotLocation');
        var img = document.getElementById('spotImage');
        var desc = document.getElementById('spotDesc');
        var cat = document.getElementById('spotCategory');
        if (!btn) return;

        /* Star rating input */
        var stars = document.querySelectorAll('#spotRatingInput .stars i');
        var valDisplay = document.getElementById('spotRatingValue');
        stars.forEach(function (s) {
            s.addEventListener('click', function () {
                spotRating = parseInt(this.dataset.rating);
                updateStarInput(stars, spotRating, valDisplay);
            });
            s.addEventListener('mouseenter', function () {
                var r = parseInt(this.dataset.rating);
                updateStarInput(stars, r, null);
            });
            s.addEventListener('mouseleave', function () {
                updateStarInput(stars, spotRating, valDisplay);
            });
        });

        btn.addEventListener('click', function () {
            addSpot(name.value, loc.value, desc.value, cat.value, spotRating, img.value);
            name.value = ''; loc.value = ''; img.value = ''; desc.value = ''; spotRating = 0;
            updateStarInput(stars, 0, valDisplay);
        });
    }

    function updateStarInput(stars, rating, display) {
        stars.forEach(function (s) {
            var r = parseInt(s.dataset.rating);
            s.className = r <= rating ? 'fas fa-star active' : 'far fa-star';
        });
        if (display) display.textContent = rating;
    }

    function initContact() {
        var form = document.getElementById('contactForm');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = document.getElementById('contactName').value.trim();
            var email = document.getElementById('contactEmail').value.trim();
            var subject = document.getElementById('contactSubject').value;
            var msg = document.getElementById('contactMessage').value.trim();
            if (!name || !email || !subject || !msg) { showToast('Todos los campos son obligatorios', 'error'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Email invalido', 'error'); return; }
            showToast('Mensaje enviado!', 'success');
            form.reset();
        });
    }

    function initFilters() {
        document.querySelectorAll('.filter-btn').forEach(function (b) {
            b.addEventListener('click', function () {
                document.querySelectorAll('.filter-btn').forEach(function (x) { x.classList.remove('active'); });
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderPosts();
            });
        });

        var sort = document.getElementById('spotsSort');
        if (sort) {
            sort.addEventListener('change', function () { spotsSort = this.value; renderSpots(); });
        }
    }

    /* ===== SETTINGS ===== */
    function initSettings() {
        ['cfgPrimaryColor','cfgYellowColor','cfgBgColor','cfgCardColor','cfgTextColor','cfgNavColor'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', function () {
                var key = id.replace('cfg', ''); key = key.charAt(0).toLowerCase() + key.slice(1);
                cfg[key] = this.value; saveConfig(); applyConfig();
            });
        });

        ['cfgSiteName','cfgComunidadTitle','cfgComunidadDesc','cfgSpotsTitle','cfgSpotsDesc','cfgNosotrosTitle','cfgContactoTitle','cfgContactoDesc','cfgMediaTitle','cfgMediaDesc','cfgYoutubeUrl','cfgInstagramUrl','cfgTiktokUrl','cfgLogoUrl'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', function () {
                var key = id.replace('cfg', ''); key = key.charAt(0).toLowerCase() + key.slice(1);
                cfg[key] = this.value; saveConfig(); applyConfig();
            });
        });

        var ta = document.getElementById('cfgNosotrosDesc');
        if (ta) {
            ta.addEventListener('input', function () { cfg.nosotrosDesc = this.value; saveConfig(); applyConfig(); });
        }

        var reset = document.getElementById('resetSettingsBtn');
        if (reset) {
            reset.addEventListener('click', function () {
                if (!confirm('Restablecer valores?')) return;
                cfg = JSON.parse(JSON.stringify(DEFAULT_CFG));
                saveConfig(); applyConfig();
                showToast('Valores restablecidos', 'success');
            });
        }

        var exp = document.getElementById('exportSettingsBtn');
        if (exp) {
            exp.addEventListener('click', function () {
                var blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a'); a.href = url; a.download = 'lov-config.json'; a.click();
                URL.revokeObjectURL(url);
                showToast('Configuracion exportada', 'success');
            });
        }

        var impBtn = document.getElementById('importSettingsBtn');
        var impFile = document.getElementById('importSettingsFile');
        if (impBtn && impFile) {
            impBtn.addEventListener('click', function () { impFile.click(); });
            impFile.addEventListener('change', function (e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        var imported = JSON.parse(ev.target.result);
                        for (var k in imported) { if (k in cfg) cfg[k] = imported[k]; }
                        saveConfig(); applyConfig();
                        showToast('Configuracion importada', 'success');
                    } catch (e) { showToast('Archivo invalido', 'error'); }
                };
                reader.readAsText(file);
                impFile.value = '';
            });
        }
    }

    /* ===== INIT ===== */
    function init() {
        applyConfig();
        initNav();
        initPostForm();
        initSpotForm();
        initContact();
        initFilters();
        initSettings();
        renderPosts();
        renderSpots();
        navigateTo('comunidad');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }

})();
