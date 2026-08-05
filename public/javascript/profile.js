document.addEventListener("DOMContentLoaded", async () => {
    const nameEl = document.getElementById("profileName");
    if (!nameEl) return; // not on profile page

    function money(n) {
        return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }

    function setAlert(message, type = "danger") {
        const el = document.getElementById("profileAlert");
        el.className = `alert alert-${type}`;
        el.textContent = message;
        el.classList.remove("d-none");
    }

    /* ---------- Tab switching ---------- */
    document.querySelectorAll(".profile-nav .nav-link[data-pane]").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".profile-nav .nav-link").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            document.querySelectorAll(".profile-pane").forEach((p) => p.classList.add("d-none"));
            document.querySelector(`.profile-pane[data-pane="${btn.dataset.pane}"]`).classList.remove("d-none");
        });
    });

    function renderOrders(orders) {
        const list = document.getElementById("ordersList");
        if (!orders || orders.length === 0) {
            list.innerHTML = `<div class="empty-state"><i class="bi bi-bag"></i><p class="mt-3">No orders yet.</p><a href="/shop" class="btn btn-gold">Start shopping</a></div>`;
            return;
        }
        list.innerHTML = orders.slice().reverse().map((o) => `
            <div class="order-row">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>Order #${(o._id || "").toString().slice(-6).toUpperCase()}</strong>
                        <div class="text-muted small">${new Date(o.placedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })} · ${o.items.length} item(s)</div>
                    </div>
                    <div class="text-end">
                        <span class="order-status ${o.status === "delivered" ? "delivered" : "pending"}">${o.status}</span>
                        <div class="fw-semibold mt-1">${money(o.total)}</div>
                    </div>
                </div>
            </div>
        `).join("");
    }

    /* ---------- Load current user ---------- */
    try {
        const { usher } = await Api.get("/ushers/me");

        nameEl.textContent = usher.fullname;
        document.getElementById("profileEmail").textContent = usher.email;
        document.getElementById("profileAvatar").src = usher.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(usher.fullname)}`;

        document.getElementById("ovName").textContent = usher.fullname;
        document.getElementById("ovEmail").textContent = usher.email;
        document.getElementById("ovContact").textContent = usher.contact || "Not set";
        document.getElementById("ovOrderCount").textContent = (usher.orders || []).length;

        document.getElementById("editFullname").value = usher.fullname || "";
        document.getElementById("editContact").value = usher.contact || "";
        document.getElementById("editPicture").value = usher.picture || "";

        renderOrders(usher.orders || []);
    } catch (err) {
        setAlert("Please sign in to view your profile.");
        setTimeout(() => (window.location.href = "/login?redirect=/profile"), 1200);
        return;
    }

    /* ---------- Edit profile ---------- */
    document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            await Api.put("/ushers/profile", {
                fullname: document.getElementById("editFullname").value.trim(),
                contact: document.getElementById("editContact").value.trim(),
                picture: document.getElementById("editPicture").value.trim(),
            });
            setAlert("Profile updated successfully.", "success");
            setTimeout(() => window.location.reload(), 900);
        } catch (err) {
            setAlert(err.message || "Could not update profile.");
        }
    });
});
