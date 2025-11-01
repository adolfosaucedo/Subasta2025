var id_rol = document.getElementById('id_rol')
var nombre_rol = document.getElementById('nombre_rol')
var texto_buscar_roles = document.getElementById('texto_buscar_roles')
var card_formulario = document.getElementById('card_formulario')
var card_lista = document.getElementById('card_lista')
focus('#texto_buscar_roles');
siguiente_campo('#texto_buscar_roles', '#boton_texto_buscar_roles',false);
siguiente_campo('#id_rol', '#nombre_rol',false);
siguiente_campo('#nombre_rol', '#boton_guardar',true);
mostrar_lista()
buscar_roles();

async function buscar_roles() {
    const response = await fetch(`/api/roles?nombre=${texto_buscar_roles.value}`);
    if (!response.ok) {
        console.error('Error fetching roles:', response.statusText);
        return;
    }
    
    const roles = await response.json();
    console.log('Roles fetched:', roles);
    const tbody = document.getElementById('tbody_roles');
    tbody.innerHTML = ''; // Clear existing rows

    roles.datos.forEach((rol, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <th>${rol.id_rol}</th>
            <td>${rol.nombre_rol}</td>
            <td class="text-center">
                <button class="btn btn-primary" onclick="editar_rol(${rol.id_rol})"><i class="fa-solid fa-pen"></i> Editar</button>
                <button class="btn btn-danger" onclick="eliminar_rol(${rol.id_rol})"><i class="fa-solid fa-trash"></i> Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    focus('#texto_buscar_roles');
}

function agregar_rol(){
    mostar_formulario()
    id_rol.value = ''
    nombre_rol.value = ''
    focus('#nombre_rol')
}

async function editar_rol(id){
    mostar_formulario()
    const parametros = {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
    
    const response = await fetch(`/api/roles/${id}`,parametros)
    if (!response.ok) {
        console.error('Error fetching roles:', response.statusText);
        return;
    }
    
    const json = await response.json();
    console.log('Roles fetched:', json);
    id_rol.value = json.datos.id_rol
    nombre_rol.value = json.datos.nombre_rol
    focus('#nombre_rol')
}

function eliminar_rol(id){
    mensaje_confirmar("Esta seguro de eliminar este registro?", 'Eliminar', `eliminar_rol_confirmado(${id})`)
    focus('#id_rol')
}

async function eliminar_rol_confirmado(id){
    const parametros = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    }
    
    const response = await fetch(`/api/roles/${id}`,parametros)
    if (!response.ok) {
        console.error('Error fetching roles:', response.statusText);
        return;
    }
    
    const json = await response.json();
    console.log('Roles fetched:', json);
    mostrar_lista()
    buscar_roles()
}

async function guardar_rol(){
    console.log('guardar_rol')
    if(id_rol.value === ''){
        guardar_rol_agregar()
    } else {
        guardar_rol_modificar()
    }
    
}

async function guardar_rol_agregar(){
    const parametros = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre_rol: nombre_rol.value
      })
    }
    
    const response = await fetch(`/api/roles`,parametros)
    if (!response.ok) {
        console.error('Error fetching roles:', response.statusText);
        return;
    }
    
    const json = await response.json();
    console.log('Roles fetched:', json);
    mostrar_lista()
    buscar_roles()
}

async function guardar_rol_modificar(){
    const parametros = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre_rol: nombre_rol.value
      })
    }
    
    const response = await fetch(`/api/roles/${id_rol.value}`,parametros)
    if (!response.ok) {
        console.error('Error fetching roles:', response.statusText);
        return;
    }
    
    const json = await response.json();
    console.log('Roles fetched:', json);
    mostrar_lista()
    buscar_roles()
}

function retornar_lista(){
    mostrar_lista()
}

function mostrar_lista(){
    card_formulario.hidden = true
    card_lista.hidden = false
}

function mostar_formulario(){
    card_formulario.hidden = false
    card_lista.hidden = true
}