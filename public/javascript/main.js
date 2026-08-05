/* =========================================================
   SCATCH — Shared frontend utilities
   Loaded on every page via layouts/footer.ejs
   ========================================================= */

/* ---------- API helper (talks to the existing JSON backend) ---------- */
const Api = {
    async request(url, options = {}) {
        const res = await fetch(url, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        let data = null;
        try { data = await res.json(); } catch (e) { /* non-JSON response */ }
        if (!res.ok) {
            const message = (data && data.message) || `Request failed (${res.status})`;
            throw new Error(message);
        }
        return data;
    },
    get(url) { return this.request(url); },
    post(url, body) { return this.request(url, { method: "POST", body: JSON.stringify(body) }); },
    put(url, body) { return this.request(url, { method: "PUT", body: JSON.stringify(body) }); },
    del(url) { return this.request(url, { method: "DELETE" }); },
};

/* ---------- Toast helper ---------- */
function showToast(message, type = "success") {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.className = "toast-stack";
        document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `alert alert-${type === "error" ? "danger" : type} shadow-sm fade-up`;
    el.style.minWidth = "260px";
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
        el.style.transition = "opacity .3s ease";
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 300);
    }, 2600);
}

/* ---------- Cart store (client-side, localStorage) ----------
   The Usher model already has a `cart` array field on the backend,
   but there is no dedicated cart-session API. To avoid inventing a
   fake backend, the cart lives in localStorage and is only pushed to
   the server (POST /ushers/cart/sync) at checkout time, where it's
   saved onto the logged-in user's `cart` field. */
const CartStore = {
    KEY: "scatch_cart",

    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY)) || [];
        } catch (e) {
            return [];
        }
    },

    save(items) {
        localStorage.setItem(this.KEY, JSON.stringify(items));
        this.updateBadge();
    },

    add(product, qty = 1) {
        const items = this.getAll();
        const existing = items.find((i) => i.productId === product._id);
        if (existing) {
            existing.qty += qty;
        } else {
            items.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                discount: product.discount || 0,
                image: product.image || "",
                qty,
            });
        }
        this.save(items);
    },

    updateQty(productId, qty) {
        let items = this.getAll();
        items = items.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i));
        this.save(items);
    },

    remove(productId) {
        const items = this.getAll().filter((i) => i.productId !== productId);
        this.save(items);
    },

    clear() {
        this.save([]);
    },

    count() {
        return this.getAll().reduce((sum, i) => sum + i.qty, 0);
    },

    subtotal() {
        return this.getAll().reduce((sum, i) => {
            const price = i.price - (i.price * (i.discount || 0)) / 100;
            return sum + price * i.qty;
        }, 0);
    },

    updateBadge() {
        const badge = document.getElementById("navCartCount");
        if (badge) badge.textContent = this.count();
    },
};

document.addEventListener("DOMContentLoaded", () => {
    CartStore.updateBadge();

    // Navbar shadow-on-scroll
    window.addEventListener("scroll", () => {
        document.body.classList.toggle("scrolled", window.scrollY > 8);
    });

    // Sitewide delegated "Add to cart" buttons (home, shop grid, related products, etc.)
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".add-to-cart-btn");
        if (!btn) return;
        const product = {
            _id: btn.dataset.id,
            name: btn.dataset.name,
            price: parseFloat(btn.dataset.price),
            discount: parseFloat(btn.dataset.discount || 0),
            image: btn.dataset.image,
        };
        const qty = parseInt(btn.dataset.qty || "1", 10);
        CartStore.add(product, qty);
        showToast(`${product.name} added to cart`);
    });
});
