document.addEventListener("DOMContentLoaded", () => {
    const itemsWrap = document.getElementById("checkoutItems");
    if (!itemsWrap) return; // not on checkout page

    const SHIPPING_FLAT = 99;
    const TAX_RATE = 0.05;
    // Demo-only coupon table — there's no coupon model/API on the backend,
    // so this is a client-side stand-in, clearly not a real discount engine.
    const COUPONS = { SCATCH10: 0.10, WELCOME50: 0.05 };

    let appliedDiscountRate = 0;

    function money(n) {
        return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }

    function setAlert(message, type = "danger") {
        const el = document.getElementById("checkoutAlert");
        el.className = `alert alert-${type}`;
        el.textContent = message;
        el.classList.remove("d-none");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderItems() {
        const items = CartStore.getAll();
        if (items.length === 0) {
            itemsWrap.innerHTML = `<p class="text-muted small">Your cart is empty. <a href="/shop">Go shopping</a>.</p>`;
            document.getElementById("placeOrderBtn").disabled = true;
            return;
        }
        itemsWrap.innerHTML = items.map((i) => {
            const finalPrice = i.price - (i.price * (i.discount || 0)) / 100;
            return `<div class="d-flex justify-content-between small mb-2">
                        <span>${i.name} × ${i.qty}</span>
                        <span>${money(finalPrice * i.qty)}</span>
                    </div>`;
        }).join("");
    }

    function calcTotals() {
        const subtotal = CartStore.subtotal();
        const shipping = subtotal > 999 || subtotal === 0 ? 0 : SHIPPING_FLAT;
        const discount = subtotal * appliedDiscountRate;
        const tax = (subtotal - discount) * TAX_RATE;
        const total = subtotal - discount + shipping + tax;
        return { subtotal, shipping, tax, discount, total };
    }

    function renderTotals() {
        const t = calcTotals();
        document.getElementById("coSubtotal").textContent = money(t.subtotal);
        document.getElementById("coShipping").textContent = t.shipping === 0 ? "Free" : money(t.shipping);
        document.getElementById("coTax").textContent = money(t.tax);
        document.getElementById("coTotal").textContent = money(t.total);

        const discountRow = document.getElementById("coDiscountRow");
        if (t.discount > 0) {
            discountRow.style.display = "flex";
            document.getElementById("coDiscount").textContent = "-" + money(t.discount);
        } else {
            discountRow.style.display = "none";
        }
    }

    /* ---------- Payment option selection ---------- */
    document.querySelectorAll(".payment-option").forEach((opt) => {
        opt.addEventListener("click", () => {
            document.querySelectorAll(".payment-option").forEach((o) => o.classList.remove("selected"));
            opt.classList.add("selected");
            opt.querySelector("input").checked = true;
        });
    });

    /* ---------- Coupon ---------- */
    document.getElementById("applyCouponBtn").addEventListener("click", () => {
        const code = document.getElementById("couponInput").value.trim().toUpperCase();
        const resultEl = document.getElementById("couponResult");
        if (COUPONS[code]) {
            appliedDiscountRate = COUPONS[code];
            resultEl.innerHTML = `<div class="coupon-applied mb-2"><span><i class="bi bi-check-circle"></i> ${code} applied (${COUPONS[code] * 100}% off)</span></div>`;
        } else {
            appliedDiscountRate = 0;
            resultEl.innerHTML = `<div class="text-danger small mb-2">Invalid coupon code.</div>`;
        }
        renderTotals();
    });

    /* ---------- Place order ---------- */
    document.getElementById("placeOrderBtn").addEventListener("click", async () => {
        const addressForm = document.getElementById("addressForm");
        if (!addressForm.checkValidity()) {
            addressForm.reportValidity();
            return;
        }
        const items = CartStore.getAll();
        if (items.length === 0) {
            setAlert("Your cart is empty.");
            return;
        }

        const shippingAddress = {
            name: document.getElementById("addrName").value.trim(),
            phone: document.getElementById("addrPhone").value.trim(),
            line: document.getElementById("addrLine").value.trim(),
            city: document.getElementById("addrCity").value.trim(),
            state: document.getElementById("addrState").value.trim(),
            pin: document.getElementById("addrPin").value.trim(),
        };
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const t = calcTotals();

        const btn = document.getElementById("placeOrderBtn");
        btn.disabled = true;
        btn.textContent = "Placing order…";

        try {
            const res = await Api.post("/ushers/orders", {
                items,
                shippingAddress,
                paymentMethod,
                subtotal: t.subtotal,
                shipping: t.shipping,
                tax: t.tax,
                total: t.total,
                coupon: appliedDiscountRate > 0 ? document.getElementById("couponInput").value.trim().toUpperCase() : null,
            });
            CartStore.clear();
            setAlert("Order placed successfully! Redirecting to your profile…", "success");
            setTimeout(() => (window.location.href = "/profile"), 1200);
        } catch (err) {
            setAlert(err.message || "Could not place order. Please sign in and try again.");
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock-fill"></i> Place order';
        }
    });

    renderItems();
    renderTotals();
});
