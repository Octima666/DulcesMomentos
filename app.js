// ========================================================
// DULCES MOMENTOS - LÓGICA DE LA APLICACIÓN (app.js)
// ========================================================

// --------------------------------------------------------
// 1. BASE DE DATOS Y ESTADO GLOBAL
// --------------------------------------------------------
const PRODUCTOS = [
  {
    id: 1,
    nombre: "Torta Red Velvet Boutique",
    categoria: "Tortas",
    precio: 18500,
    descripcion: "Bizcochuelo aterciopelado de cacao con frosting de queso crema y frutos rojos frescos.",
    imagen: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    nombre: "Chocotorta Suprema Gourmet",
    categoria: "Tortas",
    precio: 16000,
    descripcion: "Capas de galletitas embebidas en café especial, dulce de leche repostero y crema de autor.",
    imagen: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    nombre: "Cheesecake de Frutos del Bosque",
    categoria: "Postres",
    precio: 15500,
    descripcion: "Base crocante de galleta, crema suave horneada y mermelada artesanal de frutos regionales.",
    imagen: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    nombre: "Lemon Pie Artesanal",
    categoria: "Postres",
    precio: 14000,
    descripcion: "Masa sablée crocante, crema suave de limón y merengue italiano flameado.",
    imagen: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 5,
    nombre: "Macarons Gourmet (Caja x6)",
    categoria: "Especialidades",
    precio: 9800,
    descripcion: "Surtido fino de pistacho, maracuyá, chocolate belga, frambuesa y dulce de leche.",
    imagen: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 6,
    nombre: "Box Degustación Mini Pastelería",
    categoria: "Especialidades",
    precio: 21000,
    descripcion: "Selección especial de 8 miniporciones surtidas con nuestras creaciones destacadas.",
    imagen: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
  }
];

// Estado persistente
let estado = {
  usuario: JSON.parse(localStorage.getItem('dm_usuario')) || null,
  carrito: JSON.parse(localStorage.getItem('dm_carrito')) || [],
  categoriaFiltro: 'Todos',
  pinPendiente: null,
  datosTempAuth: null
};

// --------------------------------------------------------
// 2. INICIALIZACIÓN
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initAuthEvents();
  initCartEvents();
  renderProductos();
  actualizarUIAuth();
  actualizarCarritoUI();
});

