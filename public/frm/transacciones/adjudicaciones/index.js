(() => {
  console.log("🟢 Iniciando módulo de Adjudicaciones...");

  let adjudicaciones = [];
  let subastas = [];
  let pujas = [];
  let adjudicacionActual = null;

  const modalAdjudicacion = new bootstrap.Modal(document.getElementById("modalAdjudicacion"));
  const selectSubasta = document.getElementById("select_subasta");
  const selectPuja = document.getElementById("select_puja");
  const idAdjudicacion = document.getElementById("id_adjudicacion");
  const estado = document.getElementById("estado");
  const tbody = document.getElementById("tbody_adjudicaciones");

  // ============================
  // 🔹 CARGAR ADJUDICACIONES
  // ============================
  async function buscar_adjudicaciones() {
    console.log("🔍 Ejecutando buscar_adjudicaciones()...");
    try {
      const texto = document.getElementById("texto_buscar_adjudicaciones").value.trim();
      const url = texto ? `/api/adjudicaciones?id_subasta=${texto}` : `/api/adjudicaciones`;
      const resp = await fetch(url);
      const json = await resp.json();
      adjudicaciones = json.datos || [];
      console.table(adjudicaciones);
      renderTabla();
    } catch (err) {
      console.error("🚨 Error al buscar adjudicaciones:", err);
    }
  }

  function renderTabla() {
    tbody.innerHTML = "";
    if (adjudicaciones.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No se encontraron adjudicaciones</td></tr>`;
      return;
    }

    adjudicaciones.forEach((a) => {
      const tr = document.createElement("tr");
      const estadoTexto = a.estado == 1 || a.estado === "1" ? "adjudicado" : a.estado || "-";
      tr.innerHTML = `
        <td>${a.id_adjudicacion}</td>
        <td>${a.titulo_bien || a.id_subasta}</td>
        <td>${a.id_puja}</td>
        <td>${estadoTexto}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-primary me-1" onclick="editar_adjudicacion(${a.id_adjudicacion})">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="eliminar_adjudicacion(${a.id_adjudicacion})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  // ============================
  // 🔹 CARGAR LISTAS
  // ============================
  async function cargarSubastas() {
    const resp = await fetch("/api/subastas");
    const json = await resp.json();
    subastas = json.datos || [];
    selectSubasta.innerHTML = `<option value="">Seleccione una subasta</option>`;
    subastas.forEach((s) => {
      selectSubasta.innerHTML += `<option value="${s.id_subasta}">${s.titulo_bien}</option>`;
    });
  }

  window.cargarPujasPorSubasta = async function () {
    const idSubasta = selectSubasta.value;
    if (!idSubasta) {
      selectPuja.innerHTML = `<option value="">Seleccione una puja</option>`;
      return;
    }
    try {
      console.log("⚡ Cargando pujas para subasta:", idSubasta);
      const resp = await fetch(`/api/pujas?id_subasta=${idSubasta}`);
      const json = await resp.json();
      console.log("📦 Pujas recibidas:", json.datos);
      pujas = json.datos || [];
      selectPuja.innerHTML = `<option value="">Seleccione una puja</option>`;
      pujas.forEach((p) => {
        selectPuja.innerHTML += `<option value="${p.id_puja}">Puja #${p.id_puja} - ${p.nombre_usuario || "Usuario"} (${Number(p.monto).toLocaleString("es-PY")})</option>`;
      });
    } catch (err) {
      console.error("🚨 Error al cargar pujas:", err);
    }
  };


  // ============================
  // 🔹 ABRIR MODAL
  // ============================
  window.abrirModalAdjudicacion = function () {
    adjudicacionActual = null;
    idAdjudicacion.value = "";
    selectSubasta.value = "";
    selectPuja.innerHTML = `<option value="">Seleccione una puja</option>`;
    estado.value = "adjudicado";
    document.getElementById("modalTitulo").textContent = "Nueva Adjudicación";
    modalAdjudicacion.show();
    cargarSubastas();
  };

  // ============================
  // 🔹 EDITAR
  // ============================
  window.editar_adjudicacion = async function (id) {
    const resp = await fetch(`/api/adjudicaciones/${id}`);
    const json = await resp.json();
    adjudicacionActual = json.datos;
    idAdjudicacion.value = adjudicacionActual.id_adjudicacion;
    estado.value = "adjudicado";
    await cargarSubastas();
    selectSubasta.value = adjudicacionActual.id_subasta;
    await cargarPujasPorSubasta();
    selectPuja.value = adjudicacionActual.id_puja;
    document.getElementById("modalTitulo").textContent = "Editar Adjudicación";
    modalAdjudicacion.show();
  };

  // ============================
  // 🔹 GUARDAR
  // ============================
  window.guardar_adjudicacion = async function () {
    const idSubasta = selectSubasta.value;
    const idPuja = selectPuja.value;
    if (!idSubasta || !idPuja) {
      alert("Debe seleccionar una subasta y una puja.");
      return;
    }
    const data = { id_subasta: idSubasta, id_puja: idPuja, estado: "adjudicado" };
    const method = adjudicacionActual ? "PUT" : "POST";
    const url = adjudicacionActual
      ? `/api/adjudicaciones/${adjudicacionActual.id_adjudicacion}`
      : `/api/adjudicaciones`;
    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await resp.json();
    if (json.status === 200) {
      alert("✅ Adjudicación guardada correctamente.");
      modalAdjudicacion.hide();
      buscar_adjudicaciones();
    } else {
      alert("❌ Error al guardar adjudicación.");
    }
  };

  // ============================
  // 🔹 ELIMINAR
  // ============================
  window.eliminar_adjudicacion = async function (id) {
    if (!confirm("¿Seguro que desea eliminar esta adjudicación?")) return;
    const resp = await fetch(`/api/adjudicaciones/${id}`, { method: "DELETE" });
    const json = await resp.json();
    if (json.status === 200) {
      alert("🗑️ Adjudicación eliminada correctamente.");
      buscar_adjudicaciones();
    } else {
      alert("❌ No se pudo eliminar la adjudicación.");
    }
  };

  // ============================
  // 🔹 INICIALIZAR
  // ============================
  console.log("🚀 Cargando adjudicaciones iniciales...");
  buscar_adjudicaciones();
})();
