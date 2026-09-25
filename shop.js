// Amazon Clone - Interactive Shopping & Store Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Cart
    initCart();

    // 2. Setup Back to Top
    const backToTopBtn = document.querySelector('.foot-panel1');
    if (backToTopBtn) {
        backToTopBtn.style.cursor = 'pointer';
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 3. Setup Add to Cart Listeners
    setupAddToCart();

    // 4. Setup Quick View Modal
    setupQuickViewModal();

    // 5. Setup Live Filter & Search
    setupFiltersAndSearch();
});

/* ================= CART MANAGEMENT ================= */
function getCartCount() {
    return parseInt(localStorage.getItem('amazon_clone_cart_count') || '0', 10);
}

function updateCartBadges(count) {
    localStorage.setItem('amazon_clone_cart_count', count.toString());
    const cartElements = document.querySelectorAll('.nav-cart');
    cartElements.forEach(el => {
        let badge = el.querySelector('.cart-count-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-count-badge';
            el.appendChild(badge);
        }
        badge.textContent = count;
    });
}

function initCart() {
    updateCartBadges(getCartCount());
}

function setupAddToCart() {
    const addBtns = document.querySelectorAll('.btn-add-cart');
    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.product-card');
            const title = card ? card.querySelector('.product-title')?.textContent.trim() : 'Product';
            const price = card ? card.querySelector('.price-main')?.textContent.trim() : '';
            const newCount = getCartCount() + 1;
            updateCartBadges(newCount);
            showCartToast(title, price);
        });
    });
}

/* ================= TOAST NOTIFICATION ================= */
function showCartToast(title, price) {
    let toast = document.querySelector('.cart-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'cart-toast';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid fa-check"></i></div>
        <div class="toast-message">
            <strong>Added to Cart!</strong>
            <div>${title.length > 40 ? title.substring(0, 38) + '...' : title} ${price ? '(' + price + ')' : ''}</div>
        </div>
    `;

    toast.classList.add('show');
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

/* ================= QUICK VIEW MODAL ================= */
function setupQuickViewModal() {
    const modal = document.getElementById('quickViewModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Quick View Trigger Buttons
    document.querySelectorAll('.btn-quick-view, .product-image-wrap, .product-title').forEach(el => {
        el.addEventListener('click', () => {
            const card = el.closest('.product-card');
            if (!card) return;
            openProductModal(card, modal);
        });
    });
}

function openProductModal(card, modal) {
    const title = card.getAttribute('data-title') || card.querySelector('.product-title')?.textContent;
    const category = card.getAttribute('data-category') || '';
    const brand = card.getAttribute('data-brand') || '';
    const price = card.getAttribute('data-price') || '';
    const mrp = card.getAttribute('data-mrp') || '';
    const discount = card.getAttribute('data-discount') || '';
    const rating = card.getAttribute('data-rating') || '4.5';
    const reviews = card.getAttribute('data-reviews') || '1,200';
    const imgSrc = card.querySelector('.product-image-wrap img')?.getAttribute('src');
    const specsStr = card.getAttribute('data-specs') || '';

    // Populate modal
    const modalImg = modal.querySelector('#modalProductImg');
    if (modalImg && imgSrc) modalImg.src = imgSrc;

    const modalTitle = modal.querySelector('#modalProductTitle');
    if (modalTitle) modalTitle.textContent = title;

    const modalCategory = modal.querySelector('#modalCategoryTag');
    if (modalCategory) modalCategory.textContent = category.toUpperCase() + (brand ? ' • ' + brand.toUpperCase() : '');

    const modalPrice = modal.querySelector('#modalPrice');
    if (modalPrice) modalPrice.textContent = '$' + price;

    const modalMrp = modal.querySelector('#modalMrp');
    if (modalMrp) modalMrp.textContent = '$' + mrp;

    const modalDiscount = modal.querySelector('#modalDiscount');
    if (modalDiscount) modalDiscount.textContent = discount ? discount + '% off' : '';

    const modalRating = modal.querySelector('#modalRatingCount');
    if (modalRating) modalRating.textContent = `${rating} (${reviews} global ratings)`;

    // Specs table
    const specsBody = modal.querySelector('#modalSpecsBody');
    if (specsBody) {
        specsBody.innerHTML = '';
        if (specsStr) {
            const pairs = specsStr.split(';');
            pairs.forEach(pair => {
                const [k, v] = pair.split(':');
                if (k && v) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td class="spec-name">${k.trim()}</td><td>${v.trim()}</td>`;
                    specsBody.appendChild(row);
                }
            });
        }
    }

    // Modal Add To Cart button
    const modalAddBtn = modal.querySelector('#modalAddToCartBtn');
    if (modalAddBtn) {
        modalAddBtn.onclick = () => {
            const qtySelect = modal.querySelector('#modalQtySelect');
            const qty = qtySelect ? parseInt(qtySelect.value, 10) : 1;
            const newCount = getCartCount() + qty;
            updateCartBadges(newCount);
            showCartToast(title, '$' + price);
            modal.classList.remove('active');
        };
    }

    modal.classList.add('active');
}