// --------------------------------------------------------
// 3. MÓDULO DE AUTENTICACIÓN Y 2FA
// --------------------------------------------------------
function initAuthEvents() {
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const formPin = document.getElementById('form-verify-pin');

  // Alternar Pestañas Login / Registro
  tabLogin?.addEventListener('click', () => mostrarTabAuth('login'));
  tabRegister?.addEventListener('click', () => mostrarTabAuth('register'));

  document.getElementById('link-ir-registro')?.addEventListener('click', () => mostrarTabAuth('register'));
  document.getElementById('link-ir-login')?.addEventListener('click', () => mostrarTabAuth('login'));

  // Visibilidad de contraseña
  initTogglePass('btn-toggle-login-pass', 'login-password', 'icon-eye-login');
  initTogglePass('btn-toggle-reg-pass', 'reg-password', 'icon-eye-reg');

  // Submit Login
  formLogin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const correo = document.getElementById('login-correo').value.trim();
    const pass = document.getElementById('login-password').value;

    if (!correo || !pass) {
      mostrarAlerta('alerta-login', 'alerta-login-texto', 'Por favor completá todos los campos.');
      return;
    }

    iniciarSimulacion2FA({ correo, nombre: correo.split('@')[0] });
  });

  // Submit Registro
  formRegister?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('reg-nombre').value.trim();
    const apellido = document.getElementById('reg-apellido').value.trim();
    const correo = document.getElementById('reg-correo').value.trim();
    const pass = document.getElementById('reg-password').value;

    if (!nombre || !apellido || !correo || pass.length < 6) {
      mostrarAlerta('alerta-register', 'alerta-register-texto', 'Verificá que todos los campos sean válidos.');
      return;
    }

    iniciarSimulacion2FA({ correo, nombre: `${nombre} ${apellido}` });
  });

  // Submit Verificación PIN 2FA
  formPin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pinIngresado = document.getElementById('input-codigo-pin').value.trim();

    if (pinIngresado === estado.pinPendiente) {
      // Éxito de Autenticación
      estado.usuario = estado.datosTempAuth;
      localStorage.setItem('dm_usuario', JSON.stringify(estado.usuario));
      estado.pinPendiente = null;
      estado.datosTempAuth = null;
      
      actualizarUIAuth();
      alert(`¡Bienvenido/a a Dulces Momentos, ${estado.usuario.nombre}!`);
    } else {
      mostrarAlerta('alerta-pin', 'alerta-pin-texto', 'El código PIN ingresado es incorrecto.');
    }
  });

  // Botón Volver desde PIN
  document.getElementById('btn-volver-auth')?.addEventListener('click', () => {
    formPin.classList.add('hidden');
    formLogin.classList.remove('hidden');
    document.getElementById('tab-btn-login').classList.remove('hidden');
    document.getElementById('tab-btn-register').classList.remove('hidden');
  });

  // Reenviar PIN
  document.getElementById('btn-reenviar-pin')?.addEventListener('click', () => {
    if (estado.datosTempAuth) {
      iniciarSimulacion2FA(estado.datosTempAuth);
      alert(`Nuevo PIN generado y enviado: ${estado.pinPendiente}`);
    }
  });

  // Cerrar Sesión
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    estado.usuario = null;
    localStorage.removeItem('dm_usuario');
    actualizarUIAuth();
  });
}

function mostrarTabAuth(tipo) {
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  ocultarAlertas();

  if (tipo === 'login') {
    tabLogin.className = "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-600 shadow-md shadow-brand-600/30 transition-all duration-200";
    tabRegister.className = "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-stone-400 hover:text-stone-200 transition-all duration-200";
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
  } else {
    tabRegister.className = "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-600 shadow-md shadow-brand-600/30 transition-all duration-200";
    tabLogin.className = "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-stone-400 hover:text-stone-200 transition-all duration-200";
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
  }
}

function iniciarSimulacion2FA(datosUsuario) {
  // Genera PIN aleatorio de 6 dígitos
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  estado.pinPendiente = pin;
  estado.datosTempAuth = datosUsuario;

  // Cambiar Vista
  document.getElementById('form-login').classList.add('hidden');
  document.getElementById('form-register').classList.add('hidden');
  document.getElementById('form-verify-pin').classList.remove('hidden');

  document.getElementById('pin-correo-destino').textContent = datosUsuario.correo;
  
  // Muestra el PIN mediante alerta para probar la función 2FA
  setTimeout(() => {
    alert(`🔐 CÓDIGO 2FA DEMO: Tu PIN de verificación es ${pin}`);
  }, 400);
}

function actualizarUIAuth() {
  const portalAuth = document.getElementById('seccion-auth-portal');
  const appMain = document.getElementById('app-main-content');
  const userNavContainer = document.getElementById('nav-user-container');
  const userNavName = document.getElementById('nav-user-name');
  const userNavAvatar = document.getElementById('nav-user-avatar');

  if (estado.usuario) {
    portalAuth.classList.add('hidden');
    appMain.classList.remove('hidden');
    userNavContainer.classList.remove('hidden');
    userNavContainer.classList.add('flex');

    userNavName.textContent = estado.usuario.nombre;
    userNavAvatar.textContent = estado.usuario.nombre.charAt(0).toUpperCase();
  } else {
    portalAuth.classList.remove('hidden');
    appMain.classList.add('hidden');
    userNavContainer.classList.add('hidden');
    userNavContainer.classList.remove('flex');
  }
}

