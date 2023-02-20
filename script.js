import STRIPE_KEYS from "./stripe-keys.js";

const d = document,
    $productos = d.getElementById("productos"),
    $template = d.getElementById("tProducto").content,
    $fragment = d.createDocumentFragment(),
    fetchOptions = {
        headers: {
            Authorization: `Bearer ${STRIPE_KEYS.secret}`
        }
    }

let productos, precios;

Promise.all([
    fetch("https://api.stripe.com/v1/products", fetchOptions),
    fetch("https://api.stripe.com/v1/prices", fetchOptions)
])
.then((responses) => Promise.all(responses.map((res) => res.json())))
.then((json) => {
    productos = json[0].data;                   
    precios = json[1].data;                      
    
    precios.forEach(el => {
        //filtro para que el precio coincida con el producto correspondiente
        let productData = productos.filter(product => product.id === el.product);

        //stripe requiere que se le envie el id del precio del producto a vender, el cual guardamos en un data-attribute
        $template.querySelector(".producto").setAttribute("data-price", el.id);
        $template.querySelector("img").src = productData[0].images[0];
        $template.querySelector("img").alt = productData[0].name;
        $template.querySelector("figcaption").innerHTML = `
            ${productData[0].name}:
            <br>
            ${productData[0].description}
            <br>
            $${parseFloat(el.unit_amount/100)} ${(el.currency).toUpperCase()}
            
        `
        let $clone = d.importNode($template, true);

        $fragment.appendChild($clone);
    });
    $productos.appendChild($fragment);
})
.catch((err) => {
    let msg = err.statusText || "Ocurrio un error al conectarse con la API de STRIPE"
    $productos.innerHTML = `<p>Error ${err.status}: ${msg}</p>`
})

d.addEventListener("click", e => {
    if(e.target.matches(".producto *")){
        //obtengo el id del precio del elemento clickeado, desde la variable data-price
        let precioID = e.target.parentElement.getAttribute("data-price");
        Stripe(STRIPE_KEYS.public)
        .redirectToCheckout({
            lineItems:[{
                price: precioID, 
                quantity: 1 
            }],
            //si fuese para una suscripcion, se debe agregar "subscription" en lugar de payment
            mode: "payment",
            successUrl: "http://127.0.0.1:5500/assets/stripe-succes.html",
            cancelUrl: "http://127.0.0.1:5500/assets/stripe-cancel.html",
        })
        .then(res =>{
            if(res.error){
                $productos.insertAdjacentHTML("afterend", res.error.message);
            }

        });
    }
})