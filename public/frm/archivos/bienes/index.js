let idBienActual = null;

// 🧩 Elementos
const textoBuscar = document.getElementById('texto_buscar_bienes');
const titulo = document.getElementById('titulo');
const descripcion = document.getElementById('descripcion');
const valor_inicial = document.getElementById('valor_inicial');
const fileImagen = document.getElementById('file_imagen_url');
const preview = document.getElementById('imagen_url_preview');
const modalBien = new bootstrap.Modal(document.getElementById("modalBien"));
const modalConfirmar = new bootstrap.Modal(document.getElementById("modalConfirmar"));
const btnGuardar = document.getElementById('btnGuardarBien');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

// 🖼 Vista previa
fileImagen.addEventListener("change", () => {
  const file = fileImagen.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => (preview.src = e.target.result);
    reader.readAsDataURL(file);
  }
});

// 🔍 Buscar
async function buscar_bienes() {
  const response = await fetch(`/api/bienes?nombre=${textoBuscar.value}`);
  const data = await response.json();
  const tbody = document.getElementById('tbody_bienes');
  tbody.innerHTML = '';

  data.datos.forEach(bien => {
    const imgSrc = bien.imagen_url || './img/bienes/0.png';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${bien.id_bien}</td>
      <td>${bien.nombre_usuario}</td>
      <td>${bien.titulo}</td>
      <td>${bien.descripcion}</td>
      <td class="text-end">${Number(bien.valor_inicial).toLocaleString("es-PY")}</td>
      <td class="text-center"><img src="${imgSrc}" style="height:50px;border-radius:6px;"></td>
      <td class="text-center">
        <button class="btn btn-primary btn-sm" onclick="abrirModalEditar(${bien.id_bien})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="abrirModalEliminar(${bien.id_bien})"><i class="fa-solid fa-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
}
buscar_bienes();

// 🟢 ABRIR MODAL AGREGAR
function abrirModalAgregar() {
  idBienActual = null;
  document.getElementById('modalBienLabel').innerText = "Registrar Nuevo Bien";
  titulo.value = '';
  descripcion.value = '';
  valor_inicial.value = '';
  fileImagen.value = '';
  preview.src = './img/bienes/0.png';
  modalBien.show();
}

// 🟢 ABRIR MODAL EDITAR
async function abrirModalEditar(id_bien) {
  const res = await fetch(`/api/bienes/${id_bien}`);
  const json = await res.json();
  if (json.status !== 200) return alert("Error cargando bien.");

  const bien = json.datos;
  idBienActual = bien.id_bien;
  document.getElementById('modalBienLabel').innerText = "Editar Bien";
  titulo.value = bien.titulo;
  descripcion.value = bien.descripcion;
  valor_inicial.value = bien.valor_inicial;
  preview.src = bien.imagen_url || './img/bienes/0.png';
  modalBien.show();
}

// 🟢 GUARDAR (CREAR o EDITAR)
btnGuardar.addEventListener("click", async () => {
  const user = JSON.parse(localStorage.getItem("usuario"));
  if (!user) return alert("Debe iniciar sesión.");

  const body = {
    id_usuario: user.id_usuario,
    titulo: titulo.value,
    descripcion: descripcion.value,
    valor_inicial: valor_inicial.value.replaceAll('.', ''),
  };

  // Crear o actualizar
  let url = "/api/bienes";
  let method = "POST";

  if (idBienActual) {
    url = `/api/bienes/${idBienActual}`;
    method = "PUT";
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.status !== 200) return alert("Error al guardar.");

  const idFinal = idBienActual || json.datos.insertId;

  if (fileImagen.files.length > 0) {
    await uploadImagen(idFinal);
  }

  modalBien.hide();
  buscar_bienes();
});

// 🟢 SUBIR IMAGEN
async function uploadImagen(id_bien) {
  const formData = new FormData();
  formData.append("imagenPerfil", fileImagen.files[0]);
  await fetch(`/api/upload?id_bien=${id_bien}`, { method: "POST", body: formData });
}

// 🗑 ABRIR MODAL ELIMINAR
function abrirModalEliminar(id_bien) {
  idBienActual = id_bien;
  document.getElementById('texto_confirmacion').innerText = "¿Está seguro de eliminar este bien?";
  modalConfirmar.show();
}

// 🗑 CONFIRMAR ELIMINAR
btnConfirmarEliminar.addEventListener("click", async () => {
  if (!idBienActual) return;
  await fetch(`/api/bienes/${idBienActual}`, { method: "DELETE" });
  modalConfirmar.hide();
  buscar_bienes();
});
