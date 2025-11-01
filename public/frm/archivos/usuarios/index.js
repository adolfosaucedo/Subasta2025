var id_usuario = document.getElementById('id_usuario')
var nombre = document.getElementById('nombre')
var email = document.getElementById('email')
var telefono = document.getElementById('telefono')
var password = document.getElementById('password')
var activo = document.getElementById('activo')
var texto_buscar_usuarios = document.getElementById('texto_buscar_usuarios')
var card_formulario = document.getElementById('card_formulario')
var card_lista = document.getElementById('card_lista')
focus('#texto_buscar_usuarios');
siguiente_campo('#texto_buscar_usuarios', '#boton_texto_buscar_usuarios', false);
siguiente_campo('#id_usuario', '#nombre', false);
siguiente_campo('#nombre', '#email', false);
siguiente_campo('#email', '#telefono', false);
siguiente_campo('#telefono', '#password', false);
siguiente_campo('#password', '#activo', false);
siguiente_campo('#activo', '#boton_guardar', true);

mostrar_lista()
buscar_usuarios();

async function buscar_usuarios() {
  const response = await fetch(`/api/usuarios?nombre=${texto_buscar_usuarios.value}`);
  if (!response.ok) {
    console.error('Error fetching usuarios:', response.statusText);
    return;
  }

  const usuarios = await response.json();
  const tbody = document.getElementById('tbody_usuarios');
  tbody.innerHTML = ''; // limpiar tabla

  usuarios.datos.forEach((usuario) => {
    // 🔹 Interpretar estado "activo"
    let estado = '';
    if (usuario.activo == 1) estado = '<span class="badge bg-success">Sí</span>';
    else if (usuario.activo == 2) estado = '<span class="badge bg-danger">No</span>';
    else estado = '<span class="badge bg-warning text-dark">Pendiente</span>';

    // 🔹 Crear fila
    const row = document.createElement('tr');
    row.innerHTML = `
      <th>${usuario.id_usuario}</th>
      <td>${usuario.nombre}</td>
      <td>${usuario.email}</td>
      <td>${usuario.telefono}</td>
      <td class="text-center">${estado}</td>
      <td class="text-center">
        <button class="btn btn-primary btn-sm" onclick="editar_usuario(${usuario.id_usuario})">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="btn btn-danger btn-sm" onclick="eliminar_usuario(${usuario.id_usuario})">
          <i class="fa-solid fa-trash"></i> Eliminar
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  focus('#texto_buscar_usuarios');
}


async function buscar_usuarios_roles() {
    const response = await fetch(`/api/usuarios_roles/${id_usuario.value}`);
    if (!response.ok) {
        console.error('Error fetching usuarios:', response.statusText);
        return;
    }

    const usuarios_roles = await response.json();
    console.log('Usuarios Roles fetched:', usuarios_roles);
    const tbody = document.getElementById('tbody_usuarios_roles');
    tbody.innerHTML = ''; // Clear existing rows

    usuarios_roles.datos.forEach((usuario_rol, index) => {
        const row = document.createElement('tr');
        let rol_select = `
        <select class="form-select">
            <option value='1' selected>Administrador</option>
            <option value='2'>Vendedor</option>
            <option value='3'>Comprador</option>
        </select>`

        if (usuario_rol.id_rol == '2') {
            rol_select = `
            <select class="form-select">
                <option value='1'>Administrador</option>
                <option value='2' selected>Vendedor</option>
                <option value='3'>Comprador</option>
            </select>`
        }

        if (usuario_rol.id_rol == '3') {
            rol_select = `
            <select class="form-select">
                <option value='1'>Administrador</option>
                <option value='2' selected>Vendedor</option>
                <option value='3' selected>Comprador</option>
            </select>`
        }

        row.innerHTML = `
            <th>${usuario_rol.id_usuario_rol}</th>
            <td>${rol_select}</td>
            <td class="text-center">
                <button class="btn btn-danger" onclick="eliminar_fila_usuario_rol(this)"><i class="fa-solid fa-trash"></i> Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function agregar_usuario() {
    mostar_formulario()
    id_usuario.value = ''
    nombre.value = ''
    email.value = ''
    telefono.value = ''
    password.value = ''
    activo.value = '1'
    focus('#nombre')
    const tbody = document.getElementById('tbody_usuarios_roles');
    tbody.innerHTML = '';
}

async function editar_usuario(id) {
    mostar_formulario()
    const parametros = {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }

    const response = await fetch(`/api/usuarios/${id}`, parametros)
    if (!response.ok) {
        console.error('Error fetching usuarios:', response.statusText);
        return;
    }

    const json = await response.json();
    console.log('Usuarios fetched:', json);
    id_usuario.value = json.datos.id_usuario
    nombre.value = json.datos.nombre
    email.value = json.datos.email
    telefono.value = json.datos.telefono
    password.value = json.datos.password
    activo.value = json.datos.activo
    focus('#nombre')
    buscar_usuarios_roles()
}

function eliminar_usuario(id) {
    mensaje_confirmar("Esta seguro de eliminar este registro?", 'Eliminar', `eliminar_usuario_confirmado(${id})`)
    focus('#id_usuario')
}

async function eliminar_usuario_confirmado(id) {
    const parametros = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    }

    const response = await fetch(`/api/usuarios/${id}`, parametros)
    if (!response.ok) {
        console.error('Error fetching usuarios:', response.statusText);
        return;
    }

    const json = await response.json();
    console.log('Usuarios fetched:', json);
    mostrar_lista()
    buscar_usuarios()
}

async function guardar_usuario() {
    console.log('guardar_usuario')
    if (id_usuario.value === '') {
        guardar_usuario_agregar()
    } else {
        guardar_usuario_modificar()
    }

}

async function guardar_usuario_agregar() {
    const parametros = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: nombre.value,
            email: email.value,
            telefono: telefono.value,
            password: password.value,
            activo: activo.value
        })
    }

    const response = await fetch(`/api/usuarios`, parametros)
    if (!response.ok) {
        console.error('Error fetching usuarios:', response.statusText);
        return;
    }

    const json = await response.json();
    console.log('Usuarios fetched:', json);
    mostrar_lista()
    buscar_usuarios()
}

