document.addEventListener("DOMContentLoaded", () => {

    /* ---------- Password show/hide (works on both login & register) ---------- */
    document.querySelectorAll(".password-toggle").forEach((btn) => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(btn.dataset.target);
            const icon = btn.querySelector("i");
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            icon.className = show ? "bi bi-eye-slash" : "bi bi-eye";
        });
    });

    function setAlert(el, message, type = "danger") {
        if (!el) return;
        el.className = `alert alert-${type}`;
        el.textContent = message;
        el.classList.remove("d-none");
    }

    /* ================= REGISTER ================= */
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        const passwordInput = document.getElementById("password");
        const strengthBar = document.getElementById("strengthBar");
        const strengthLabel = document.getElementById("strengthLabel");
        const alertBox = document.getElementById("registerAlert");

        passwordInput.addEventListener("input", () => {
            const val = passwordInput.value;
            let score = 0;
            if (val.length >= 6) score++;
            if (val.length >= 10) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            const levels = [
                { pct: 0, color: "#e7e4dc", label: "Password strength" },
                { pct: 20, color: "#b3413c", label: "Very weak" },
                { pct: 40, color: "#c9793f", label: "Weak" },
                { pct: 60, color: "#c6952c", label: "Fair" },
                { pct: 80, color: "#7a9a5a", label: "Strong" },
                { pct: 100, color: "#4c7a5e", label: "Very strong" },
            ];
            const level = levels[Math.min(score, 5)];
            strengthBar.style.width = level.pct + "%";
            strengthBar.style.background = level.color;
            strengthLabel.textContent = level.label;
        });

        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            alertBox.classList.add("d-none");

            const fullname = document.getElementById("fullname").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (!registerForm.checkValidity()) {
                registerForm.classList.add("was-validated");
                return;
            }
            if (password.length < 6) {
                setAlert(alertBox, "Password must be at least 6 characters.");
                return;
            }
            if (password !== confirmPassword) {
                setAlert(alertBox, "Passwords do not match.");
                return;
            }

            const btn = document.getElementById("registerBtn");
            btn.disabled = true;
            btn.textContent = "Creating account…";

            try {
                await Api.post("/ushers/register", { fullname, email, password });
                setAlert(alertBox, "Account created! Redirecting…", "success");
                setTimeout(() => (window.location.href = "/"), 900);
            } catch (err) {
                setAlert(alertBox, err.message || "Registration failed. Please try again.");
                btn.disabled = false;
                btn.textContent = "Create account";
            }
        });
    }

    /* ================= LOGIN ================= */
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        const alertBox = document.getElementById("loginAlert");
        const roleInput = document.getElementById("loginRole");

        document.querySelectorAll("#loginRoleTabs .nav-link").forEach((tab) => {
            tab.addEventListener("click", () => {
                document.querySelectorAll("#loginRoleTabs .nav-link").forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                roleInput.value = tab.dataset.role;
            });
        });

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            alertBox.classList.add("d-none");

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const role = roleInput.value;

            if (!email || !password) {
                setAlert(alertBox, "Please enter your email and password.");
                return;
            }

            const btn = document.getElementById("loginBtn");
            btn.disabled = true;
            btn.textContent = "Signing in…";

            const endpoint = role === "owner" ? "/owners/login" : "/ushers/login";

            try {
                await Api.post(endpoint, { email, password });
                setAlert(alertBox, "Signed in! Redirecting…", "success");
                const params = new URLSearchParams(window.location.search);
                const redirect = params.get("redirect") || (role === "owner" ? "/admin" : "/");
                setTimeout(() => (window.location.href = redirect), 700);
            } catch (err) {
                setAlert(alertBox, err.message || "Invalid email or password.");
                btn.disabled = false;
                btn.textContent = "Sign in";
            }
        });
    }
});
