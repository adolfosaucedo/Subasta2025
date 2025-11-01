function focus(campo) {
  const elemento = document.querySelector(campo);
  if (
    elemento.getAttribute("type") === "button" ||
    elemento.tagName == "SELECT"
  ) {
    elemento.focus();
  } else {
    elemento.select();
  }
}

function siguiente_campo(actual, siguiente, preventDefault) {
  const actualCampo = document.querySelector(actual);
  document.querySelector(actual).addEventListener("keydown", (event) => {
    if (actualCampo.tagName !== "TEXTAREA") {
      const siguienteCampo = document.querySelector(siguiente);
      if (event.which === 13) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (
          siguienteCampo.getAttribute("type") === "button" ||
          siguienteCampo.tagName == "SELECT"
        ) {
          siguienteCampo.focus();
        } else {
          siguienteCampo.select();
        }
      }
    }
  });
}

function mensaje(texto, funcion) {
  const modal = `
    <div class="modal" id="myModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Mensaje del sistema</h5>
                    <button type="button" class="btn-close btn-outline-warning rounded-circle" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${texto}</p>
                </div>
                <div class="modal-footer">
                    <button id="mensaje-aceptar" type="button" class="btn btn-primary" data-bs-dismiss="modal">
                        <i class="fa-solid fa-check"></i> Aceptar
                    </button>
                </div>
            </div>
        </div>
    </div>`;
  document.getElementById("panel-mensaje").innerHTML = modal;
  const options = {};
  const myModal = new bootstrap.Modal(
    document.getElementById("myModal"),
    options
  );
  myModal.show();
  const mensaje_aceptar = document.querySelector("#mensaje-aceptar");
  mensaje_aceptar.focus();
  mensaje_aceptar.addEventListener("click", function () {
    eval(funcion);
    document.querySelector("#panel-mensaje").innerHTML = "";
  });
}

function mensaje_confirmar(texto, texto_boton, funcion) {
  const modal = `
    <div id="myModal" class="modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Mensaje del Sistema</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${texto}</p>
                </div>
                <div class="modal-footer">
                    <button id="mensaje-eliminar" type="button" class="btn btn-primary" data-bs-dismiss="modal"><i class="fa-solid fa-trash"></i> ${texto_boton}</button>
                    <button id="mensaje-cancelar" type="button" class="btn btn-danger" data-bs-dismiss="modal"><i class="fa-solid fa-arrow-right-from-bracket"></i> Cancelar</button>
                </div>
            </div>
        </div>
    </div>
    `;
  document.querySelector("#panel-mensaje").innerHTML = modal;
  let options = {};
  var myModal = new bootstrap.Modal(
    document.getElementById("myModal"),
    options
  );
  myModal.show();
  const mensaje_eliminar = document.querySelector("#mensaje-eliminar");
  const mensaje_cancelar = document.querySelector("#mensaje-cancelar");
  mensaje_cancelar.focus();
  mensaje_eliminar.addEventListener("click", function () {
    eval(funcion);
    document.querySelector("#panel-mensaje").innerHTML = "";
  });
}

async function cargar_formulario(div, url, funcion) {

  const response = await fetch(url);
  const div_link = "#" + div + " link";
  const div_script = "#" + div + " script";
  if (response.status === 200) {
    const cuerpo = await response.text();
    console.log('--->',div)
    console.log('--->',url)
    console.log('--->',document.getElementById(div))
    document.getElementById(div).innerHTML = cuerpo;
    document.querySelectorAll(div_link).forEach((link) => {
      document.getElementById(div).removeChild(link);
      var linkElement = document.createElement("link");
      for (attribute of link.attributes) {
        linkElement.setAttribute(attribute.name, attribute.value);
      }
      linkElement.text = link.innerHTML;
      document.getElementById(div).append(linkElement);
    });
    document.querySelectorAll(div_script).forEach((script) => {
      document.getElementById(div).removeChild(script);
      var scriptElement = document.createElement("script");
      for (attribute of script.attributes) {
        scriptElement.setAttribute(attribute.name, attribute.value);
      }
      document.getElementById(div).append(scriptElement);
      eval(script.innerText);
    });
    eval(funcion);
  }
}

function salir_formulario(){
  console.log('salir_formulario')
  document.getElementById('panel-formulario').innerHTML = ''
}

function mostrar_imagen_file(input_file,imagen){
  document.getElementById(input_file).addEventListener("change", function (event) {
    const file = event.target.files[0]; 
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.getElementById(imagen);
        img.src = e.target.result;  
      };
      reader.readAsDataURL(file);
    }
  });
}