/* ================= FILTER & SEARCH LOGIC ================= */
function setupFiltersAndSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');
    const sortSelect = document.querySelector('.sort-select');
    const brandCheckboxes = document.querySelectorAll('input[name="brand"]');
    const categoryPills = document.querySelectorAll('.subnav-pill');
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    const primeCheck = document.querySelector('input[name="primeOnly"]');
    const clearBtn = document.querySelector('.clear-filters-btn');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const priceGoBtn = document.getElementById('priceGoBtn');

    let currentFilters = {
        search: '',
        category: 'all',
        brands: [],
        primeOnly: false,
        minPrice: 0,
        maxPrice: Infinity,
        sortBy: 'featured'
    };

    function applyFilters() {
        const cards = Array.from(document.querySelectorAll('.product-card'));
        let visibleCount = 0;

        cards.forEach(card => {
            const title = (card.getAttribute('data-title') || '').toLowerCase();
            const brand = (card.getAttribute('data-brand') || '').toLowerCase();
            const category = (card.getAttribute('data-category') || '').toLowerCase();
            const price = parseFloat(card.getAttribute('data-price') || '0');
            const isPrime = card.getAttribute('data-prime') === 'true';

            // Check search match
            const matchesSearch = !currentFilters.search || 
                title.includes(currentFilters.search) || 
                brand.includes(currentFilters.search) || 
                category.includes(currentFilters.search);

            // Check category match
            const matchesCategory = currentFilters.category === 'all' || category === currentFilters.category;

            // Check brand match
            const matchesBrand = currentFilters.brands.length === 0 || currentFilters.brands.includes(brand);

            // Check prime
            const matchesPrime = !currentFilters.primeOnly || isPrime;

            // Check price
            const matchesPrice = price >= currentFilters.minPrice && price <= currentFilters.maxPrice;

            if (matchesSearch && matchesCategory && matchesBrand && matchesPrime && matchesPrice) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Update count
        const countDisplay = document.querySelector('.results-count strong');
        if (countDisplay) {
            countDisplay.textContent = visibleCount;
        }

        // Apply sort
        sortProducts(currentFilters.sortBy);
    }

    function sortProducts(criteria) {
        const grid = document.querySelector('.products-grid');
        if (!grid) return;

        const cards = Array.from(grid.children);
        cards.sort((a, b) => {
            const priceA = parseFloat(a.getAttribute('data-price') || '0');
            const priceB = parseFloat(b.getAttribute('data-price') || '0');
            const ratingA = parseFloat(a.getAttribute('data-rating') || '0');
            const ratingB = parseFloat(b.getAttribute('data-rating') || '0');

            if (criteria === 'price-low') return priceA - priceB;
            if (criteria === 'price-high') return priceB - priceA;
            if (criteria === 'rating') return ratingB - ratingA;
            return 0; // featured default
        });

        cards.forEach(card => grid.appendChild(card));
    }

    // Search events
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.toLowerCase().trim();
            applyFilters();
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentFilters.search = e.target.value.toLowerCase().trim();
                applyFilters();
            }
        });
    }

    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            if (searchInput) {
                currentFilters.search = searchInput.value.toLowerCase().trim();
                applyFilters();
            }
        });
    }

    // Category pills
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilters.category = pill.getAttribute('data-category')?.toLowerCase() || 'all';
            applyFilters();
        });
    });

    // Category Radios
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            currentFilters.category = radio.value.toLowerCase();
            // Sync pills
            categoryPills.forEach(p => {
                if ((p.getAttribute('data-category') || '').toLowerCase() === currentFilters.category) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
            applyFilters();
        });
    });

    // Brand checkboxes
    brandCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            currentFilters.brands = Array.from(brandCheckboxes)
                .filter(c => c.checked)
                .map(c => c.value.toLowerCase());
            applyFilters();
        });
    });

    // Prime checkbox
    if (primeCheck) {
        primeCheck.addEventListener('change', () => {
            currentFilters.primeOnly = primeCheck.checked;
            applyFilters();
        });
    }

    // Price Filter
    if (priceGoBtn) {
        priceGoBtn.addEventListener('click', () => {
            const min = parseFloat(minPriceInput?.value || '0');
            const max = parseFloat(maxPriceInput?.value || '999999');
            currentFilters.minPrice = isNaN(min) ? 0 : min;
            currentFilters.maxPrice = isNaN(max) ? Infinity : max;
            applyFilters();
        });
    }

    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            applyFilters();
        });
    }

    // Clear filters
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            currentFilters = {
                search: '',
                category: 'all',
                brands: [],
                primeOnly: false,
                minPrice: 0,
                maxPrice: Infinity,
                sortBy: 'featured'
            };
            if (searchInput) searchInput.value = '';
            if (minPriceInput) minPriceInput.value = '';
            if (maxPriceInput) maxPriceInput.value = '';
            if (primeCheck) primeCheck.checked = false;
            brandCheckboxes.forEach(cb => cb.checked = false);
            categoryRadios.forEach(cr => { cr.checked = cr.value === 'all'; });
            categoryPills.forEach((p, idx) => {
                if (idx === 0) p.classList.add('active');
                else p.classList.remove('active');
            });
            if (sortSelect) sortSelect.value = 'featured';
            applyFilters();
        });
    }
}