async function guardar_usuario_modificar() {
    const parametros = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: nombre.value,
            email: email.value,
            telefono: telefono.value,
            password: password.value,
            activo: activo.value
        })
    }

    const response = await fetch(`/api/usuarios/${id_usuario.value}`, parametros)
    if (!response.ok) {
        console.error('Error fetching usuarios:', response.statusText);
        return;
    }

    const json = await response.json();
    console.log('Usuarios fetched:', json);
    mostrar_lista()
    buscar_usuarios()
}

function retornar_lista() {
    mostrar_lista()
}

function mostrar_lista() {
    card_formulario.hidden = true
    card_lista.hidden = false
}

function mostar_formulario() {
    card_formulario.hidden = false
    card_lista.hidden = true
}

async function agregar_fila_usuario_rol() {
  if (id_usuario.value == '') {
    mensaje('Debe guardar primero el usuario para agregar un rol', '');
    return true;
  }

  // 🔹 Obtener roles desde la API
  const response = await fetch('/api/roles');
  if (!response.ok) {
    console.error('Error al cargar roles:', response.statusText);
    mensaje('Error al cargar roles desde la base de datos', '');
    return;
  }

  const data = await response.json();
  const roles = data.datos || [];

  if (roles.length === 0) {
    mensaje('No hay roles disponibles en la base de datos', '');
    return;
  }

  // 🔹 Crear fila
  let xtbody = document.getElementById("tbody_usuarios_roles");
  let nuevaFila = xtbody.insertRow();
  let celda1 = nuevaFila.insertCell(0);
  let celda2 = nuevaFila.insertCell(1);
  let celda3 = nuevaFila.insertCell(2);
  celda3.classList.add("text-center");

  // 🔹 Construir combo dinámico
  let options = roles.map(r => `<option value='${r.id_rol}'>${r.nombre_rol}</option>`).join('');
  const rol_select = `<select class="form-select">${options}</select>`;

  // 🔹 Botones de acción
  const botones = `
    <button class="btn btn-primary btn-sm" onclick="guardar_fila_usuario_rol(this)">
      <i class="fa-solid fa-floppy-disk"></i> Guardar
    </button>
    <button class="btn btn-danger btn-sm" onclick="cancelar_fila_usuario_rol(this)">
      <i class="fa-solid fa-xmark"></i> Cancelar
    </button>
  `;

  celda1.innerHTML = '';
  celda2.innerHTML = rol_select;
  celda3.innerHTML = botones;
}


async function guardar_fila_usuario_rol(xthis) {
    const fila = xthis.closest("tr");
    let id_rol = fila.cells[1].querySelector("select")?.value || "";
    console.log(id_rol)
    const parametros = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id_usuario: id_usuario.value,
            id_rol: id_rol
        })
    }

    const response = await fetch(`/api/usuarios_roles`, parametros)
    if (!response.ok) {
        console.error('Error fetching usuarios:', response.statusText);
        return;
    }

    const json = await response.json();
    console.log('Usuarios roles fetched:', json);
    buscar_usuarios_roles()
}

function cancelar_fila_usuario_rol(xthis){
    xthis.parentNode.parentNode.remove()
}

async function eliminar_fila_usuario_rol(xthis) {
    const fila = xthis.closest("tr");
    let id_usuario_rol = fila.cells[0].innerText;
    console.log(id_usuario_rol)
    const parametros = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    }

    const response = await fetch(`/api/usuarios_roles/${id_usuario_rol}`, parametros)
    if (!response.ok) {
        console.error('Error fetching usuarios:', response.statusText);
        return;
    }

    const json = await response.json();
    console.log('Usuarios roles fetched:', json);
    buscar_usuarios_roles()
}