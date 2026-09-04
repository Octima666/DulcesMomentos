/**
 * ============================================================================
 * PASTELERÍA "DULCES MOMENTOS" - LÓGICA PRINCIPAL (app.js)
 * Frontend JavaScript + Checkout WhatsApp + QR Transferencia + KDS
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================
  // 1. CONFIGURACIÓN Y CONSTANTES DEL SISTEMA
  // ========================================================
  const CONFIG = {
    // Número Oficial WhatsApp para Checkout: +54 9 3757 57-1985
    telefonoWhatsApp: '5493757571985',
    // Clave de Seguridad de Cocina (KDS)
    claveCocinaKDS: 'niledlajo',
    costoEnvioFijo: 1500, // Costo de envío en Puerto Iguazú ($ ARS)

    // Coordenadas de Referencia: Centro de Puerto Iguazú, Misiones, Argentina
    centroIguazu: {
      lat: -25.5988,
      lon: -54.5755,
      radioMaximoKm: 12.0
    }
  };

  const STORAGE_KEYS = {
    COMANDAS: 'dulces_momentos_comandas_kds_v2',
    TEMA: 'dulces_momentos_theme'
  };

  // ========================================================
  // 2. FORMATEO CENTRALIZADO DE MONEDA (es-AR / ARS)
  // ========================================================
  const formateadorARS = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });

  const formatearMoneda = (valor) => formateadorARS.format(valor || 0);

  // ========================================================
  // 3. CATÁLOGO DE PRODUCTOS (V2.0 - ESTRUCTURA DINÁMICA)
  // ========================================================
  const PRODUCTOS = [
    {
      id: 'prod-001',
      nombre: 'Tarta Frutos del Bosque',
      categoria: 'Tortas',
      precio: 14500,
      descripcion: 'Masa sableé crocante rellena de suave crema pastelera artesanal y coronada con frutos rojos frescos de estación.',
      imagen: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
      badge: 'Más Vendido',
      stock: 8,
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
      descripcion: 'Textura ultra cremosa horneada a baño María con base de galletas Graham y coulis de frutos silvestres.',
      imagen: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
      badge: 'Favorito',
      stock: 5,
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
      descripcion: 'Intenso bizcocho de cacao 70% con ganache de chocolate semiamargo y un toque de café espresso suave.',
      imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
      badge: 'Gourmet',
      stock: 6,
      toppings: [
        { id: 'top-avellanas', nombre: 'Praliné de Avellanas Tostadas', precio: 1400 },
        { id: 'top-ddl', nombre: 'Corazón de Dulce de Leche Repostero', precio: 1000 }
      ]
    },
    {
      id: 'prod-004',
      nombre: 'Lemon Pie Merengado Suizo',
      categoria: 'Postres',
      precio: 13900,
      descripcion: 'Curd de limón fresco con el balance perfecto de acidez, coronado con abundante merengue suizo dorado al soplete.',
      imagen: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80',
      badge: 'Recomendado',
      stock: 9,
      toppings: [
        { id: 'top-ralladura', nombre: 'Zeste de Limas y Flores Comestibles', precio: 600 }
      ]
    },
    {
      id: 'prod-005',
      nombre: 'Macarons Parisinos (Caja x6)',
      categoria: 'Especialidades',
      precio: 9800,
      descripcion: 'Delicadas tapas de almendra con ganache surtido: Pistacho, Frambuesa, Chocolate Intenso y Maracuyá.',
      imagen: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80',
      badge: 'Boutique',
      stock: 12,
      toppings: [
        { id: 'top-caja-regalo', nombre: 'Packaging de Regalo + Moño de Seda', precio: 800 }
      ]
    },
    {
      id: 'prod-006',
      nombre: 'Red Velvet Royale',
      categoria: 'Tortas',
      precio: 17500,
      descripcion: 'Bizcochuelo terciopelo rojo aterciopelado con delicadas capas de frosting de queso crema y vainilla bourbon.',
      imagen: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80',
      badge: 'Especial',
      stock: 4,
      toppings: [
        { id: 'top-perlas', nombre: 'Perlas Crocantes de Azúcar', precio: 700 },
        { id: 'top-frambuesas', nombre: 'Frambuesas liofilizadas', precio: 1300 }
      ]
    }
  ];

  // ========================================================
  // 4. ESTADO GLOBAL (EL CARRITO COMIENZA SIEMPRE VACÍO: [])
  // ========================================================
  let state = {
    carrito: [], // Requerimiento: Siempre vacío al iniciar o recargar
    comandasCocina: [],
    categoriaSeleccionada: 'todos',
    tipoEntrega: 'takeaway', // 'takeaway' | 'delivery'
    metodoPago: 'efectivo',  // 'efectivo' | 'mercadopago'
    ubicacionValidadaIguazu: false
  };

  // ========================================================
  // 5. INICIALIZACIÓN (SIN PERSISTENCIA EN CARRITO)
  // ========================================================
  const cargarEstadoInicial = () => {
    try {
      // Forzar que el carrito inicie siempre vacío
      state.carrito = [];

      // Cargar comandas de cocina KDS si existen
      const comandasGuardadas = localStorage.getItem(STORAGE_KEYS.COMANDAS);
      if (comandasGuardadas) state.comandasCocina = JSON.parse(comandasGuardadas);

      // Cargar tema visual
      const temaGuardado = localStorage.getItem(STORAGE_KEYS.TEMA);
      if (temaGuardado === 'dark' || (!temaGuardado && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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

  // ========================================================
  // 6. SISTEMA DE NOTIFICACIONES (TOASTS)
  // ========================================================
  const mostrarToast = (mensaje, tipo = 'info') => {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;

    const toast = document.createElement('div');
    const iconos = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colores = {
      success: 'bg-emerald-600 text-white shadow-emerald-600/30',
      error: 'bg-red-600 text-white shadow-red-600/30',
      warning: 'bg-amber-600 text-white shadow-amber-600/30',
      info: 'bg-brand-600 text-white shadow-brand-600/30'
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl font-medium text-xs sm:text-sm transform transition-all duration-300 pointer-events-auto opacity-0 translate-y-3 ${colores[tipo] || colores.info}`;
    toast.innerHTML = `
      <span class="text-base sm:text-lg">${iconos[tipo] || 'ℹ️'}</span>
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
    }, 4000);
  };

  // ========================================================
  // 7. RENDERIZADO DEL CATÁLOGO DE PRODUCTOS
  // ========================================================
  const renderizarCatalogo = () => {
    const contenedor = document.getElementById('catalogo-productos');
    if (!contenedor) return;

    const productosFiltrados = state.categoriaSeleccionada === 'todos'
      ? PRODUCTOS
      : PRODUCTOS.filter(p => p.categoria.toLowerCase() === state.categoriaSeleccionada.toLowerCase());

    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = `
        <div class="col-span-full py-12 text-center text-stone-500 dark:text-stone-400">
          <p class="text-4xl mb-2">🍰</p>
          <p class="font-serif text-lg font-bold text-stone-800 dark:text-stone-200">No encontramos productos en esta categoría.</p>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = productosFiltrados.map(prod => `
      <article class="card-producto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
        <div class="relative overflow-hidden aspect-[4/3] bg-stone-100 dark:bg-stone-800">
          <img 
            src="${prod.imagen}" 
            alt="${prod.nombre}" 
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          >
          <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/90 dark:bg-stone-900/90 text-brand-700 dark:text-brand-300 backdrop-blur-xs shadow-xs">
            ${prod.badge || prod.categoria}
          </span>
        </div>

        <div class="p-5 flex flex-col flex-1">
          <div class="flex-1">
            <div class="flex items-baseline justify-between gap-2 mb-1">
              <h3 class="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-white leading-tight">
                ${prod.nombre}
              </h3>
            </div>
            <p class="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 mb-4 leading-relaxed">
              ${prod.descripcion}
            </p>
          </div>

          <!-- Selector de Toppings Opcionales -->
          ${prod.toppings && prod.toppings.length > 0 ? `
            <div class="mb-4 pt-3 border-t border-dashed border-stone-200 dark:border-stone-800">
              <label for="topping-${prod.id}" class="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                Personalizá tu Topping
              </label>
              <select id="topping-${prod.id}" class="select-topping w-full text-xs rounded-xl px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brand-500 focus:outline-none transition">
                <option value="">✨ Sin topping adicional</option>
                ${prod.toppings.map(t => `
                  <option value="${t.id}" data-precio="${t.precio}">+ ${t.nombre} (${formatearMoneda(t.precio)})</option>
                `).join('')}
              </select>
            </div>
          ` : ''}

          <div class="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
            <div>
              <span class="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block font-semibold">Precio</span>
              <span class="font-serif text-xl sm:text-2xl font-bold text-brand-600 dark:text-brand-400">
                ${formatearMoneda(prod.precio)}
              </span>
            </div>

            <button 
              data-id="${prod.id}" 
              class="btn-agregar-carrito inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-brand-600 dark:bg-white dark:text-stone-900 dark:hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all transform active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    // Listeners para botones agregar al carrito
    contenedor.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = e.currentTarget.getAttribute('data-id');
        const selectTopping = document.getElementById(`topping-${prodId}`);
        let toppingSeleccionado = null;

        if (selectTopping && selectTopping.value) {
          const prod = PRODUCTOS.find(p => p.id === prodId);
          const topObj = prod?.toppings?.find(t => t.id === selectTopping.value);
          if (topObj) {
            toppingSeleccionado = topObj;
          }
        }

        agregarProductoAlCarrito(prodId, toppingSeleccionado);
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
    const badgeFlotante = document.getElementById('badge-carrito-flotante');

    if (badgeHeader) badgeHeader.textContent = totalItems;
    if (badgeFlotante) badgeFlotante.textContent = totalItems;
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
        <div class="py-8 text-center text-stone-400 dark:text-stone-500">
          <span class="text-4xl block mb-2">🛒</span>
          <p class="font-serif text-base font-bold text-stone-700 dark:text-stone-300">Tu pedido está vacío</p>
          <p class="text-xs mt-1">Explorá nuestra colección y agregá tus postres preferidos.</p>
        </div>
      `;

      if (subtotalEl) subtotalEl.textContent = formatearMoneda(0);
      if (envioEl) envioEl.textContent = formatearMoneda(0);
      if (totalEl) totalEl.textContent = formatearMoneda(0);

      actualizarBotonCheckoutUI();
      return;
    }

    contenedorLista.innerHTML = state.carrito.map(item => `
      <div class="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 shadow-xs">
        <img 
          src="${item.imagen}" 
          alt="${item.nombre}" 
          class="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-700"
        >
        <div class="flex-1 min-w-0">
          <h4 class="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
            ${item.nombre}
          </h4>
          ${item.topping ? `
            <p class="text-[11px] text-brand-600 dark:text-brand-400 font-medium truncate">
              + ${item.topping.nombre}
            </p>
          ` : ''}
          <div class="flex items-center gap-2 mt-1">
            <span class="font-serif text-xs font-extrabold text-brand-600 dark:text-brand-400">
              ${formatearMoneda(item.subtotal)}
            </span>
            <span class="text-[10px] text-stone-400">(${formatearMoneda(item.precioUnitario)} c/u)</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-900/60 p-1 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
          <button 
            data-key="${item.itemKey}" 
            class="btn-restar w-6 h-6 flex items-center justify-center rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-brand-100 dark:hover:bg-stone-700 text-xs font-bold transition"
            aria-label="Disminuir cantidad"
          >-</button>
          <span class="font-mono font-bold text-xs px-1.5 text-stone-800 dark:text-stone-100">${item.cantidad}</span>
          <button 
            data-key="${item.itemKey}" 
            class="btn-sumar w-6 h-6 flex items-center justify-center rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-brand-100 dark:hover:bg-stone-700 text-xs font-bold transition" 
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
    const iconoCheckout = document.getElementById('btn-checkout-icono');
    const textoCheckout = document.getElementById('btn-checkout-texto');
    const seccionQr = document.getElementById('seccion-qr');

    // 1. Mostrar/Ocultar Sección QR dinámicamente según la forma de pago
    if (seccionQr) {
      if (state.metodoPago === 'mercadopago') {
        seccionQr.classList.remove('hidden');
      } else {
        seccionQr.classList.add('hidden');
      }
    }

    if (!btnCheckout || !iconoCheckout || !textoCheckout) return;

    if (state.carrito.length === 0) {
      btnCheckout.disabled = true;
      btnCheckout.classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }

    btnCheckout.disabled = false;
    btnCheckout.classList.remove('opacity-50', 'cursor-not-allowed');

    if (state.metodoPago === 'mercadopago') {
      btnCheckout.className = 'w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#009EE3] hover:bg-[#0081BA] active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-[#009EE3]/30 transition-all';
      iconoCheckout.textContent = '💬';
      textoCheckout.textContent = 'Confirmar Pedido por WhatsApp';
    } else {
      btnCheckout.className = 'w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all';
      iconoCheckout.textContent = '💬';
      textoCheckout.textContent = 'Confirmar y Enviar Pedido por WhatsApp';
    }
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

    // 1. Validar Nombre Completo (Obligatorio)
    if (!nombre) {
      inputNombre?.focus();
      return mostrarToast('Por favor ingresá tu nombre completo.', 'error');
    }
    
    // 2. Validar Teléfono WhatsApp (Obligatorio, mínimo 8 dígitos)
    const telLimpio = telefono.replace(/\D/g, '');
    if (telLimpio.length < 8) {
      errorTelefono?.classList.remove('hidden');
      inputTelefono?.focus();
      return mostrarToast('El teléfono debe tener un formato válido (mínimo 8 dígitos)', 'error');
    } else {
      errorTelefono?.classList.add('hidden');
    }

    // 3. Validar Dirección si es modalidad Delivery
    if (state.tipoEntrega === 'delivery' && !direccion) {
      inputDireccion?.focus();
      return mostrarToast('Por favor ingresá o validá tu dirección en Puerto Iguazú.', 'error');
    }

    // 4. Validar Comprobante si la opción es Mercado Pago / Transferencia
    if (state.metodoPago === 'mercadopago') {
      if (!comprobante) {
        inputComprobante?.focus();
        return mostrarToast('Por favor ingresá el número o código de comprobante.', 'error');
      }
    }

    // Totales y comanda
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

    // Guardar comanda en KDS
    state.comandasCocina.unshift(nuevaComanda);
    guardarComandasEnStorage();

    // Generar Mensaje Estructurado con Emojis para WhatsApp
    let mensaje = `🎂 *¡HOLA DULCES MOMENTOS!* 🎂\n`;
    mensaje += `Quiero confirmar el siguiente pedido para mi celebración:\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🧾 *ID Pedido:* #${nuevaComanda.id}\n`;
    mensaje += `👤 *Cliente:* ${nombre}\n`;
    mensaje += `📞 *Teléfono:* ${telefono}\n`;
    mensaje += `📍 *Método de Entrega:* ${state.tipoEntrega === 'takeaway' ? '🛍️ Retiro en Boutique (Local)' : '🛵 Delivery a Domicilio'}\n`;
    
    if (state.tipoEntrega === 'delivery') {
      mensaje += `🏡 *Dirección:* ${direccion} (Puerto Iguazú, Misiones)\n`;
    }
    
    if (notas) {
      mensaje += `📝 *Dedicatoria / Notas:* _${notas}_\n`;
    }

    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (state.metodoPago === 'mercadopago') {
      mensaje += `💳 *Forma de Pago:* 💳 Mercado Pago / Transferencia\n`;
      mensaje += `🧾 *N° de Comprobante:* ${comprobante}\n`;
    } else {
      mensaje += `💳 *Forma de Pago:* 💵 Efectivo (al retirar / recibir)\n`;
    }

    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🛒 *DETALLE DEL PEDIDO:*\n`;

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
      mensaje += `*Costo de Envío (Puerto Iguazú):* ${formatearMoneda(costoEnvio)}\n`;
    }
    mensaje += `💰 *TOTAL GENERAL: ${formatearMoneda(total)}*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `✨ _¡Muchas gracias por su atención!_`;

    // URL oficial de WhatsApp con número destino +54 9 3757 57-1985
    const urlWhatsApp = `https://wa.me/${CONFIG.telefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;

    // Reiniciar Carrito
    state.carrito = [];
    renderizarCarrito();
    actualizarBadges();

    // Cerrar drawer
    document.getElementById('drawer-carrito')?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');

    mostrarToast('¡Pedido confirmado con éxito! Abriendo WhatsApp oficial...', 'success');

    setTimeout(() => {
      window.open(urlWhatsApp, '_blank');
    }, 500);
  };

  // ========================================================
  // 11. GEOLOCALIZACIÓN (PUERTO IGUAZÚ)
  // ========================================================
  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const ejecutarGeocodificacionInversa = async (lat, lon) => {
    const inputDireccion = document.getElementById('input-direccion');
    const infoGeo = document.getElementById('info-geolocalizacion');

    try {
      const distanciaKm = calcularDistancia(
        lat, lon, 
        CONFIG.centroIguazu.lat, CONFIG.centroIguazu.lon
      );

      if (distanciaKm > CONFIG.centroIguazu.radioMaximoKm) {
        throw new Error('FUERA_DE_COBERTURA');
      }

      const urlApi = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
      const response = await fetch(urlApi, {
        headers: { 'Accept-Language': 'es' }
      });

      if (!response.ok) throw new Error('ERROR_API');

      const data = await response.json();
      const addr = data.address || {};

      const calle = addr.road || addr.pedestrian || addr.street || addr.avenue || 'Calle sin nombre';
      const numero = addr.house_number ? ` ${addr.house_number}` : '';
      const barrio = addr.neighbourhood || addr.suburb ? ` (${addr.neighbourhood || addr.suburb})` : '';
      
      const direccionCompleta = `${calle}${numero}${barrio}, Puerto Iguazú, Misiones`;

      if (inputDireccion) {
        inputDireccion.value = direccionCompleta;
        inputDireccion.classList.remove('border-stone-300', 'dark:border-stone-700');
        inputDireccion.classList.add('border-emerald-500', 'bg-emerald-50/30', 'dark:bg-emerald-950/20');
      }

      state.ubicacionValidadaIguazu = true;

      if (infoGeo) {
        infoGeo.textContent = `✅ Ubicación validada en Puerto Iguazú (${distanciaKm.toFixed(1)} km del centro).`;
        infoGeo.className = 'text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1';
      }

      mostrarToast('¡Dirección detectada y validada en Puerto Iguazú!', 'success');

    } catch (error) {
      state.ubicacionValidadaIguazu = false;
      if (infoGeo) {
        infoGeo.textContent = '⚠️ No pudimos validar la ubicación automáticamente. Podés escribirla manualmente.';
        infoGeo.className = 'text-[11px] text-amber-600 font-semibold mt-1';
      }
    }
  };

  const manejarBotonGeolocalizar = () => {
    const infoGeo = document.getElementById('info-geolocalizacion');
    if (!navigator.geolocation) {
      if (infoGeo) {
        infoGeo.textContent = '⚠️ Tu navegador no soporta geolocalización.';
        infoGeo.className = 'text-[11px] text-amber-500 font-semibold';
      }
      return;
    }

    if (infoGeo) {
      infoGeo.textContent = '📍 Obteniendo coordenadas en Puerto Iguazú...';
      infoGeo.className = 'text-[11px] text-brand-600 dark:text-brand-400 font-semibold animate-pulse';
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        ejecutarGeocodificacionInversa(latitude, longitude);
      },
      () => {
        state.ubicacionValidadaIguazu = false;
        if (infoGeo) {
          infoGeo.textContent = '⚠️ Permiso GPS no concedido. Podés escribir tu dirección manualmente.';
          infoGeo.className = 'text-[11px] text-amber-600 font-medium mt-1';
        }
        mostrarToast('Podés ingresar tu dirección de entrega manualmente.', 'info');
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  // ========================================================
  // 12. PANEL KDS (KITCHEN DISPLAY SYSTEM) & TICKETS TÉRMICOS
  // ========================================================
  window.cambiarEstadoComanda = (idComanda, nuevoEstado) => {
    const comanda = state.comandasCocina.find(c => c.id === idComanda);
    if (comanda) {
      comanda.estado = nuevoEstado;
      guardarComandasEnStorage();
      mostrarToast(`Comanda #${idComanda} marcada como: ${nuevoEstado.toUpperCase()}`, 'info');
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
      <div><strong>TICKET COCINA / KDS: #${comanda.id}</strong></div>
      <div>Fecha: ${fechaFormateada}</div>
      <div>Cliente: ${comanda.cliente}</div>
      <div>Tel: ${comanda.telefono}</div>
      <div>Entrega: ${comanda.tipoEntrega.toUpperCase()}</div>
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
        <div class="col-span-full py-16 text-center text-stone-500">
          <p class="text-4xl mb-2">👨‍🍳</p>
          <p class="text-lg font-bold text-stone-300">No hay comandas activas en cocina.</p>
          <p class="text-xs text-stone-500 mt-1">Los nuevos pedidos ingresarán aquí en tiempo real.</p>
        </div>
      `;
      return;
    }

    gridComandas.innerHTML = state.comandasCocina.map(comanda => {
      const fecha = new Date(comanda.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      
      const badgeColores = {
        pendiente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        preparacion: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        listo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        entregado: 'bg-stone-500/20 text-stone-400 border-stone-500/30'
      };

      return `
        <div class="p-5 rounded-2xl bg-stone-800 border border-stone-700 shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-stone-700 mb-3">
              <div>
                <span class="font-mono text-xs font-bold text-brand-400">#${comanda.id}</span>
                <span class="text-xs text-stone-400 ml-2">🕒 ${fecha}</span>
              </div>
              <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColores[comanda.estado] || badgeColores.pendiente}">
                ${comanda.estado}
              </span>
            </div>

            <div class="space-y-1 text-xs mb-3">
              <p class="text-white font-bold text-sm">${comanda.cliente}</p>
              <p class="text-stone-400">📞 ${comanda.telefono}</p>
              <p class="text-stone-300">📍 ${comanda.tipoEntrega === 'delivery' ? `🛵 Delivery: ${comanda.direccion}` : '🛍️ Retiro en Local'}</p>
              <p class="text-stone-300 font-semibold">💳 Pago: ${comanda.metodoPago === 'mercadopago' ? 'MERCADO PAGO / TRANSF.' : 'EFECTIVO'}</p>
              ${comanda.comprobante ? `<p class="text-emerald-400 font-mono text-[11px]">🧾 Comprobante: #${comanda.comprobante}</p>` : ''}
              ${comanda.notas ? `<p class="text-amber-300 italic">📝 "${comanda.notas}"</p>` : ''}
            </div>

            <div class="border-t border-dashed border-stone-700 pt-2 mb-4 space-y-1">
              ${comanda.items.map(it => `
                <div class="flex justify-between text-xs text-stone-200">
                  <span><strong>${it.cantidad}x</strong> ${it.nombre} ${it.topping ? `<span class="text-brand-300">(${it.topping})</span>` : ''}</span>
                  <span class="font-mono">${formatearMoneda(it.subtotal)}</span>
                </div>
              `).join('')}
              <div class="flex justify-between text-xs font-bold text-white pt-2 border-t border-stone-700">
                <span>TOTAL:</span>
                <span class="font-mono text-emerald-400">${formatearMoneda(comanda.total)}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 pt-2 border-t border-stone-700">
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
              <button onclick="cambiarEstadoComanda('${comanda.id}', 'entregado')" class="flex-1 py-1.5 px-2 text-xs font-bold rounded-xl bg-stone-600 hover:bg-stone-500 text-white transition">
                Entregado
              </button>
            ` : ''}
            <button onclick="imprimirTicketTermico('${comanda.id}')" class="py-1.5 px-3 text-xs font-bold rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 transition">
              🖨️
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  // ========================================================
  // 13. EVENT LISTENERS Y CONFIGURACIÓN DOM
  // ========================================================
  const configurarEventListeners = () => {
    // Drawer Carrito
    const btnAbrirCarrito = document.getElementById('btn-abrir-carrito');
    const btnAbrirCarritoFlotante = document.getElementById('btn-abrir-carrito-flotante');
    const btnCerrarCarrito = document.getElementById('btn-cerrar-carrito');
    const overlayCarrito = document.getElementById('overlay-carrito');
    const drawerCarrito = document.getElementById('drawer-carrito');

    const abrirCarrito = () => {
      renderizarCarrito();
      drawerCarrito?.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    };

    const cerrarCarrito = () => {
      drawerCarrito?.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    };

    btnAbrirCarrito?.addEventListener('click', abrirCarrito);
    btnAbrirCarritoFlotante?.addEventListener('click', abrirCarrito);
    btnCerrarCarrito?.addEventListener('click', cerrarCarrito);
    overlayCarrito?.addEventListener('click', cerrarCarrito);

    // Filtros de categoría
    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    botonesFiltro.forEach(btn => {
      btn.addEventListener('click', (e) => {
        botonesFiltro.forEach(b => {
          b.classList.remove('bg-brand-600', 'text-white', 'shadow-sm');
          b.classList.add('bg-stone-100', 'dark:bg-stone-800', 'text-stone-700', 'dark:text-stone-300');
        });
        e.currentTarget.classList.add('bg-brand-600', 'text-white', 'shadow-sm');
        e.currentTarget.classList.remove('bg-stone-100', 'dark:bg-stone-800', 'text-stone-700', 'dark:text-stone-300');

        state.categoriaSeleccionada = e.currentTarget.getAttribute('data-categoria') || 'todos';
        renderizarCatalogo();
      });
    });

    // Modalidad de Entrega (Takeaway / Delivery)
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

    // Forma de Pago (Efectivo / Mercado Pago)
    const radiosPago = document.querySelectorAll('input[name="metodo-pago"]');
    radiosPago.forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.metodoPago = e.target.value;
        actualizarBotonCheckoutUI();
      });
    });

    // Botón Principal de Checkout (Envío a WhatsApp)
    const btnCheckoutPrincipal = document.getElementById('btn-checkout-principal');
    btnCheckoutPrincipal?.addEventListener('click', () => {
      enviarPedidoWhatsApp();
    });

    // Geolocalización
    const btnGeolocalizar = document.getElementById('btn-geolocalizar');
    btnGeolocalizar?.addEventListener('click', manejarBotonGeolocalizar);

    // KDS Modal de Autenticación
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
      const claveIngresada = (inputKdsPin?.value || '').trim();
      if (claveIngresada === CONFIG.claveCocinaKDS) {
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

    // Dark Mode Toggle
    const btnDarkMode = document.getElementById('btn-dark-mode');
    btnDarkMode?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem(STORAGE_KEYS.TEMA, isDark ? 'dark' : 'light');
    });
  };

  // ========================================================
  // 14. INICIALIZACIÓN
  // ========================================================
  cargarEstadoInicial();
  renderizarCatalogo();
  actualizarBadges();
  configurarEventListeners();
});
