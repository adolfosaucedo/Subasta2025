var email = document.getElementById('email')
var password = document.getElementById('password')
email.focus()
siguiente_campo('#email', '#password', false)
siguiente_campo('#password', '#boton_ingresar', false)

document.getElementById('boton_ingresar').addEventListener("click", function () {
    if (validar_formulario()) {
        login()
    }
});

function validar_formulario() {
    if (email.value == '') {
        mensaje("Email vacio.", "focus('#email')")
        return false
    }
    if (password.value == '') {
        mensaje("Password incorrecto.", "focus('#password')")
        return false
    }
    return true
}

async function login() {
    const url = `api/usuarios/login`

    const parametros = {
        method: 'POST',
        headers: {
            "Accept": 'application/json',
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            email: email.value,
            password: password.value,
        })
    }

    const datos = await fetch(url, parametros)
    const json = await datos.json();
    console.log('login json',json)
    if (json.status !== 200) {
        mensaje("Credenciales incorrectas.", "focus('#email')")
    } else {
        location.href = './menu'
    }
}

function salir_formulario() {
    location.href = '/'
}