// --------------------------------------------------------
// 4. MÓDULO DEL CATÁLOGO DE PRODUCTOS
// --------------------------------------------------------
function renderProductos() {
  const grid = document.getElementById('grid-productos');
  if (!grid) return;

  const productosFiltrados = estado.categoriaFiltro === 'Todos' 
    ? PRODUCTOS 
    : PRODUCTOS.filter(p => p.categoria === estado.categoriaFiltro);

  grid.innerHTML = productosFiltrados.map(prod => `
    <div class="bg-[#181317] border border-[#2a1e27] hover:border-brand-600/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
      <div>
        <div class="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-stone-900">
          <img src="${prod.imagen}" alt="${prod.nombre}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-pink-300 backdrop-blur-md border border-pink-500/20">
            ${prod.categoria}
          </span>
        </div>
        <h3 class="font-serif text-base font-bold text-white mb-1">${prod.nombre}</h3>
        <p class="text-xs text-stone-400 line-clamp-2 mb-4 leading-relaxed">${prod.descripcion}</p>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-[#2a1e27]">
        <span class="font-serif text-lg font-bold text-pink-400">$${prod.precio.toLocaleString('es-AR')}</span>
        <button 
          onclick="agregarAlCarrito(${prod.id})"
          class="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition active:scale-95 flex items-center gap-1.5 shadow-md shadow-brand-600/20"
        >
          <span>+ Agregar</span>
        </button>
      </div>
    </div>
  `).join('');
}

// Función global requerida por los botones de navegación HTML
window.filtrarCategoriaDesdeNav = function(categoria) {
  estado.categoriaFiltro = categoria;
  renderProductos();
  
  // Desplazar suavemente hasta el catálogo si está en la tienda
  const catalogoEl = document.getElementById('catalogo');
  if (catalogoEl) catalogoEl.scrollIntoView({ behavior: 'smooth' });
};

// --------------------------------------------------------
// 5. MÓDULO DEL CARRITO DE COMPRAS (DRAWER)
// --------------------------------------------------------
function initCartEvents() {
  const btnIconoCarrito = document.getElementById('btn-icono-carrito');
  const btnAbrirCarrito = document.getElementById('btn-abrir-carrito');
  const btnCerrarCarrito = document.getElementById('btn-cerrar-carrito');
  const overlay = document.getElementById('carrito-overlay');
  const btnCheckout = document.getElementById('btn-checkout');

  btnIconoCarrito?.addEventListener('click', abrirDrawerCarrito);
  btnAbrirCarrito?.addEventListener('click', abrirDrawerCarrito);
  btnCerrarCarrito?.addEventListener('click', cerrarDrawerCarrito);
  overlay?.addEventListener('click', cerrarDrawerCarrito);

  btnCheckout?.addEventListener('click', procesarPedidoWhatsApp);
}

function abrirDrawerCarrito() {
  const drawer = document.getElementById('drawer-carrito');
  const panel = document.getElementById('carrito-panel');
  
  drawer.classList.remove('pointer-events-none', 'opacity-0');
  drawer.classList.add('opacity-100');
  panel.classList.remove('translate-x-full');
}

function cerrarDrawerCarrito() {
  const drawer = document.getElementById('drawer-carrito');
  const panel = document.getElementById('carrito-panel');

  panel.classList.add('translate-x-full');
  drawer.classList.remove('opacity-100');
  drawer.classList.add('opacity-0', 'pointer-events-none');
}

window.agregarAlCarrito = function(idProd) {
  const itemExiste = estado.carrito.find(item => item.id === idProd);

  if (itemExiste) {
    itemExiste.cantidad += 1;
  } else {
    const prod = PRODUCTOS.find(p => p.id === idProd);
    if (prod) {
      estado.carrito.push({ ...prod, cantidad: 1 });
    }
  }

  guardarYActualizarCarrito();
  abrirDrawerCarrito();
};

window.cambiarCantidadCarrito = function(idProd, delta) {
  const item = estado.carrito.find(i => i.id === idProd);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    estado.carrito = estado.carrito.filter(i => i.id !== idProd);
  }

  guardarYActualizarCarrito();
};

