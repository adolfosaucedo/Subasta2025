document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.getElementById("btn-login");
  const menu = document.getElementById("menu-dinamico");
  const user = JSON.parse(localStorage.getItem("usuario")) || null;
  const modalLogin = new bootstrap.Modal(document.getElementById("modalLogin"));
  const modalRegistro = new bootstrap.Modal(document.getElementById("modalRegistro"));

  // 🔸 Si no hay usuario logueado
  if (!user) {
    menu.innerHTML = "";
    btnLogin.textContent = "Ingresar";
    btnLogin.classList.remove("btn-danger");
    btnLogin.classList.add("btn-outline-warning");
    btnLogin.onclick = () => modalLogin.show();
  } else {
    const rol = (user.rol_nombre || "").toLowerCase();

    let items = "";

    // 🟢 ADMINISTRADOR
    if (rol === "administrador") {
      items = `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Archivos</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" onclick="cargar_formulario('panel-formulario','./frm/archivos/usuarios/index.html','')">Usuarios</a></li>
            <li><a class="dropdown-item" href="#" onclick="cargar_formulario('panel-formulario','./frm/archivos/roles/index.html','')">Roles</a></li>
            <li><a class="dropdown-item" href="#" onclick="cargar_formulario('panel-formulario','./frm/archivos/bienes/index.html','')">Bienes</a></li>
          </ul>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Transacciones</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" onclick="cargar_formulario('panel-formulario','./frm/transacciones/subastas/index.html','')">Subastas</a></li>
            <li><a class="dropdown-item" href="#" onclick="cargar_formulario('panel-formulario','./frm/transacciones/pujas/index.html','')">Pujas</a></li>
            <li><a class="dropdown-item" href="#" onclick="cargar_formulario('panel-formulario','./frm/transacciones/adjudicaciones/index.html','')">Adjudicaciones</a></li>
            <li><a class="dropdown-item" href="#" onclick="cargar_formulario('panel-formulario','./frm/transacciones/pagos/index.html','')">Pagos</a></li>
          </ul>
        </li>
      `;
    }
    // 🟡 COMPRADOR
    else if (rol === "comprador") {
      items = `
        <li class="nav-item"><a class="nav-link" href="#" onclick="cargar_formulario('panel-formulario','./frm/transacciones/subastas/index.html','')">Subastas</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="cargar_formulario('panel-formulario','./frm/transacciones/pujas/index.html','')">Mis Pujas</a></li>
      `;
    }
    // 🟠 VENDEDOR
    else if (rol === "vendedor") {
      items = `
        <li class="nav-item"><a class="nav-link" href="#" onclick="cargar_formulario('panel-formulario','./frm/archivos/bienes/index.html','')">Mis Bienes</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="cargar_formulario('panel-formulario','./frm/transacciones/subastas/index.html','')">Subastas Activas</a></li>
      `;
    }

    // 🔹 Botón Salir
    items += `
      <li class="nav-item"><a class="nav-link text-danger" href="#" id="btnLogout">Salir</a></li>
    `;

    menu.innerHTML = items;

    // Botón de sesión
    btnLogin.textContent = user.nombre || "Usuario";
    btnLogin.classList.remove("btn-outline-warning");
    btnLogin.classList.add("btn-success");

    document.getElementById("btnLogout").addEventListener("click", () => {
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  }

  // 🔸 Cambiar a registro
  document.getElementById("btnToRegister").addEventListener("click", () => {
    modalLogin.hide();
    modalRegistro.show();
  });

  // 🔸 Confirmar login
  document.getElementById("btnConfirmLogin").addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorBox = document.getElementById("loginError");

    try {
      const resp = await fetch("/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const json = await resp.json();

      if (json.status === 200 && json.datos) {
        localStorage.setItem("token", json.token);
        localStorage.setItem("usuario", JSON.stringify(json.datos));

        const modal = bootstrap.Modal.getInstance(document.getElementById("modalLogin"));
        modal.hide();

        // Redirección según rol
        if (json.datos.rol_nombre === "Administrador") {
          window.location.href = "/menu";
        } else {
          // Si era cliente → seguir en página principal
          const pendiente = localStorage.getItem("subasta_pendiente");
          if (pendiente) {
            localStorage.removeItem("subasta_pendiente");
            localStorage.setItem("subasta_actual", pendiente);
            abrirModalPuja(); // función del módulo de pujas
          } else {
            location.reload();
          }
        }
      } else {
        errorBox.textContent = "Usuario o contraseña incorrectos.";
      }
    } catch (err) {
      console.error("Error en login:", err);
      errorBox.textContent = "Error de conexión con el servidor.";
    }
  });


  // 🔸 Confirmar registro
  document.getElementById("btnConfirmRegister").addEventListener("click", async () => {
    const nombre = document.getElementById("regNombre").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const pass1 = document.getElementById("regPass1").value.trim();
    const pass2 = document.getElementById("regPass2").value.trim();
    const error = document.getElementById("regError");

    error.textContent = "";

    if (!nombre || !email || !pass1 || !pass2) {
      error.textContent = "Complete todos los campos.";
      return;
    }
    if (pass1 !== pass2) {
      error.textContent = "Las contraseñas no coinciden.";
      return;
    }

    const resp = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        email,
        telefono,
        password: pass1,
        registro_externo: true    // 👈 Nueva bandera
      }),
    });

    const json = await resp.json();

    if (json.status === 200) {
      error.classList.remove("text-danger");
      error.classList.add("text-success");
      error.textContent = "Registro exitoso. Espere aprobación del administrador.";
      setTimeout(() => modalRegistro.hide(), 1500);
    } else {
      error.textContent = "Error al registrarse.";
    }
  });
});
