document.addEventListener("DOMContentLoaded", () => {
    const mainImage = document.getElementById("mainImage");
    if (!mainImage) return; // not on product page

    /* ---------- Gallery thumbnail swap ---------- */
    document.querySelectorAll(".pdp-thumbs img").forEach((thumb) => {
        thumb.addEventListener("click", () => {
            document.querySelectorAll(".pdp-thumbs img").forEach((t) => t.classList.remove("active"));
            thumb.classList.add("active");
            mainImage.src = thumb.dataset.full;
        });
    });

    /* ---------- Click-to-zoom ---------- */
    const galleryMain = document.getElementById("galleryMain");
    galleryMain.addEventListener("click", () => {
        galleryMain.classList.toggle("zoomed");
    });

    /* ---------- Quantity selector ---------- */
    const qtyInput = document.getElementById("qtyInput");
    const addToCartBtn = document.getElementById("addToCartBtn");

    function syncQty() {
        addToCartBtn.dataset.qty = qtyInput.value;
    }

    document.getElementById("qtyMinus").addEventListener("click", () => {
        qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) - 1);
        syncQty();
    });
    document.getElementById("qtyPlus").addEventListener("click", () => {
        qtyInput.value = parseInt(qtyInput.value, 10) + 1;
        syncQty();
    });

    /* ---------- Tabs ---------- */
    document.querySelectorAll("#pdpTabs .nav-link").forEach((tab) => {
        tab.addEventListener("click", () => {
            document.querySelectorAll("#pdpTabs .nav-link").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            document.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.add("d-none"));
            document.querySelector(`.tab-pane[data-pane="${tab.dataset.tab}"]`).classList.remove("d-none");
        });
    });

    /* ---------- Buy now: add to cart then jump straight to checkout ---------- */
    document.getElementById("buyNowBtn").addEventListener("click", () => {
        addToCartBtn.click(); // reuses the sitewide add-to-cart handler in main.js
        window.location.href = "/cart";
    });
});
