document.addEventListener("DOMContentLoaded", () => {
    const wrap = document.getElementById("cartItemsWrap");
    if (!wrap) return; // not on cart page

    const SHIPPING_FLAT = 99;
    const TAX_RATE = 0.05;

    function money(n) {
        return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }

    function itemHtml(item) {
        const finalPrice = item.price - (item.price * (item.discount || 0)) / 100;
        return `
        <div class="cart-item" data-id="${item.productId}">
            <img src="${item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}" alt="${item.name}">
            <div class="flex-fill">
                <div class="item-name">${item.name}</div>
                <div class="text-muted small">${money(finalPrice)} each</div>
                <div class="qty-selector mt-2">
                    <button type="button" class="qty-dec">−</button>
                    <input type="text" value="${item.qty}" readonly>
                    <button type="button" class="qty-inc">+</button>
                </div>
            </div>
            <div class="text-end">
                <div class="fw-semibold mb-2">${money(finalPrice * item.qty)}</div>
                <button class="remove-btn" title="Remove"><i class="bi bi-trash3"></i></button>
            </div>
        </div>`;
    }

    function render() {
        const items = CartStore.getAll();

        if (items.length === 0) {
            wrap.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bag-x"></i>
                    <p class="mt-3">Your cart is empty.</p>
                    <a href="/shop" class="btn btn-gold mt-2">Start shopping</a>
                </div>`;
            document.getElementById("checkoutBtn").classList.add("disabled");
        } else {
            wrap.innerHTML = items.map(itemHtml).join("");
            document.getElementById("checkoutBtn").classList.remove("disabled");
        }

        const subtotal = CartStore.subtotal();
        const shipping = items.length === 0 ? 0 : subtotal > 999 ? 0 : SHIPPING_FLAT;
        const tax = subtotal * TAX_RATE;
        const total = subtotal + shipping + tax;

        document.getElementById("sumSubtotal").textContent = money(subtotal);
        document.getElementById("sumShipping").textContent = shipping === 0 ? "Free" : money(shipping);
        document.getElementById("sumTax").textContent = money(tax);
        document.getElementById("sumTotal").textContent = money(total);

        // Persist the computed totals for the checkout page to read
        sessionStorage.setItem("scatch_cart_totals", JSON.stringify({ subtotal, shipping, tax, total }));

        // Wire up per-item controls
        wrap.querySelectorAll(".cart-item").forEach((el) => {
            const id = el.dataset.id;
            el.querySelector(".qty-inc").addEventListener("click", () => {
                const item = CartStore.getAll().find((i) => i.productId === id);
                CartStore.updateQty(id, item.qty + 1);
                render();
            });
            el.querySelector(".qty-dec").addEventListener("click", () => {
                const item = CartStore.getAll().find((i) => i.productId === id);
                if (item.qty <= 1) return;
                CartStore.updateQty(id, item.qty - 1);
                render();
            });
            el.querySelector(".remove-btn").addEventListener("click", () => {
                CartStore.remove(id);
                render();
                showToast("Item removed from cart");
            });
        });
    }

    render();
});
