document.addEventListener("DOMContentLoaded", () => {
  // Helper seguro para obtener/crear modales solo si existen
  const getModal = (id) => {
    if (typeof bootstrap === "undefined" || !bootstrap.Modal) return null;
    const el = document.getElementById(id);
    if (!el) return null;
    return bootstrap.Modal.getOrCreateInstance(el);
  };

  // Referencias (todas opcionales)
  const btnLogin = document.getElementById("btn-login");
  const modalLogin = getModal("modalLogin");        // <- NO existe en index.ejs (y está bien)
  const modalRegistro = getModal("modalRegistro");  // <- sí existe
  const modalPendiente = getModal("modalPendiente");// <- sí existe

  // Si en alguna vista existe un modal de Login, entonces sobreescribimos el botón.
  // Si NO existe (como en index.ejs), dejamos que el <a href="/login"> funcione normal.
  if (btnLogin && modalLogin) {
    btnLogin.removeAttribute("href"); // evitamos navegar a /login si hay modal
    btnLogin.addEventListener("click", (e) => {
      e.preventDefault();
      modalLogin.show();
    });
  }

  // ---- Navegación Login -> Registro (solo si existen esos elementos) ----
  const btnToRegister = document.getElementById("btnToRegister");
  if (btnToRegister && modalRegistro) {
    btnToRegister.addEventListener("click", () => {
      if (modalLogin) modalLogin.hide();
      modalRegistro.show();
    });
  }

  // ---- Confirmar login (solo si existe el formulario de login en esta vista) ----
  const btnConfirmLogin = document.getElementById("btnConfirmLogin");
  if (btnConfirmLogin) {
    btnConfirmLogin.addEventListener("click", async () => {
      const email = (document.getElementById("loginEmail") || {}).value || "";
      const password = (document.getElementById("loginPassword") || {}).value || "";
      const errorBox = document.getElementById("loginError");

      try {
        const resp = await fetch("/api/usuarios/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const json = await resp.json();

        if (json.status === 200 && json.datos) {
          // Si usas localStorage en otras vistas, mantenlo. Si no, podés quitarlo.
          localStorage.setItem("token", json.token || "");
          localStorage.setItem("usuario", JSON.stringify(json.datos || {}));

          const m = getModal("modalLogin");
          if (m) m.hide();

          // Redirección según rol
          if (json.datos.rol_nombre === "Administrador") {
            window.location.href = "/menu";
          } else {
            localStorage.removeItem("subasta_pendiente");
            location.reload();
          }
        } else {
          if (errorBox) errorBox.textContent = "Usuario o contraseña incorrectos.";
        }
      } catch (err) {
        console.error("Error en login:", err);
        if (errorBox) errorBox.textContent = "Error de conexión con el servidor.";
      }
    });
  }

  // ---- Confirmar registro (solo si el formulario está presente) ----
  const btnConfirmRegister = document.getElementById("btnConfirmRegister");
  if (btnConfirmRegister) {
    btnConfirmRegister.addEventListener("click", async () => {
      const nombre = (document.getElementById("regNombre") || {}).value?.trim() || "";
      const email = (document.getElementById("regEmail") || {}).value?.trim() || "";
      const telefono = (document.getElementById("regTelefono") || {}).value?.trim() || "";
      const pass1 = (document.getElementById("regPass1") || {}).value?.trim() || "";
      const pass2 = (document.getElementById("regPass2") || {}).value?.trim() || "";
      const error = document.getElementById("regError");

      if (error) error.textContent = "";

      if (!nombre || !email || !telefono || !pass1 || !pass2) {
        if (error) error.textContent = "Todos los campos son obligatorios.";
        return;
      }

      if (pass1 !== pass2) {
        if (error) error.textContent = "Las contraseñas no coinciden.";
        return;
      }

      try {
        const resp = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email, telefono, password: pass1 }),
        });
        const json = await resp.json();

        if (json.status === 200) {
          if (modalRegistro) modalRegistro.hide();
          if (modalPendiente) modalPendiente.show();
        } else {
          if (error) error.textContent = json.mensaje || "Error al registrarse.";
        }
      } catch (e) {
        if (error) error.textContent = "Error de conexión con el servidor.";
      }
    });
  }
});
