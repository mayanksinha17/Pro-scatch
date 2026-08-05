document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("productGrid");
    if (!grid) return; // not on the shop page

    const searchInput = document.getElementById("searchInput");
    const priceRange = document.getElementById("priceRange");
    const priceRangeValue = document.getElementById("priceRangeValue");
    const sortSelect = document.getElementById("sortSelect");
    const resetBtn = document.getElementById("resetFilters");
    const resultCount = document.getElementById("resultCount");
    const paginationEl = document.getElementById("pagination");

    const PAGE_SIZE = 9;
    let allProducts = [];
    let currentPage = 1;

    function money(n) {
        return "₹" + Number(n).toLocaleString("en-IN");
    }

    function cardHtml(p) {
        const finalPrice = p.price - (p.price * (p.discount || 0)) / 100;
        return `
        <div class="col-6 col-md-4">
            <div class="product-card fade-up">
                <a href="/product/${p._id}" class="thumb-wrap d-block">
                    ${p.discount > 0 ? `<span class="badge-tag">${p.discount}% OFF</span>` : ""}
                    <img src="${p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}" alt="${p.name}">
                </a>
                <div class="card-body">
                    <h5><a href="/product/${p._id}" class="text-decoration-none text-dark">${p.name}</a></h5>
                    <div class="price">
                        ${money(finalPrice.toFixed(0))}
                        ${p.discount > 0 ? `<span class="old">${money(p.price)}</span>` : ""}
                    </div>
                    <button class="btn btn-ink w-100 mt-2 btn-sm add-to-cart-btn"
                        data-id="${p._id}" data-name="${p.name}" data-price="${p.price}"
                        data-discount="${p.discount || 0}" data-image="${p.image || ""}">
                        Add to cart
                    </button>
                </div>
            </div>
        </div>`;
    }

    function applyFiltersAndRender() {
        const query = (searchInput.value || "").toLowerCase().trim();
        const maxPrice = parseFloat(priceRange.value);
        const sort = sortSelect.value;

        let filtered = allProducts.filter((p) => {
            const matchesQuery = !query || p.name.toLowerCase().includes(query);
            const matchesPrice = p.price <= maxPrice;
            return matchesQuery && matchesPrice;
        });

        filtered = filtered.sort((a, b) => {
            if (sort === "price-asc") return a.price - b.price;
            if (sort === "price-desc") return b.price - a.price;
            if (sort === "name-asc") return a.name.localeCompare(b.name);
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // newest
        });

        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        currentPage = Math.min(currentPage, totalPages);
        const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

        resultCount.textContent = `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`;

        grid.innerHTML = pageItems.length
            ? pageItems.map(cardHtml).join("")
            : `<div class="col-12"><div class="empty-state"><i class="bi bi-search"></i><p class="mt-3">No products match your filters.</p></div></div>`;

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            paginationEl.innerHTML = "";
            return;
        }
        let html = "";
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === currentPage ? "active" : ""}">
                        <button class="page-link" data-page="${i}">${i}</button>
                     </li>`;
        }
        paginationEl.innerHTML = html;
        paginationEl.querySelectorAll(".page-link").forEach((btn) => {
            btn.addEventListener("click", () => {
                currentPage = parseInt(btn.dataset.page, 10);
                applyFiltersAndRender();
                window.scrollTo({ top: grid.offsetTop - 100, behavior: "smooth" });
            });
        });
    }

    // Events
    searchInput.addEventListener("input", () => { currentPage = 1; applyFiltersAndRender(); });
    priceRange.addEventListener("input", () => {
        priceRangeValue.textContent = money(priceRange.value);
        currentPage = 1;
        applyFiltersAndRender();
    });
    sortSelect.addEventListener("change", () => { currentPage = 1; applyFiltersAndRender(); });
    resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        priceRange.value = priceRange.max;
        priceRangeValue.textContent = money(priceRange.max);
        sortSelect.value = "newest";
        currentPage = 1;
        applyFiltersAndRender();
    });

    // Pre-fill category from ?category= query param into search box as a starting filter hint
    const params = new URLSearchParams(window.location.search);
    if (params.get("category")) searchInput.value = "";

    try {
        const data = await Api.get("/products");
        allProducts = data.products || [];
        if (allProducts.length) {
            const maxPrice = Math.max(...allProducts.map((p) => p.price));
            priceRange.max = Math.ceil(maxPrice / 100) * 100;
            priceRange.value = priceRange.max;
            priceRangeValue.textContent = money(priceRange.max);
        }
        applyFiltersAndRender();
    } catch (err) {
        grid.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p class="mt-3">${err.message}</p></div></div>`;
        resultCount.textContent = "Error loading products";
    }
});
