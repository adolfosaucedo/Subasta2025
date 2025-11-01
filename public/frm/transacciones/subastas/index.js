(() => {
  let idSubastaActual = null;
  let bienesDisponibles = [];

  // 🧩 Referencias
  const modalSubasta = new bootstrap.Modal(document.getElementById("modalSubasta"));
  const modalConfirmar = new bootstrap.Modal(document.getElementById("modalConfirmar"));
  const selectBien = document.getElementById("select_bien");
  const precioBase = document.getElementById("precio_base");
  const fechaInicio = document.getElementById("fecha_inicio");
  const fechaFin = document.getElementById("fecha_fin");
  const estado = document.getElementById("estado");
  const btnGuardar = document.getElementById("btnGuardarSubasta");
  const btnConfirmarEliminar = document.getElementById("btnConfirmarEliminar");

  // 📦 Buscar bienes disponibles
  async function cargarBienes() {
    const res = await fetch("/api/bienes?nombre=");
    const json = await res.json();
    bienesDisponibles = json.datos || [];

    selectBien.innerHTML = "<option value='' disabled selected>Seleccione un bien</option>";
    bienesDisponibles.forEach(b => {
      const option = document.createElement("option");
      option.value = b.id_bien;
      option.textContent = b.titulo;
      selectBien.appendChild(option);
    });
  }

  // 🎯 Al cambiar bien → rellenar precio base
  selectBien.addEventListener("change", () => {
    const bienSel = bienesDisponibles.find(b => b.id_bien == selectBien.value);
    if (bienSel) {
      precioBase.value = Number(bienSel.valor_inicial).toLocaleString("es-PY");
    }
  });

  // 🔍 Buscar subastas
  async function buscar_subastas() {
    const texto = document.getElementById("texto_buscar_subastas").value;
    const res = await fetch(`/api/subastas?titulo=${texto}`);
    const json = await res.json();

    const tbody = document.getElementById("tbody_subastas");
    tbody.innerHTML = "";

    json.datos.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.id_subasta}</td>
        <td>${s.titulo_bien}</td>
        <td>${new Date(s.fecha_inicio).toLocaleDateString("es-PY")}</td>
        <td>${new Date(s.fecha_fin).toLocaleDateString("es-PY")}</td>
        <td class="text-end">${Number(s.precio_base).toLocaleString("es-PY")}</td>
        <td class="text-center">${s.estado}</td>
        <td class="text-center">
          <button class="btn btn-primary btn-sm" onclick="editarSubasta(${s.id_subasta})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="eliminarSubasta(${s.id_subasta})"><i class="fa-solid fa-trash"></i></button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  window.buscar_subastas = buscar_subastas;

  // 🟢 Abrir modal para agregar
  window.abrirModalAgregar = async () => {
    idSubastaActual = null;
    document.getElementById("modalSubastaLabel").innerText = "Registrar Subasta";
    await cargarBienes();
    selectBien.value = "";
    precioBase.value = "";
    fechaInicio.value = "";
    fechaFin.value = "";
    estado.value = "programada";
    modalSubasta.show();
  };

  // 🟢 Editar subasta
  window.editarSubasta = async (id_subasta) => {
    idSubastaActual = id_subasta;
    const res = await fetch(`/api/subastas/${id_subasta}`);
    const json = await res.json();
    const s = json.datos;

    await cargarBienes();

    document.getElementById("modalSubastaLabel").innerText = "Editar Subasta";
    selectBien.value = s.id_bien;
    precioBase.value = s.precio_base;
    fechaInicio.value = s.fecha_inicio.slice(0, 10);
    fechaFin.value = s.fecha_fin.slice(0, 10);
    estado.value = s.estado;

    modalSubasta.show();
  };

  // 🟢 Guardar (agregar o editar)
  btnGuardar.addEventListener("click", async () => {
    const body = {
      id_bien: selectBien.value,
      fecha_inicio: fechaInicio.value,
      fecha_fin: fechaFin.value,
      precio_base: precioBase.value.replaceAll('.', ''),
      estado: estado.value,
    };

    const method = idSubastaActual ? "PUT" : "POST";
    const url = idSubastaActual ? `/api/subastas/${idSubastaActual}` : `/api/subastas`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json.status === 200) {
      modalSubasta.hide();
      buscar_subastas();
    } else {
      alert("Error al guardar la subasta.");
    }
  });

  // 🗑 Confirmar eliminación
  window.eliminarSubasta = (id) => {
    idSubastaActual = id;
    modalConfirmar.show();
  };

  btnConfirmarEliminar.addEventListener("click", async () => {
    if (!idSubastaActual) return;
    await fetch(`/api/subastas/${idSubastaActual}`, { method: "DELETE" });
    modalConfirmar.hide();
    buscar_subastas();
  });

  buscar_subastas();
})();
