(() => {
    console.log("🟡 Iniciando módulo de Pagos...");

    // Elementos principales
    const modalPago = new bootstrap.Modal(document.getElementById("modalPago"));
    const modalTitulo = document.getElementById("modalPagoTitulo");
    const idPago = document.getElementById("id_pago");
    const selectAdjudicacion = document.getElementById("select_adjudicacion");
    const metodoPago = document.getElementById("metodo_pago");
    const montoPago = document.getElementById("monto_pago");
    const textoBuscar = document.getElementById("texto_buscar_pagos");
    const tbody = document.getElementById("tbody_pagos");

    let adjudicaciones = [];
    let modoEdicion = false;

    // ===============================================================
    // 🔹 Inicialización
    // ===============================================================
    (async () => {
        console.log("✅ Iniciando carga de datos...");
        await cargarAdjudicaciones();
        await buscar_pagos();
    })();

    // ===============================================================
    // 🔹 1. Cargar adjudicaciones adjudicadas
    // ===============================================================
    async function cargarAdjudicaciones() {
        console.log("📥 Cargando adjudicaciones desde API...");
        try {
            const resp = await fetch("/api/adjudicaciones?estado=adjudicado");
            const json = await resp.json();

            selectAdjudicacion.innerHTML = `<option value="">Seleccione una adjudicación</option>`;
            adjudicaciones = [];

            if (json.status === 200 && json.datos.length > 0) {
                adjudicaciones = json.datos;
                json.datos.forEach((a) => {
                    selectAdjudicacion.innerHTML += `
            <option value="${a.id_adjudicacion}">
              #${a.id_adjudicacion} - ${a.titulo_bien || "Sin título"} | ${a.nombre_usuario || ""} | Gs. ${Number(a.monto_puja || 0).toLocaleString("es-PY")}
            </option>`;
                });
                console.log("✅ Adjudicaciones cargadas:", adjudicaciones.length);
            } else {
                selectAdjudicacion.innerHTML = `<option value="">No hay adjudicaciones adjudicadas</option>`;
            }
        } catch (error) {
            console.error("🚨 Error cargando adjudicaciones:", error);
        }
    }

    // ===============================================================
    // 🔹 2. Buscar pagos
    // ===============================================================
    window.buscar_pagos = async () => {
        console.log("🔍 Buscando pagos...");
        try {
            const query = textoBuscar.value.trim();
            const resp = await fetch(`/api/pagos?nombre=${encodeURIComponent(query)}`);
            const json = await resp.json();
            console.log("📦 Respuesta de API pagos:", json);

            tbody.innerHTML = "";

            if (json.status === 200 && json.datos.length > 0) {
                console.log(`✅ ${json.datos.length} pago(s) encontrado(s)`);
                json.datos.forEach((p) => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
          <td>${p.id_pago}</td>
          <td>#${p.id_adjudicacion} - ${p.titulo_bien || ""}</td>
          <td>${p.metodo}</td>
          <td class="text-end">Gs. ${Number(p.monto).toLocaleString("es-PY")}</td>
          <td>${p.estado}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-primary" onclick="editar_pago(${p.id_pago})">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="eliminar_pago(${p.id_pago})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>`;
                    tbody.appendChild(tr);
                });
            } else {
                console.warn("⚠️ No se encontraron pagos");
                tbody.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron pagos</td></tr>`;
            }
        } catch (error) {
            console.error("🚨 Error buscando pagos:", error);
        }
    };


    // ===============================================================
    // 🔹 3. Abrir modal nuevo pago
    // ===============================================================
    window.abrirModalPago = () => {
        console.log("🟢 Abriendo modal para nuevo pago...");
        modoEdicion = false;
        modalTitulo.textContent = "Registrar Pago";
        idPago.value = "";
        metodoPago.value = "otro";
        montoPago.value = "";
        selectAdjudicacion.value = "";
        modalPago.show();
    };

    // ===============================================================
    // 🔹 4. Autocompletar monto al seleccionar adjudicación
    // ===============================================================
    selectAdjudicacion.addEventListener("change", () => {
        const id = selectAdjudicacion.value;
        const seleccionada = adjudicaciones.find((a) => a.id_adjudicacion == id);
        if (seleccionada) {
            montoPago.value = `Gs. ${Number(seleccionada.monto_puja).toLocaleString("es-PY")}`;
        } else {
            montoPago.value = "";
        }
    });

    // ===============================================================
    // 🔹 5. Editar pago existente
    // ===============================================================
    window.editar_pago = async (id_pago) => {
        console.log("✏️ Editando pago ID:", id_pago);
        modoEdicion = true;
        modalTitulo.textContent = "Editar Pago";

        try {
            const resp = await fetch(`/api/pagos/${id_pago}`);
            const json = await resp.json();

            if (json.status === 200) {
                const p = json.datos;
                idPago.value = p.id_pago;
                selectAdjudicacion.value = p.id_adjudicacion;
                metodoPago.value = p.metodo;
                montoPago.value = `Gs. ${Number(p.monto).toLocaleString("es-PY")}`;
                modalPago.show();
            } else {
                alert("❌ No se pudo cargar el pago.");
            }
        } catch (error) {
            console.error("🚨 Error al editar pago:", error);
        }
    };

    // ===============================================================
    // 🔹 6. Guardar / actualizar pago
    // ===============================================================
    window.guardar_pago = async () => {
        console.log("💾 Guardando pago...");

        if (!selectAdjudicacion.value) {
            alert("⚠️ Debe seleccionar una adjudicación.");
            return;
        }

        const adjud = adjudicaciones.find((a) => a.id_adjudicacion == selectAdjudicacion.value);
        if (!adjud) {
            alert("⚠️ No se pudo determinar la adjudicación seleccionada.");
            return;
        }

        const data = {
            id_adjudicacion: selectAdjudicacion.value,
            metodo: metodoPago.value,
            monto: adjud.monto_puja,
            estado: "confirmado",
        };

        const url = idPago.value ? `/api/pagos/${idPago.value}` : "/api/pagos";
        const method = idPago.value ? "PUT" : "POST";

        try {
            const resp = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const json = await resp.json();
            console.log("📦 Respuesta al guardar:", json);

            if (json.status === 200) {
                if (!idPago.value) {
                    // solo si es nuevo, actualizar adjudicación
                    await fetch(`/api/adjudicaciones/${data.id_adjudicacion}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ estado: "pagada" }),
                    });
                }
                alert("✅ Pago guardado correctamente.");
                modalPago.hide();
                buscar_pagos();
            } else {
                alert("❌ Error al guardar el pago.");
            }
        } catch (error) {
            console.error("🚨 Error al guardar pago:", error);
        }
    };

    // ===============================================================
    // 🔹 7. Eliminar pago
    // ===============================================================
    window.eliminar_pago = async (id_pago) => {
        if (!confirm("⚠️ ¿Seguro que desea eliminar este pago?")) return;
        console.log("🗑️ Eliminando pago ID:", id_pago);

        try {
            const resp = await fetch(`/api/pagos/${id_pago}`, { method: "DELETE" });
            const json = await resp.json();

            if (json.status === 200) {
                alert("🗑️ Pago eliminado correctamente.");
                buscar_pagos();
            } else {
                alert("❌ No se pudo eliminar el pago.");
            }
        } catch (error) {
            console.error("🚨 Error al eliminar pago:", error);
        }
    };

    // ===============================================================
    // 🔹 8. Salir
    // ===============================================================
    window.salir_formulario = () => {
        console.log("🚪 Saliendo del formulario de pagos...");
        window.location.href = "/menu";
    };
})();