function guardarYActualizarCarrito() {
  localStorage.setItem('dm_carrito', JSON.stringify(estado.carrito));
  actualizarCarritoUI();
}

function actualizarCarritoUI() {
  const badge = document.getElementById('badge-carrito');
  const contenedorItems = document.getElementById('carrito-items');
  const totalEl = document.getElementById('carrito-total');

  const totalItems = estado.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const totalPrecio = estado.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  if (badge) badge.textContent = totalItems;
  if (totalEl) totalEl.textContent = `$${totalPrecio.toLocaleString('es-AR')}`;

  if (!contenedorItems) return;

  if (estado.carrito.length === 0) {
    contenedorItems.innerHTML = `
      <div class="text-center py-12 text-stone-500 space-y-2">
        <span class="text-4xl block">🧁</span>
        <p class="text-xs">Tu carrito está vacío.</p>
        <p class="text-[11px] text-stone-600">¡Explorá nuestro menú y agregá tus favoritos!</p>
      </div>
    `;
    return;
  }

  contenedorItems.innerHTML = estado.carrito.map(item => `
    <div class="flex items-center gap-3 p-3 rounded-xl bg-[#181216] border border-[#2e1d29]">
      <img src="${item.imagen}" alt="${item.nombre}" class="w-14 h-14 object-cover rounded-lg shrink-0">
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-white truncate">${item.nombre}</h4>
        <p class="text-xs text-pink-400 font-semibold mt-0.5">$${(item.precio * item.cantidad).toLocaleString('es-AR')}</p>
        
        <div class="flex items-center gap-2 mt-2">
          <button onclick="cambiarCantidadCarrito(${item.id}, -1)" class="w-5 h-5 rounded bg-stone-800 text-white flex items-center justify-center text-xs hover:bg-stone-700">-</button>
          <span class="text-xs font-bold text-stone-200 px-1">${item.cantidad}</span>
          <button onclick="cambiarCantidadCarrito(${item.id}, 1)" class="w-5 h-5 rounded bg-stone-800 text-white flex items-center justify-center text-xs hover:bg-stone-700">+</button>
        </div>
      </div>
      <button onclick="cambiarCantidadCarrito(${item.id}, -${item.cantidad})" class="p-1 text-stone-500 hover:text-red-400 transition text-xs">
        ✕
      </button>
    </div>
  `).join('');
}

function procesarPedidoWhatsApp() {
  if (estado.carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const nombreCliente = estado.usuario ? estado.usuario.nombre : "Cliente";
  let mensaje = `Hola Dulces Momentos! 🍰 Mi nombre es *${nombreCliente}* y deseo realizar el siguiente pedido:\n\n`;

  estado.carrito.forEach(item => {
    mensaje += `• ${item.cantidad}x ${item.nombre} - $${(item.precio * item.cantidad).toLocaleString('es-AR')}\n`;
  });

  const total = estado.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  mensaje += `\n*Total estimado: $${total.toLocaleString('es-AR')}*`;
  mensaje += `\n\nPor favor confirmar disponibilidad y método de pago (Mercado Pago / Efectivo).`;

  const urlWhatsApp = `https://wa.me/5493757571985?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWhatsApp, '_blank');
}

// --------------------------------------------------------
// 6. FUNCIONES DE APOYO Y UI
// --------------------------------------------------------
function initTogglePass(btnId, inputId, iconId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  
  btn?.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
    } else {
      input.type = 'password';
    }
  });
}

function mostrarAlerta(alertaId, textoId, mensaje) {
  const alerta = document.getElementById(alertaId);
  const texto = document.getElementById(textoId);
  if (alerta && texto) {
    texto.textContent = mensaje;
    alerta.classList.remove('hidden');
  }
}

function ocultarAlertas() {
  ['alerta-login', 'alerta-register', 'alerta-pin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}