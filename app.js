/**
 * ============================================================================
 * PASTELERÍA "DULCES MOMENTOS" - LÓGICA PRINCIPAL (app.js)
 * Diseño Dark-Mode de Alta Fidelidad + Checkout WhatsApp + KDS
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================
  // 1. CONFIGURACIÓN Y CONSTANTES DEL SISTEMA
  // ========================================================
  const CONFIG = {
    telefonoWhatsApp: '5493757571985',
    claveCocinaKDS: 'niledlajo',
    costoEnvioFijo: 1500, // Costo de envío en Puerto Iguazú ($ ARS)

    centroIguazu: {
      lat: -25.5988,
      lon: -54.5755,
      radioMaximoKm: 12.0
    }
  };

  const STORAGE_KEYS = {
    COMANDAS: 'dulces_momentos_comandas_kds_v2',
    FAVORITOS: 'dulces_momentos_favoritos_v1',
    TOKEN: 'dulces_momentos_auth_token_v2',
    USUARIO: 'dulces_momentos_auth_user_v2'
  };

  // ========================================================
  // URL BASE DEL BACKEND - Detección automática de entorno
  // En producción (GitHub Pages) apunta al backend en Vercel.
  // En local, usa ruta relativa (el backend sirve el frontend).
  // ========================================================
  const API_BASE_URL = window.location.hostname === 'octima666.github.io'
    ? 'https://dulces-momentos.vercel.app'  // ← Backend desplegado en Vercel
    : '';  // En localhost, las rutas relativas funcionan correctamente

  // ========================================================
  // 2. FORMATEO CENTRALIZADO DE MONEDA ($ ARS)
  // ========================================================
  const formateadorARS = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });

  const formatearMoneda = (valor) => {
    // Formatea con espacio limpio ej: $ 14.500
    const str = formateadorARS.format(valor || 0);
    return str.replace('ARS', '$').trim();
  };

  // ========================================================
  // 3. CATÁLOGO DE PRODUCTOS (EXACTO AL DISEÑO DE ALTA FIDELIDAD)
  // ========================================================
  const PRODUCTOS = [
    {
      id: 'prod-001',
      nombre: 'Tarta Frutos del Bosque',
      categoria: 'Tortas',
      precio: 14500,
      descripcion: 'Masa sableé crocante rellena de suave crema pastelera artesanal y decorada con frutos rojos.',
      imagen: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=700&q=85',
      badge: 'MÁS VENDIDO',
      toppings: [
        { id: 'top-arandanos', nombre: 'Extra Arándanos Frescos', precio: 1200 },
        { id: 'top-choco-blanco', nombre: 'Rulos de Chocolate Blanco Belga', precio: 900 }
      ]
    },
    {
      id: 'prod-002',
      nombre: 'Cheesecake New York Clásico',
      categoria: 'Postres',
      precio: 15800,
      descripcion: 'Textura ultra cremosa homemade a base de Mafá con base de galletas Graham y coulis de frutos silvestres.',
      imagen: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=85',
      badge: 'FAVORITO',
      toppings: [
        { id: 'top-maracuya', nombre: 'Salsa Reducción de Maracuyá', precio: 1500 },
        { id: 'top-frutillas', nombre: 'Frutillas maceradas', precio: 1100 }
      ]
    },
    {
      id: 'prod-003',
      nombre: 'Tarta Húmeda de Chocolate Belga',
      categoria: 'Tortas',
      precio: 16200,
      descripcion: 'Intensa bizcocho de cacao 70% con ganache de chocolate semi amargo y un toque de café espresso.',
      imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=85',
      badge: 'GOURMET',
      toppings: [
        { id: 'top-avellanas', nombre: 'Praliné de Avellanas Tostadas', precio: 1400 },
        { id: 'top-ddl', nombre: 'Corazón de Dulce de Leche Repostero', precio: 1000 }
      ]
    },
    {
      id: 'prod-004',
      nombre: 'Macarons Artesanales',
      categoria: 'Especialidades',
      precio: 12000,
      descripcion: 'Suaves, crujientes y rellenos de ganache de sabores unicos.',
      imagen: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=700&q=85',
      badge: 'ESPECIAL',
      toppings: [
        { id: 'top-caja-regalo', nombre: 'Packaging de Regalo + Moño de Seda', precio: 800 }
      ]
    },
    {
      id: 'prod-005',
      nombre: 'Croissant Francés con Almendras',
      categoria: 'Masas',
      precio: 6500,
      descripcion: 'Hojaldre artesanal 100% manteca con crema de almendras tostadas y azúcar impalpable.',
      imagen: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=85',
      badge: 'ARTESANAL',
      toppings: [
        { id: 'top-chocolate', nombre: 'Baño de Chocolate Belga', precio: 700 }
      ]
    },
    {
      id: 'prod-006',
      nombre: 'Box Degustación Fiesta',
      categoria: 'Promociones',
      precio: 22000,
      descripcion: 'Surtido exclusivo de 2 porciones de torta, 4 macarons y 2 mini postres para compartir.',
      imagen: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=700&q=85',
      badge: 'PROMO DULCE',
      toppings: [
        { id: 'top-tarjeta', nombre: 'Tarjeta de Felicitaciones Artesanal', precio: 500 }
      ]
    }
  ];

  // ========================================================
  // 4. ESTADO GLOBAL
  // ========================================================
  let state = {
    carrito: [],
    comandasCocina: [],
    favoritos: new Set(),
    categoriaSeleccionada: 'todos',
    tipoEntrega: 'takeaway',
    metodoPago: 'efectivo',
    ubicacionValidadaIguazu: false,
    auth: {
      token: null,
      usuario: null,
      autenticado: false
    }
  };

  // ========================================================
  // 5. INICIALIZACIÓN
  // ========================================================
  const cargarEstadoInicial = () => {
    try {
      state.carrito = [];

      const comandasGuardadas = localStorage.getItem(STORAGE_KEYS.COMANDAS);
      if (comandasGuardadas) state.comandasCocina = JSON.parse(comandasGuardadas);

      const favoritosGuardados = localStorage.getItem(STORAGE_KEYS.FAVORITOS);
      if (favoritosGuardados) state.favoritos = new Set(JSON.parse(favoritosGuardados));
    } catch (e) {
      console.warn('Error al cargar datos iniciales:', e);
    }
  };

  const guardarComandasEnStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(state.comandasCocina));
      renderizarComandasKDS();
    } catch (e) {
      console.warn('Error al guardar comandas:', e);
    }
  };

  const guardarFavoritosEnStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITOS, JSON.stringify([...state.favoritos]));
    } catch (e) {
      console.warn('Error al guardar favoritos:', e);
    }
  };

  // ========================================================
  // 6. SISTEMA DE TOAST NOTIFICATIONS
  // ========================================================
  const mostrarToast = (mensaje, tipo = 'info') => {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;

    const toast = document.createElement('div');
    const iconos = {
      success: '✨',
      error: '❌',
      warning: '⚠️',
      info: '💖'
    };

    const estilos = {
      success: 'bg-[#22101b] border-brand-500/60 text-pink-200',
      error: 'bg-[#250d12] border-red-500/60 text-red-200',
      warning: 'bg-[#25180c] border-amber-500/60 text-amber-200',
      info: 'bg-[#181217] border-[#382333] text-stone-200'
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl font-medium text-xs sm:text-sm transform transition-all duration-300 pointer-events-auto opacity-0 translate-y-3 ${estilos[tipo] || estilos.info}`;
    toast.innerHTML = `
      <span class="text-base sm:text-lg">${iconos[tipo] || '💖'}</span>
      <span class="flex-1">${mensaje}</span>
    `;

    contenedor.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-3');
      toast.classList.add('opacity-100', 'translate-y-0');
    });

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-3');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  };

  // ========================================================
  // 7. RENDERIZADO DEL CATÁLOGO DE PRODUCTOS (DARK GRID)
  // ========================================================
  const renderizarCatalogo = () => {
    const contenedor = document.getElementById('catalogo-productos');
    if (!contenedor) return;

    const productosFiltrados = state.categoriaSeleccionada === 'todos'
      ? PRODUCTOS
      : PRODUCTOS.filter(p => p.categoria.toLowerCase() === state.categoriaSeleccionada.toLowerCase());

    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = `
        <div class="col-span-full py-16 text-center text-stone-400 bg-[#161115] rounded-3xl border border-[#2b1e29] p-8">
          <p class="text-4xl mb-3">🍰</p>
          <p class="font-serif text-xl font-bold text-white">No encontramos productos en esta categoría.</p>
          <p class="text-xs text-stone-400 mt-1">Explorá nuestras otras delicias o mirá toda la colección.</p>
          <button onclick="window.filtrarCategoriaDesdeNav('todos')" class="mt-4 px-5 py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition">
            Ver Todos los Productos
          </button>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = productosFiltrados.map(prod => {
      const esFav = state.favoritos.has(prod.id);
      return `
        <article class="product-card rounded-3xl overflow-hidden shadow-lg flex flex-col group relative">
          
          <!-- Contenedor Imagen y Badges -->
          <div class="relative overflow-hidden aspect-[4/3] bg-[#140e13]">
            <img 
              src="${prod.imagen}" 
              alt="${prod.nombre}" 
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            >
            
            <!-- Badge Superior Izquierdo -->
            <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-brand-600/90 text-white shadow-md backdrop-blur-xs">
              ${prod.badge || prod.categoria}
            </span>

            <!-- Botón Favorito Superior Derecho -->
            <button 
              data-fav-id="${prod.id}" 
              aria-label="Agregar a favoritos"
              class="btn-toggle-fav absolute top-3 right-3 w-8 h-8 rounded-full bg-[#0c090c]/70 hover:bg-[#0c090c] backdrop-blur-md flex items-center justify-center text-sm transition transform active:scale-90 border border-white/10 ${esFav ? 'text-brand-400' : 'text-stone-300'}"
            >
              ${esFav ? '♥' : '♡'}
            </button>
          </div>

          <!-- Cuerpo de la Tarjeta -->
          <div class="p-5 flex flex-col flex-1 justify-between bg-[#171216]">
            <div>
              <h3 class="font-serif text-base sm:text-lg font-bold text-white leading-snug group-hover:text-pink-300 transition-colors mb-1.5">
                ${prod.nombre}
              </h3>
              <p class="text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4">
                ${prod.descripcion}
              </p>
            </div>

            <!-- Selector opcional de toppings si posee -->
            ${prod.toppings && prod.toppings.length > 0 ? `
              <div class="mb-3 pt-2 border-t border-[#291c27]">
                <label for="topping-${prod.id}" class="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Personalización
                </label>
                <select id="topping-${prod.id}" class="select-topping w-full text-xs rounded-xl px-2.5 py-1.5 bg-[#120d11] border border-[#332130] text-stone-200 focus:ring-1 focus:ring-brand-500 focus:outline-none transition">
                  <option value="">✨ Sin topping adicional</option>
                  ${prod.toppings.map(t => `
                    <option value="${t.id}">+ ${t.nombre} (${formatearMoneda(t.precio)})</option>
                  `).join('')}
                </select>
              </div>
            ` : ''}

            <!-- Precio y Botón Agregar -->
            <div class="flex items-center justify-between pt-3 border-t border-[#291c27]">
              <div>
                <span class="font-serif text-base sm:text-lg font-bold text-white">
                  ${formatearMoneda(prod.precio)}
                </span>
              </div>

              <button 
                data-id="${prod.id}" 
                class="btn-agregar-carrito inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition-all"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Agregar</span>
              </button>
            </div>

          </div>
        </article>
      `;
    }).join('');

    // Listeners para botones agregar al carrito
    contenedor.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const prodId = e.currentTarget.getAttribute('data-id');
        const selectTopping = document.getElementById(`topping-${prodId}`);
        let toppingSeleccionado = null;

        if (selectTopping && selectTopping.value) {
          const prod = PRODUCTOS.find(p => p.id === prodId);
          const topObj = prod?.toppings?.find(t => t.id === selectTopping.value);
          if (topObj) toppingSeleccionado = topObj;
        }

        agregarProductoAlCarrito(prodId, toppingSeleccionado);
      });
    });

    // Listeners para Favoritos
    contenedor.querySelectorAll('.btn-toggle-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const favId = e.currentTarget.getAttribute('data-fav-id');
        if (state.favoritos.has(favId)) {
          state.favoritos.delete(favId);
          btn.innerHTML = '♡';
          btn.classList.remove('text-brand-400');
          btn.classList.add('text-stone-300');
          mostrarToast('Removido de tus favoritos', 'info');
        } else {
          state.favoritos.add(favId);
          btn.innerHTML = '♥';
          btn.classList.add('text-brand-400');
          btn.classList.remove('text-stone-300');
          mostrarToast('¡Guardado en tus favoritos! ♥', 'success');
        }
        guardarFavoritosEnStorage();
      });
    });
  };

  // ========================================================
  // 8. GESTIÓN DEL CARRITO DE COMPRAS
  // ========================================================
  const agregarProductoAlCarrito = (productoId, topping = null) => {
    const producto = PRODUCTOS.find(p => p.id === productoId);
    if (!producto) return;

    const toppingId = topping ? topping.id : 'sin-topping';
    const itemKey = `${productoId}__${toppingId}`;

    const itemExistente = state.carrito.find(item => item.itemKey === itemKey);
    const precioUnitario = producto.precio + (topping ? topping.precio : 0);

    if (itemExistente) {
      itemExistente.cantidad += 1;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.precioUnitario;
    } else {
      state.carrito.push({
        itemKey,
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        imagen: producto.imagen,
        precioBase: producto.precio,
        precioUnitario: precioUnitario,
        topping: topping,
        cantidad: 1,
        subtotal: precioUnitario
      });
    }

    renderizarCarrito();
    actualizarBadges();
    mostrarToast(`¡${producto.nombre} agregado al pedido!`, 'success');
  };

  const modificarCantidadItem = (itemKey, cambio) => {
    const itemIndex = state.carrito.findIndex(item => item.itemKey === itemKey);
    if (itemIndex === -1) return;

    state.carrito[itemIndex].cantidad += cambio;

    if (state.carrito[itemIndex].cantidad <= 0) {
      state.carrito.splice(itemIndex, 1);
    } else {
      state.carrito[itemIndex].subtotal = state.carrito[itemIndex].cantidad * state.carrito[itemIndex].precioUnitario;
    }

    renderizarCarrito();
    actualizarBadges();
  };

  const actualizarBadges = () => {
    const totalItems = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const badgeHeader = document.getElementById('badge-carrito');
    if (badgeHeader) badgeHeader.textContent = totalItems;
  };

  const renderizarCarrito = () => {
    const contenedorLista = document.getElementById('lista-carrito');
    const totalItemsHeader = document.getElementById('total-items-carrito');
    const subtotalEl = document.getElementById('subtotal-carrito');
    const envioEl = document.getElementById('costo-envio');
    const totalEl = document.getElementById('total-carrito');

    if (!contenedorLista) return;

    const totalCantidad = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (totalItemsHeader) {
      totalItemsHeader.textContent = `${totalCantidad} producto${totalCantidad === 1 ? '' : 's'} seleccionado${totalCantidad === 1 ? '' : 's'}`;
    }

    if (state.carrito.length === 0) {
      contenedorLista.innerHTML = `
        <div class="py-10 text-center text-stone-400">
          <span class="text-4xl block mb-2">🛒</span>
          <p class="font-serif text-base font-bold text-white">Tu pedido está vacío</p>
          <p class="text-xs mt-1 text-stone-400">Explorá nuestra colección y agregá tus postres preferidos.</p>
        </div>
      `;

      if (subtotalEl) subtotalEl.textContent = formatearMoneda(0);
      if (envioEl) envioEl.textContent = formatearMoneda(0);
      if (totalEl) totalEl.textContent = formatearMoneda(0);

      actualizarBotonCheckoutUI();
      return;
    }

    contenedorLista.innerHTML = state.carrito.map(item => `
      <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#1c151b] border border-[#33202e] shadow-xs">
        <img 
          src="${item.imagen}" 
          alt="${item.nombre}" 
          class="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#33202e]"
        >
        <div class="flex-1 min-w-0">
          <h4 class="font-serif font-bold text-xs sm:text-sm text-white truncate">
            ${item.nombre}
          </h4>
          ${item.topping ? `
            <p class="text-[11px] text-pink-400 font-medium truncate">
              + ${item.topping.nombre}
            </p>
          ` : ''}
          <div class="flex items-center gap-2 mt-1">
            <span class="font-mono text-xs font-bold text-pink-300">
              ${formatearMoneda(item.subtotal)}
            </span>
            <span class="text-[10px] text-stone-400">(${formatearMoneda(item.precioUnitario)} c/u)</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 bg-[#120d11] p-1 rounded-xl border border-[#33202e] shrink-0">
          <button 
            data-key="${item.itemKey}" 
            class="btn-restar w-6 h-6 flex items-center justify-center rounded-lg bg-[#20151f] text-stone-300 hover:text-white hover:bg-brand-600 text-xs font-bold transition"
            aria-label="Disminuir cantidad"
          >-</button>
          <span class="font-mono font-bold text-xs px-1 text-white">${item.cantidad}</span>
          <button 
            data-key="${item.itemKey}" 
            class="btn-sumar w-6 h-6 flex items-center justify-center rounded-lg bg-[#20151f] text-stone-300 hover:text-white hover:bg-brand-600 text-xs font-bold transition" 
            aria-label="Aumentar cantidad"
          >+</button>
        </div>
      </div>
    `).join('');

    // Listeners de cantidad
    contenedorLista.querySelectorAll('.btn-restar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.getAttribute('data-key');
        modificarCantidadItem(key, -1);
      });
    });
    
    contenedorLista.querySelectorAll('.btn-sumar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.getAttribute('data-key');
        modificarCantidadItem(key, 1);
      });
    });

    const subtotal = state.carrito.reduce((acc, item) => acc + item.subtotal, 0);
    const costoEnvio = state.tipoEntrega === 'delivery' ? CONFIG.costoEnvioFijo : 0;
    const total = subtotal + costoEnvio;

    if (subtotalEl) subtotalEl.textContent = formatearMoneda(subtotal);
    if (envioEl) envioEl.textContent = state.tipoEntrega === 'delivery' ? formatearMoneda(costoEnvio) : 'Bonificado';
    if (totalEl) totalEl.textContent = formatearMoneda(total);

    actualizarBotonCheckoutUI();
  };

  // ====================================================================
  // 9. ALTERNANCIA DINÁMICA DE LA UI Y SECCIÓN QR
  // ====================================================================
  const actualizarBotonCheckoutUI = () => {
    const btnCheckout = document.getElementById('btn-checkout-principal');
    const seccionQr = document.getElementById('seccion-qr');

    if (seccionQr) {
      if (state.metodoPago === 'mercadopago') {
        seccionQr.classList.remove('hidden');
      } else {
        seccionQr.classList.add('hidden');
      }
    }

    if (!btnCheckout) return;

    if (state.carrito.length === 0) {
      btnCheckout.disabled = true;
      btnCheckout.classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }

    btnCheckout.disabled = false;
    btnCheckout.classList.remove('opacity-50', 'cursor-not-allowed');
  };

  // ====================================================================
  // 10. CHECKOUT: ENVIAR PEDIDO POR WHATSAPP (+54 9 3757 57-1985)
  // ====================================================================
  const enviarPedidoWhatsApp = () => {
    if (state.carrito.length === 0) {
      mostrarToast('Tu pedido está vacío. Agregá al menos un postre.', 'warning');
      return;
    }

    const inputNombre = document.getElementById('input-nombre');
    const inputTelefono = document.getElementById('input-telefono');
    const inputNotas = document.getElementById('input-notas');
    const inputDireccion = document.getElementById('input-direccion');
    const inputComprobante = document.getElementById('input-comprobante');
    const errorTelefono = document.getElementById('error-telefono');

    const nombre = (inputNombre?.value || '').trim();
    const telefono = (inputTelefono?.value || '').trim();
    const notas = (inputNotas?.value || '').trim();
    const direccion = (inputDireccion?.value || '').trim();
    const comprobante = (inputComprobante?.value || '').trim();

    if (!nombre) {
      inputNombre?.focus();
      return mostrarToast('Por favor ingresá tu nombre completo.', 'error');
    }
    
    const telLimpio = telefono.replace(/\D/g, '');
    if (telLimpio.length < 8) {
      errorTelefono?.classList.remove('hidden');
      inputTelefono?.focus();
      return mostrarToast('El teléfono debe tener un formato válido (mínimo 8 dígitos)', 'error');
    } else {
      errorTelefono?.classList.add('hidden');
    }

    if (state.tipoEntrega === 'delivery' && !direccion) {
      inputDireccion?.focus();
      return mostrarToast('Por favor ingresá tu dirección en Puerto Iguazú.', 'error');
    }

    if (state.metodoPago === 'mercadopago' && !comprobante) {
      inputComprobante?.focus();
      return mostrarToast('Por favor ingresá el número o código de comprobante.', 'error');
    }

    const subtotal = state.carrito.reduce((acc, item) => acc + item.subtotal, 0);
    const costoEnvio = state.tipoEntrega === 'delivery' ? CONFIG.costoEnvioFijo : 0;
    const total = subtotal + costoEnvio;
    const comandaId = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;

    const nuevaComanda = {
      id: comandaId,
      fecha: new Date().toISOString(),
      cliente: nombre,
      telefono: telefono,
      tipoEntrega: state.tipoEntrega,
      direccion: state.tipoEntrega === 'delivery' ? direccion : 'Retiro por Boutique Dulces Momentos',
      metodoPago: state.metodoPago,
      comprobante: state.metodoPago === 'mercadopago' ? comprobante : null,
      notas: notas || 'Sin notas especiales',
      estado: 'pendiente',
      items: state.carrito.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        topping: item.topping ? item.topping.nombre : null,
        subtotal: item.subtotal
      })),
      subtotal: subtotal,
      envio: costoEnvio,
      total: total
    };

    state.comandasCocina.unshift(nuevaComanda);
    guardarComandasEnStorage();

    let mensaje = `🎂 *¡HOLA DULCES MOMENTOS!* 🎂\n`;
    mensaje += `Quiero confirmar el siguiente pedido:\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🧾 *ID Pedido:* #${nuevaComanda.id}\n`;
    mensaje += `👤 *Cliente:* ${nombre}\n`;
    mensaje += `📞 *Teléfono:* ${telefono}\n`;
    mensaje += `📍 *Modalidad:* ${state.tipoEntrega === 'takeaway' ? '🛍️ Retiro en Boutique' : '🛵 Delivery en Puerto Iguazú'}\n`;
    
    if (state.tipoEntrega === 'delivery') {
      mensaje += `🏡 *Dirección:* ${direccion}\n`;
    }
    
    if (notas) {
      mensaje += `📝 *Dedicatoria/Notas:* _${notas}_\n`;
    }

    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (state.metodoPago === 'mercadopago') {
      mensaje += `💳 *Forma de Pago:* Mercado Pago / Transferencia\n`;
      mensaje += `🧾 *N° Comprobante:* ${comprobante}\n`;
    } else {
      mensaje += `💳 *Forma de Pago:* Efectivo al recibir\n`;
    }

    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🛒 *DETALLE:*\n`;

    state.carrito.forEach(item => {
      mensaje += `▪️ *${item.cantidad}x* ${item.nombre}`;
      if (item.topping) {
        mensaje += `\n   └ _Topping: ${item.topping.nombre}_`;
      }
      mensaje += ` -> ${formatearMoneda(item.subtotal)}\n`;
    });

    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `*Subtotal:* ${formatearMoneda(subtotal)}\n`;
    if (state.tipoEntrega === 'delivery') {
      mensaje += `*Envío:* ${formatearMoneda(costoEnvio)}\n`;
    }
    mensaje += `💰 *TOTAL: ${formatearMoneda(total)}*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `✨ _¡Muchas gracias por su atención!_`;

    const urlWhatsApp = `https://wa.me/${CONFIG.telefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;

    state.carrito = [];
    renderizarCarrito();
    actualizarBadges();

    document.getElementById('drawer-carrito')?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');

    mostrarToast('¡Pedido confirmado! Abriendo WhatsApp...', 'success');

    setTimeout(() => {
      window.open(urlWhatsApp, '_blank');
    }, 450);
  };

  // ========================================================
  // 11. GEOLOCALIZACIÓN (PUERTO IGUAZÚ)
  // ========================================================
  const manejarBotonGeolocalizar = () => {
    const infoGeo = document.getElementById('info-geolocalizacion');
    const inputDireccion = document.getElementById('input-direccion');

    if (!navigator.geolocation) {
      if (infoGeo) {
        infoGeo.textContent = '⚠️ Tu navegador no soporta geolocalización.';
      }
      return;
    }

    if (infoGeo) {
      infoGeo.textContent = '📍 Obteniendo coordenadas en Puerto Iguazú...';
      infoGeo.className = 'text-[11px] text-pink-400 font-semibold animate-pulse';
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const urlApi = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
          const response = await fetch(urlApi, { headers: { 'Accept-Language': 'es' } });
          const data = await response.json();
          const addr = data.address || {};
          const calle = addr.road || addr.pedestrian || addr.street || addr.avenue || 'Calle Principal';
          const numero = addr.house_number ? ` ${addr.house_number}` : '';
          const barrio = addr.neighbourhood || addr.suburb ? ` (${addr.neighbourhood || addr.suburb})` : '';
          
          const direccionCompleta = `${calle}${numero}${barrio}, Puerto Iguazú, Misiones`;

          if (inputDireccion) {
            inputDireccion.value = direccionCompleta;
            inputDireccion.classList.add('border-brand-500');
          }

          if (infoGeo) {
            infoGeo.textContent = '✅ Ubicación detectada en Puerto Iguazú.';
            infoGeo.className = 'text-[11px] text-emerald-400 font-bold mt-1';
          }
          mostrarToast('¡Ubicación detectada con éxito!', 'success');
        } catch (e) {
          if (infoGeo) {
            infoGeo.textContent = '⚠️ Podés escribir tu dirección manualmente.';
            infoGeo.className = 'text-[11px] text-amber-400 font-medium mt-1';
          }
        }
      },
      () => {
        if (infoGeo) {
          infoGeo.textContent = '⚠️ Permiso GPS no concedido. Podés escribirla manualmente.';
          infoGeo.className = 'text-[11px] text-amber-400 font-medium mt-1';
        }
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  // ========================================================
  // 12. KDS (KITCHEN DISPLAY SYSTEM) & IMPRESIÓN
  // ========================================================
  window.cambiarEstadoComanda = (idComanda, nuevoEstado) => {
    const comanda = state.comandasCocina.find(c => c.id === idComanda);
    if (comanda) {
      comanda.estado = nuevoEstado;
      guardarComandasEnStorage();
      mostrarToast(`Comanda #${idComanda} -> ${nuevoEstado.toUpperCase()}`, 'info');
    }
  };

  window.imprimirTicketTermico = (idComanda) => {
    const comanda = state.comandasCocina.find(c => c.id === idComanda);
    if (!comanda) return;

    const contenedorTicket = document.getElementById('ticket-termico-impresion');
    if (!contenedorTicket) return;

    const fechaFormateada = new Date(comanda.fecha).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    contenedorTicket.innerHTML = `
      <div class="titulo">DULCES MOMENTOS</div>
      <div class="subtitulo">Pastelería Artesanal Boutique<br>Puerto Iguazú, Misiones</div>
      <div class="separador"></div>
      <div><strong>TICKET COCINA: #${comanda.id}</strong></div>
      <div>Fecha: ${fechaFormateada}</div>
      <div>Cliente: ${comanda.cliente}</div>
      <div>Tel: ${comanda.telefono}</div>
      <div>Modalidad: ${comanda.tipoEntrega.toUpperCase()}</div>
      <div>Dirección: ${comanda.direccion}</div>
      <div>Pago: ${comanda.metodoPago.toUpperCase()}</div>
      ${comanda.comprobante ? `<div>Comprobante: #${comanda.comprobante}</div>` : ''}
      ${comanda.notas ? `<div>Notas: ${comanda.notas}</div>` : ''}
      <div class="separador"></div>
      <div style="font-weight: bold;">DETALLE:</div>
      ${comanda.items.map(it => `
        <div>• ${it.cantidad}x ${it.nombre} ${it.topping ? `(${it.topping})` : ''} - ${formatearMoneda(it.subtotal)}</div>
      `).join('')}
      <div class="separador"></div>
      <div style="font-size: 13px; font-weight: bold;">TOTAL: ${formatearMoneda(comanda.total)}</div>
      <div class="separador"></div>
      <div style="text-align: center; font-size: 9px;">¡Gracias por tu compra!</div>
    `;

    window.print();
  };

  const renderizarComandasKDS = () => {
    const gridComandas = document.getElementById('grid-comandas-kds');
    const countPendiente = document.getElementById('kds-count-pendiente');
    const countPrep = document.getElementById('kds-count-preparacion');
    const countListo = document.getElementById('kds-count-listo');

    if (!gridComandas) return;

    const pendientes = state.comandasCocina.filter(c => c.estado === 'pendiente');
    const preparacion = state.comandasCocina.filter(c => c.estado === 'preparacion');
    const listos = state.comandasCocina.filter(c => c.estado === 'listo' || c.estado === 'entregado');

    if (countPendiente) countPendiente.textContent = pendientes.length;
    if (countPrep) countPrep.textContent = preparacion.length;
    if (countListo) countListo.textContent = listos.length;

    if (state.comandasCocina.length === 0) {
      gridComandas.innerHTML = `
        <div class="col-span-full py-16 text-center text-stone-400">
          <p class="text-4xl mb-2">👨‍🍳</p>
          <p class="text-lg font-bold text-white">No hay comandas activas en cocina.</p>
          <p class="text-xs text-stone-500 mt-1">Los nuevos pedidos de WhatsApp ingresarán aquí en tiempo real.</p>
        </div>
      `;
      return;
    }

    gridComandas.innerHTML = state.comandasCocina.map(comanda => {
      const fecha = new Date(comanda.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      
      const badgeColores = {
        pendiente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        preparacion: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        listo: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        entregado: 'bg-stone-500/20 text-stone-400 border-stone-500/30'
      };

      return `
        <div class="p-5 rounded-2xl bg-[#171216] border border-[#2d1e2a] shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-[#2d1e2a] mb-3">
              <div>
                <span class="font-mono text-xs font-bold text-pink-300">#${comanda.id}</span>
                <span class="text-xs text-stone-400 ml-2">🕒 ${fecha}</span>
              </div>
              <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColores[comanda.estado] || badgeColores.pendiente}">
                ${comanda.estado}
              </span>
            </div>

            <div class="space-y-1 text-xs mb-3">
              <p class="text-white font-bold text-sm">${comanda.cliente}</p>
              <p class="text-stone-400">📞 ${comanda.telefono}</p>
              <p class="text-stone-300">📍 ${comanda.tipoEntrega === 'delivery' ? `🛵 Delivery: ${comanda.direccion}` : '🛍️ Retiro en Boutique'}</p>
              <p class="text-stone-300 font-semibold">💳 Pago: ${comanda.metodoPago === 'mercadopago' ? 'MERCADO PAGO' : 'EFECTIVO'}</p>
              ${comanda.comprobante ? `<p class="text-pink-300 font-mono text-[11px]">🧾 Comprobante: #${comanda.comprobante}</p>` : ''}
              ${comanda.notas ? `<p class="text-amber-300 italic">📝 "${comanda.notas}"</p>` : ''}
            </div>

            <div class="border-t border-dashed border-[#2d1e2a] pt-2 mb-4 space-y-1">
              ${comanda.items.map(it => `
                <div class="flex justify-between text-xs text-stone-200">
                  <span><strong>${it.cantidad}x</strong> ${it.nombre} ${it.topping ? `<span class="text-pink-400">(${it.topping})</span>` : ''}</span>
                  <span class="font-mono">${formatearMoneda(it.subtotal)}</span>
                </div>
              `).join('')}
              <div class="flex justify-between text-xs font-bold text-white pt-2 border-t border-[#2d1e2a]">
                <span>TOTAL:</span>
                <span class="font-mono text-pink-300">${formatearMoneda(comanda.total)}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 pt-2 border-t border-[#2d1e2a]">
            ${comanda.estado === 'pendiente' ? `
              <button onclick="cambiarEstadoComanda('${comanda.id}', 'preparacion')" class="flex-1 py-1.5 px-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition">
                En Preparación
              </button>
            ` : ''}
            ${comanda.estado === 'preparacion' ? `
              <button onclick="cambiarEstadoComanda('${comanda.id}', 'listo')" class="flex-1 py-1.5 px-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition">
                Marcar Listo
              </button>
            ` : ''}
            ${comanda.estado === 'listo' ? `
              <button onclick="cambiarEstadoComanda('${comanda.id}', 'entregado')" class="flex-1 py-1.5 px-2 text-xs font-bold rounded-xl bg-stone-700 hover:bg-stone-600 text-white transition">
                Entregado
              </button>
            ` : ''}
            <button onclick="imprimirTicketTermico('${comanda.id}')" class="py-1.5 px-3 text-xs font-bold rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition">
              🖨️
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  // ========================================================
  // 13. FUNCIÓN GLOBAL PARA FILTRAR DESDE NAVBAR Y CATEGORÍAS
  // ========================================================
  window.filtrarCategoriaDesdeNav = (categoria) => {
    state.categoriaSeleccionada = categoria;
    
    // Actualizar botones de filtro
    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    botonesFiltro.forEach(btn => {
      const btnCat = btn.getAttribute('data-categoria');
      if (btnCat.toLowerCase() === categoria.toLowerCase()) {
        btn.className = 'btn-filtro active px-5 py-2 text-xs sm:text-sm font-semibold rounded-full bg-brand-600 text-white shadow-md shadow-brand-600/30 transition';
      } else {
        btn.className = 'btn-filtro px-5 py-2 text-xs sm:text-sm font-semibold rounded-full bg-[#181318] text-stone-300 hover:text-white hover:bg-[#231a22] border border-[#2b1f28] transition';
      }
    });

    // Actualizar tarjetas de categoría
    const tarjetasCat = document.querySelectorAll('.card-categoria-nav');
    tarjetasCat.forEach(card => {
      const cardCat = card.getAttribute('data-categoria');
      if (cardCat && cardCat.toLowerCase() === categoria.toLowerCase()) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    renderizarCatalogo();

    // Scroll suave a catálogo
    const catalogoEl = document.getElementById('catalogo');
    if (catalogoEl) {
      catalogoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ========================================================
  // 14. EVENT LISTENERS
  // ========================================================
  const configurarEventListeners = () => {
    const btnAbrirCarrito = document.getElementById('btn-abrir-carrito');
    const btnIconoCarrito = document.getElementById('btn-icono-carrito');
    const btnCerrarCarrito = document.getElementById('btn-cerrar-carrito');
    const overlayCarrito = document.getElementById('overlay-carrito');
    const drawerCarrito = document.getElementById('drawer-carrito');

    const abrirCarrito = () => {
      if (!state.auth.autenticado) {
        bloquearVistaYMostrarAuth();
        mostrarToast('Por favor, iniciá sesión para acceder a tu carrito.', 'warning');
        return;
      }
      renderizarCarrito();
      drawerCarrito?.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    };

    const cerrarCarrito = () => {
      drawerCarrito?.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    };

    btnAbrirCarrito?.addEventListener('click', abrirCarrito);
    btnIconoCarrito?.addEventListener('click', abrirCarrito);
    btnCerrarCarrito?.addEventListener('click', cerrarCarrito);
    overlayCarrito?.addEventListener('click', cerrarCarrito);

    // Botones de filtro del catálogo
    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    botonesFiltro.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-categoria') || 'todos';
        window.filtrarCategoriaDesdeNav(cat);
      });
    });

    // Tarjetas de navegación por categorías
    const tarjetasCategoria = document.querySelectorAll('.card-categoria-nav');
    tarjetasCategoria.forEach(card => {
      card.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-categoria');
        if (cat) window.filtrarCategoriaDesdeNav(cat);
      });
    });

    // Buscador
    const btnBuscar = document.getElementById('btn-buscar');
    btnBuscar?.addEventListener('click', () => {
      const termino = prompt('🔍 ¿Qué delicia estás buscando? (ej. Chocolate, Frutos, Macarons, Cheesecake):');
      if (termino && termino.trim()) {
        const query = termino.trim().toLowerCase();
        const contenedor = document.getElementById('catalogo-productos');
        const resultados = PRODUCTOS.filter(p => 
          p.nombre.toLowerCase().includes(query) || 
          p.descripcion.toLowerCase().includes(query) || 
          p.categoria.toLowerCase().includes(query)
        );

        if (contenedor) {
          if (resultados.length === 0) {
            contenedor.innerHTML = `
              <div class="col-span-full py-16 text-center text-stone-400 bg-[#161115] rounded-3xl border border-[#2b1e29] p-8">
                <p class="text-4xl mb-3">🔍</p>
                <p class="font-serif text-xl font-bold text-white">No encontramos resultados para "${termino}".</p>
                <button onclick="window.filtrarCategoriaDesdeNav('todos')" class="mt-4 px-5 py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition">
                  Ver Todos los Productos
                </button>
              </div>
            `;
          } else {
            mostrarToast(`Encontramos ${resultados.length} resultado(s) para "${termino}".`, 'info');
            state.categoriaSeleccionada = 'todos';
            renderizarCatalogo();
          }
        }
      }
    });

    // Modalidad de Entrega
    const radiosEntrega = document.querySelectorAll('input[name="tipo-entrega"]');
    const campoDireccion = document.getElementById('campo-direccion');
    radiosEntrega.forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.tipoEntrega = e.target.value;
        if (state.tipoEntrega === 'delivery') {
          campoDireccion?.classList.remove('hidden');
        } else {
          campoDireccion?.classList.add('hidden');
        }
        renderizarCarrito();
      });
    });

    // Forma de Pago
    const radiosPago = document.querySelectorAll('input[name="metodo-pago"]');
    radiosPago.forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.metodoPago = e.target.value;
        actualizarBotonCheckoutUI();
      });
    });

    // Checkout WhatsApp
    const btnCheckoutPrincipal = document.getElementById('btn-checkout-principal');
    btnCheckoutPrincipal?.addEventListener('click', enviarPedidoWhatsApp);

    // Geolocalización
    const btnGeolocalizar = document.getElementById('btn-geolocalizar');
    btnGeolocalizar?.addEventListener('click', manejarBotonGeolocalizar);

    // KDS Auth Modal
    const btnAbrirAuthKds = document.getElementById('btn-abrir-auth-kds');
    const modalAuthKds = document.getElementById('modal-auth-kds');
    const formAuthKds = document.getElementById('form-auth-kds');
    const inputKdsPin = document.getElementById('input-kds-pin');
    const errorKdsPin = document.getElementById('error-kds-pin');
    const btnCancelarKds = document.getElementById('btn-cancelar-kds');
    const seccionKds = document.getElementById('seccion-kds');
    const btnCerrarKds = document.getElementById('btn-cerrar-kds');
    const btnLimpiarComandas = document.getElementById('btn-limpiar-comandas');

    btnAbrirAuthKds?.addEventListener('click', () => {
      modalAuthKds?.classList.remove('hidden');
      if (inputKdsPin) {
        inputKdsPin.value = '';
        setTimeout(() => inputKdsPin.focus(), 150);
      }
      errorKdsPin?.classList.add('hidden');
    });

    btnCancelarKds?.addEventListener('click', () => {
      modalAuthKds?.classList.add('hidden');
    });

    formAuthKds?.addEventListener('submit', (e) => {
      e.preventDefault();
      const clave = (inputKdsPin?.value || '').trim();
      if (clave === CONFIG.claveCocinaKDS) {
        modalAuthKds?.classList.add('hidden');
        seccionKds?.classList.remove('hidden');
        renderizarComandasKDS();
        mostrarToast('👨‍🍳 Acceso concedido al panel de cocina KDS.', 'success');
      } else {
        errorKdsPin?.classList.remove('hidden');
        inputKdsPin?.focus();
        inputKdsPin?.select();
      }
    });

    btnCerrarKds?.addEventListener('click', () => {
      seccionKds?.classList.add('hidden');
    });

    btnLimpiarComandas?.addEventListener('click', () => {
      state.comandasCocina = state.comandasCocina.filter(c => c.estado !== 'entregado');
      guardarComandasEnStorage();
      mostrarToast('Comandas entregadas archivadas.', 'info');
    });

    // ========================================================
    // LISTENERS DEL SISTEMA DE AUTENTICACIÓN
    // ========================================================
    const tabBtnLogin = document.getElementById('tab-btn-login');
    const tabBtnRegister = document.getElementById('tab-btn-register');
    const linkIrRegistro = document.getElementById('link-ir-registro');
    const linkIrLogin = document.getElementById('link-ir-login');

    tabBtnLogin?.addEventListener('click', () => activarPestanaAuth('login'));
    tabBtnRegister?.addEventListener('click', () => activarPestanaAuth('register'));
    linkIrRegistro?.addEventListener('click', () => activarPestanaAuth('register'));
    linkIrLogin?.addEventListener('click', () => activarPestanaAuth('login'));

    // Botones para mostrar / ocultar contraseñas
    const btnToggleLoginPass = document.getElementById('btn-toggle-login-pass');
    const inputLoginPassword = document.getElementById('login-password');
    btnToggleLoginPass?.addEventListener('click', () => {
      if (!inputLoginPassword) return;
      const esPassword = inputLoginPassword.type === 'password';
      inputLoginPassword.type = esPassword ? 'text' : 'password';
      btnToggleLoginPass.innerHTML = esPassword 
        ? `<svg class="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`
        : `<svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
    });

    const btnToggleRegPass = document.getElementById('btn-toggle-reg-pass');
    const inputRegPassword = document.getElementById('reg-password');
    btnToggleRegPass?.addEventListener('click', () => {
      if (!inputRegPassword) return;
      const esPassword = inputRegPassword.type === 'password';
      inputRegPassword.type = esPassword ? 'text' : 'password';
      btnToggleRegPass.innerHTML = esPassword 
        ? `<svg class="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`
        : `<svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
    });

    // Validación estricta en tiempo real de correo electrónico en registro
    const inputRegCorreo = document.getElementById('reg-correo');
    const regCorreoStatus = document.getElementById('reg-correo-status');
    const regCorreoIcon = document.getElementById('reg-correo-icon');
    const regCorreoHint = document.getElementById('reg-correo-hint');

    const actualizarValidacionCorreo = () => {
      if (!inputRegCorreo) return;
      const valor = inputRegCorreo.value.trim();

      if (!valor) {
        inputRegCorreo.classList.remove('auth-input-valid', 'auth-input-invalid');
        if (regCorreoStatus) {
          regCorreoStatus.textContent = 'Formato requerido (@ y dominio)';
          regCorreoStatus.className = 'text-[10px] font-semibold text-stone-500 transition-colors';
        }
        if (regCorreoIcon) regCorreoIcon.innerHTML = '';
        if (regCorreoHint) regCorreoHint.classList.add('hidden');
        return;
      }

      const esValido = validarFormatoCorreo(valor);

      if (esValido) {
        inputRegCorreo.classList.remove('auth-input-invalid');
        inputRegCorreo.classList.add('auth-input-valid');
        if (regCorreoStatus) {
          regCorreoStatus.textContent = '✓ Formato de correo válido';
          regCorreoStatus.className = 'text-[10px] font-bold text-emerald-400 transition-colors';
        }
        if (regCorreoIcon) {
          regCorreoIcon.innerHTML = `
            <svg class="w-4 h-4 text-emerald-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          `;
        }
        if (regCorreoHint) regCorreoHint.classList.add('hidden');
      } else {
        inputRegCorreo.classList.remove('auth-input-valid');
        inputRegCorreo.classList.add('auth-input-invalid');
        if (regCorreoStatus) {
          regCorreoStatus.textContent = '⚠ Requiere formato válido';
          regCorreoStatus.className = 'text-[10px] font-bold text-red-400 transition-colors';
        }
        if (regCorreoIcon) {
          regCorreoIcon.innerHTML = `
            <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          `;
        }
        if (regCorreoHint) regCorreoHint.classList.remove('hidden');
      }
    };

    inputRegCorreo?.addEventListener('input', actualizarValidacionCorreo);
    inputRegCorreo?.addEventListener('blur', actualizarValidacionCorreo);

    // Formulario de Inicio de Sesión
    const formLogin = document.getElementById('form-login');
    const inputLoginCorreo = document.getElementById('login-correo');
    const alertaLogin = document.getElementById('alerta-login');
    const alertaLoginTexto = document.getElementById('alerta-login-texto');
    const btnSubmitLogin = document.getElementById('btn-submit-login');
    const spinnerLogin = document.getElementById('spinner-login');
    const textoSubmitLogin = document.getElementById('texto-submit-login');

    formLogin?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const correo = (inputLoginCorreo?.value || '').trim();
      const password = (inputLoginPassword?.value || '').trim();

      if (!correo || !password) {
        if (alertaLogin && alertaLoginTexto) {
          alertaLoginTexto.textContent = 'Por favor, completá tu correo y contraseña.';
          alertaLogin.classList.remove('hidden');
        }
        return;
      }

      if (!validarFormatoCorreo(correo)) {
        if (alertaLogin && alertaLoginTexto) {
          alertaLoginTexto.textContent = 'El formato de correo no es válido (debe contener @ y dominio).';
          alertaLogin.classList.remove('hidden');
        }
        return;
      }

      // Estado de carga UI
      if (btnSubmitLogin) btnSubmitLogin.disabled = true;
      if (spinnerLogin) spinnerLogin.classList.remove('hidden');
      if (textoSubmitLogin) textoSubmitLogin.textContent = 'Verificando credenciales...';
      if (alertaLogin) alertaLogin.classList.add('hidden');

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (response.ok && data.success && data.token) {
          if (formLogin) formLogin.reset();
          aplicarSesionActiva(data.user, data.token, true);
        } else {
          if (alertaLogin && alertaLoginTexto) {
            alertaLoginTexto.textContent = data.error || 'Credenciales inválidas. Comprobá tu correo y contraseña.';
            alertaLogin.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('Error en login:', err);
        if (alertaLogin && alertaLoginTexto) {
          alertaLoginTexto.textContent = 'Error de conexión con el servidor. Verificá que el backend esté en ejecución.';
          alertaLogin.classList.remove('hidden');
        }
      } finally {
        if (btnSubmitLogin) btnSubmitLogin.disabled = false;
        if (spinnerLogin) spinnerLogin.classList.add('hidden');
        if (textoSubmitLogin) textoSubmitLogin.textContent = 'Ingresar a la Tienda';
      }
    });

    // Formulario de Registro
    const formRegister = document.getElementById('form-register');
    const inputRegNombre = document.getElementById('reg-nombre');
    const inputRegApellido = document.getElementById('reg-apellido');
    const alertaRegister = document.getElementById('alerta-register');
    const alertaRegisterTexto = document.getElementById('alerta-register-texto');
    const btnSubmitRegister = document.getElementById('btn-submit-register');
    const spinnerRegister = document.getElementById('spinner-register');
    const textoSubmitRegister = document.getElementById('texto-submit-register');

    formRegister?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombre = (inputRegNombre?.value || '').trim();
      const apellido = (inputRegApellido?.value || '').trim();
      const correo = (inputRegCorreo?.value || '').trim();
      const password = (inputRegPassword?.value || '').trim();

      // Validación de campos
      if (!nombre || !apellido || !correo || !password) {
        if (alertaRegister && alertaRegisterTexto) {
          alertaRegisterTexto.textContent = 'Todos los campos son obligatorios (Nombre, Apellido, Correo y Contraseña).';
          alertaRegister.classList.remove('hidden');
        }
        return;
      }

      // Validación estricta de correo
      if (!validarFormatoCorreo(correo)) {
        if (alertaRegister && alertaRegisterTexto) {
          alertaRegisterTexto.textContent = 'El correo electrónico debe tener un formato válido con "@" y dominio (ej: usuario@ejemplo.com).';
          alertaRegister.classList.remove('hidden');
        }
        inputRegCorreo?.focus();
        return;
      }

      if (password.length < 6) {
        if (alertaRegister && alertaRegisterTexto) {
          alertaRegisterTexto.textContent = 'La contraseña debe tener al menos 6 caracteres.';
          alertaRegister.classList.remove('hidden');
        }
        inputRegPassword?.focus();
        return;
      }

      // Estado de carga UI
      if (btnSubmitRegister) btnSubmitRegister.disabled = true;
      if (spinnerRegister) spinnerRegister.classList.remove('hidden');
      if (textoSubmitRegister) textoSubmitRegister.textContent = 'Creando tu cuenta...';
      if (alertaRegister) alertaRegister.classList.add('hidden');

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, apellido, correo, password })
        });

        const data = await response.json();

        if (response.ok && data.success && data.token) {
          if (formRegister) formRegister.reset();
          actualizarValidacionCorreo();
          aplicarSesionActiva(data.user, data.token, true);
        } else {
          if (alertaRegister && alertaRegisterTexto) {
            alertaRegisterTexto.textContent = data.error || 'Error al procesar el registro.';
            alertaRegister.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('Error en registro:', err);
        if (alertaRegister && alertaRegisterTexto) {
          alertaRegisterTexto.textContent = 'Error de conexión con el servidor. Verificá que el backend esté en ejecución.';
          alertaRegister.classList.remove('hidden');
        }
      } finally {
        if (btnSubmitRegister) btnSubmitRegister.disabled = false;
        if (spinnerRegister) spinnerRegister.classList.add('hidden');
        if (textoSubmitRegister) textoSubmitRegister.textContent = 'Crear Mi Cuenta & Ingresar';
      }
    });

    // Botón de Cerrar Sesión en Navbar
    const btnLogout = document.getElementById('btn-logout');
    btnLogout?.addEventListener('click', () => {
      cerrarSesion();
    });
  };

  // ========================================================
  // 14.5. SISTEMA DE AUTENTICACIÓN (SQL SERVER + BARRERA OBLIGATORIA)
  // ========================================================
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validarFormatoCorreo = (email) => {
    return EMAIL_REGEX.test(String(email || '').trim());
  };

  const bloquearVistaYMostrarAuth = () => {
    state.auth = { token: null, usuario: null, autenticado: false };
    
    // Ocultar tienda principal y controles de usuario
    const authPortal = document.getElementById('seccion-auth-portal');
    const mainContent = document.getElementById('app-main-content');
    const navUserContainer = document.getElementById('nav-user-container');
    const drawerCarrito = document.getElementById('drawer-carrito');

    if (authPortal) authPortal.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (navUserContainer) {
      navUserContainer.classList.add('hidden');
      navUserContainer.classList.remove('flex');
    }
    if (drawerCarrito) drawerCarrito.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const aplicarSesionActiva = (usuario, token, conNotificacion = true) => {
    state.auth = {
      token,
      usuario,
      autenticado: true
    };

    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuario));

    const authPortal = document.getElementById('seccion-auth-portal');
    const mainContent = document.getElementById('app-main-content');
    const navUserContainer = document.getElementById('nav-user-container');
    const navUserName = document.getElementById('nav-user-name');
    const navUserAvatar = document.getElementById('nav-user-avatar');
    const inputNombreCliente = document.getElementById('input-nombre');

    if (authPortal) authPortal.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');

    if (navUserContainer) {
      navUserContainer.classList.remove('hidden');
      navUserContainer.classList.add('flex');
    }

    if (navUserName) {
      navUserName.textContent = `${usuario.nombre || 'Usuario'}`;
    }

    if (navUserAvatar) {
      const inicial = (usuario.nombre || 'U').charAt(0).toUpperCase();
      navUserAvatar.textContent = inicial;
    }

    if (inputNombreCliente && !inputNombreCliente.value.trim()) {
      inputNombreCliente.value = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
    }

    if (conNotificacion) {
      mostrarToast(`¡Hola, ${usuario.nombre}! Bienvenido/a a Dulces Momentos 🍰`, 'success');
    }
  };

  const cerrarSesion = async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USUARIO);
      
      fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' }).catch(() => {});

      bloquearVistaYMostrarAuth();
      mostrarToast('Has cerrado sesión correctamente. ¡Hasta pronto! 👋', 'info');

      const formLogin = document.getElementById('form-login');
      const formRegister = document.getElementById('form-register');
      if (formLogin) formLogin.reset();
      if (formRegister) formRegister.reset();

      activarPestanaAuth('login');
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  };

  const activarPestanaAuth = (pestana) => {
    const tabBtnLogin = document.getElementById('tab-btn-login');
    const tabBtnRegister = document.getElementById('tab-btn-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const alertaLogin = document.getElementById('alerta-login');
    const alertaRegister = document.getElementById('alerta-register');

    if (alertaLogin) alertaLogin.classList.add('hidden');
    if (alertaRegister) alertaRegister.classList.add('hidden');

    if (pestana === 'login') {
      tabBtnLogin?.classList.add('bg-brand-600', 'text-white', 'shadow-md', 'shadow-brand-600/30', 'font-bold');
      tabBtnLogin?.classList.remove('text-stone-400');
      tabBtnRegister?.classList.remove('bg-brand-600', 'text-white', 'shadow-md', 'shadow-brand-600/30', 'font-bold');
      tabBtnRegister?.classList.add('text-stone-400');

      formLogin?.classList.remove('hidden');
      formRegister?.classList.add('hidden');
    } else {
      tabBtnRegister?.classList.add('bg-brand-600', 'text-white', 'shadow-md', 'shadow-brand-600/30', 'font-bold');
      tabBtnRegister?.classList.remove('text-stone-400');
      tabBtnLogin?.classList.remove('bg-brand-600', 'text-white', 'shadow-md', 'shadow-brand-600/30', 'font-bold');
      tabBtnLogin?.classList.add('text-stone-400');

      formRegister?.classList.remove('hidden');
      formLogin?.classList.add('hidden');
    }
  };

  const verificarSesionExistente = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      bloquearVistaYMostrarAuth();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          aplicarSesionActiva(data.user, token, false);
          return;
        }
      }

      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USUARIO);
      bloquearVistaYMostrarAuth();
    } catch (error) {
      console.warn('Error al verificar sesión en backend:', error);
      const userGuardado = localStorage.getItem(STORAGE_KEYS.USUARIO);
      if (userGuardado) {
        try {
          const userObj = JSON.parse(userGuardado);
          aplicarSesionActiva(userObj, token, false);
          return;
        } catch (e) {}
      }
      bloquearVistaYMostrarAuth();
    }
  };

  // ========================================================
  // 15. EJECUCIÓN INICIAL
  // ========================================================
  const elYear = document.getElementById('footer-year');
  if (elYear) elYear.textContent = new Date().getFullYear();

  cargarEstadoInicial();
  renderizarCatalogo();
  actualizarBadges();
  configurarEventListeners();
  verificarSesionExistente();
});

