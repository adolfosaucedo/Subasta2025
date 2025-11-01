(() => {
  const user = JSON.parse(localStorage.getItem("usuario")) || null;
  const tbody = document.getElementById("tbody_pujas");
  const modalPuja = new bootstrap.Modal(document.getElementById("modalPuja"));
  const tituloSubasta = document.getElementById("titulo_subasta");
  const monto = document.getElementById("monto");
  const minimoLabel = document.getElementById("minimoLabel");
  const btnGuardar = document.getElementById("btnGuardarPuja");
  const botonNuevaPuja = document.querySelector(".btn-success i.fa-plus").closest("button");

  let subastaActual = null;

  // 🟢 Ajustar encabezado y botón según el rol
  if (user?.rol_nombre === "Administrador") {
    // Cambiar encabezado
    document.querySelector("th.text-center").textContent = "Acciones";

    // Ocultar botón de agregar
    botonNuevaPuja.style.display = "none";
  }

  // 🔹 Cargar pujas (todas si es Admin, o solo las del usuario si es Cliente)
  async function buscar_pujas() {
    try {
      let url = "/api/pujas";
      if (user && user.rol_nombre !== "Administrador") {
        url += `?id_usuario=${user.id_usuario}`;
      }

      const response = await fetch(url);
      const json = await response.json();
      tbody.innerHTML = "";

      if (json.status !== 200) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No se encontraron pujas.</td></tr>`;
        return;
      }

      json.datos.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id_puja}</td>
          <td>${p.id_subasta}</td>
          <td>${p.nombre_usuario || "Desconocido"}</td>
          <td class="text-end">${Number(p.monto).toLocaleString("es-PY")}</td>
          <td class="text-center">
            ${
              user?.rol_nombre === "Administrador"
                ? `<button class="btn btn-danger btn-sm" onclick="eliminar_puja(${p.id_puja})">
                    <i class="fa-solid fa-trash"></i>
                  </button>`
                : ``
            }
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error("Error al buscar pujas:", error);
    }
  }

  // 🔹 Abrir modal de puja
  window.abrirModalPuja = async () => {
    const subastaData = JSON.parse(localStorage.getItem("subasta_actual"));
    if (!subastaData) {
      alert("No hay subasta seleccionada.");
      return;
    }

    const resp = await fetch(`/api/subastas/${subastaData.id_subasta}`);
    const json = await resp.json();
    const s = json.datos;
    subastaActual = s;

    document.getElementById("id_subasta").value = s.id_subasta;
    tituloSubasta.value = s.titulo_bien;
    monto.value = s.precio_base;
    monto.min = s.precio_base;
    minimoLabel.textContent = `Monto mínimo: Gs. ${Number(s.precio_base).toLocaleString("es-PY")}`;
    modalPuja.show();
  };

  // 🔹 Guardar nueva puja
  btnGuardar.addEventListener("click", async () => {
    if (!user) {
      alert("Debes iniciar sesión para ofertar.");
      return;
    }

    const valor = Number(monto.value);
    if (valor < Number(monto.min)) {
      alert("El monto debe ser mayor o igual al mínimo permitido.");
      return;
    }

    const body = {
      id_subasta: subastaActual.id_subasta,
      id_usuario: user.id_usuario,
      monto: valor,
    };

    try {
      const res = await fetch(`/api/pujas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.status === 200) {
        modalPuja.hide();
        alert("✅ Puja registrada correctamente.");
        buscar_pujas();
      } else {
        alert("❌ Error al registrar la puja.");
      }
    } catch (err) {
      console.error("Error al guardar puja:", err);
    }
  });

  // 🔹 Eliminar puja (solo para Administrador)
  window.eliminar_puja = async (id_puja) => {
    if (!confirm("¿Está seguro de eliminar esta puja?")) return;

    try {
      const resp = await fetch(`/api/pujas/${id_puja}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const json = await resp.json();

      if (json.status === 200) {
        alert("🗑️ Puja eliminada correctamente.");
        buscar_pujas();
      } else {
        alert("❌ No se pudo eliminar la puja.");
      }
    } catch (error) {
      console.error("Error al eliminar puja:", error);
    }
  };

  buscar_pujas();
})();
