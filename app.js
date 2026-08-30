/**
 * DULCES MOMENTOS - Pastelería Artesanal Boutique
 * Core Logic Engine (Vanilla JS)
 * 
 * Funcionalidades clave:
 * 1. UI de Carrito 100% Responsive con miniaturas ampliadas y tipografía legible
 * 2. Método de Pago (Efectivo / Transferencia Alias QR) sin API externa
 * 3. Bloqueo estricto del botón de confirmación hasta ingresar N° de comprobante
 * 4. Envío estructurado a WhatsApp oficial (+54 9 3757 57-1985) con emojis y datos completos
 * 5. Geolocalización y Geocodificación Inversa estricta para Puerto Iguazú, Misiones
 * 6. Persistencia LocalStorage (Carrito & Comandas KDS)
 * 7. Panel KDS y Soporte de Impresión Térmica
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
      radioMaximoKm: 12.0 // Radio máximo de entrega
    }
  };

  const STORAGE_KEYS = {
    CARRITO: 'dulces_momentos_carrito_v2',
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
  // 4. ESTADO GLOBAL DE LA APLICACIÓN
  // ========================================================
  let state = {
    carrito: [],
    comandasCocina: [],
    categoriaSeleccionada: 'todos',
    tipoEntrega: 'takeaway', // 'takeaway' | 'delivery'
    metodoPago: 'efectivo',  // 'efectivo' | 'transferencia'
    ubicacionValidadaIguazu: false
  };

  // ========================================================
  // 5. PERSISTENCIA (LOCALSTORAGE ENGINE)
  // ========================================================
  const cargarEstadoDesdeStorage = () => {
    try {
      const carritoGuardado = localStorage.getItem(STORAGE_KEYS.CARRITO);
      if (carritoGuardado) state.carrito = JSON.parse(carritoGuardado);

      const comandasGuardadas = localStorage.getItem(STORAGE_KEYS.COMANDAS);
      if (comandasGuardadas) {
        state.comandasCocina = JSON.parse(comandasGuardadas);
      } else {
        state.comandasCocina = [
          {
            id: 'CMD-8021',
            fecha: new Date(Date.now() - 15 * 60000).toISOString(),
            cliente: 'Sofía Valenzuela',
            telefono: '3757445566',
            tipoEntrega: 'delivery',
            direccion: 'Av. Victoria Aguirre 450, Puerto Iguazú',
            metodoPago: 'transferencia',
            comprobante: '94821034',
            notas: 'Sin cubiertos plásticos por favor',
            estado: 'en_preparacion',
            items: [
              { nombre: 'Cheesecake New York Clásico', cantidad: 1, topping: 'Salsa Reducción de Maracuyá', subtotal: 17300 }
            ],
            subtotal: 17300,
            envio: 1500,
            total: 18800
          }
        ];
        guardarComandasEnStorage();
      }
    } catch (error) {
      console.error('Error al cargar datos desde localStorage:', error);
    }
  };

  const guardarCarritoEnStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARRITO, JSON.stringify(state.carrito));
      actualizarBadgeCarrito();
    } catch (error) {
      console.error('Error al guardar el carrito:', error);
    }
  };

  const guardarComandasEnStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(state.comandasCocina));
      renderizarKDS();
    } catch (error) {
      console.error('Error al guardar comandas:', error);
    }
  };

  // ========================================================
  // 6. SISTEMA DE NOTIFICACIONES TOAST (UI/UX)
  // ========================================================
  const mostrarToast = (mensaje, tipo = 'info') => {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl text-sm font-medium text-white transition-all transform duration-300 translate-y-2 opacity-0 ${
      tipo === 'success' ? 'bg-emerald-600 border border-emerald-500' :
      tipo === 'error' ? 'bg-rose-600 border border-rose-500' :
      tipo === 'warning' ? 'bg-amber-600 border border-amber-500' :
      'bg-stone-900 border border-stone-800'
    }`;

    const icono = tipo === 'success' ? '✅' : tipo === 'error' ? '🚫' : tipo === 'warning' ? '⚠️' : 'ℹ️';

    toast.innerHTML = `
      <span class="text-base">${icono}</span>
      <p class="flex-1">${mensaje}</p>
    `;

    contenedor.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  };

  // ========================================================
  // 7. RENDERIZADO DEL CATÁLOGO (V2.0 CON TOPPINGS)
  // ========================================================
  const renderizarCatalogo = () => {
    const contenedorCatalogo = document.getElementById('catalogo-productos');
    if (!contenedorCatalogo) return;

    const productosFiltrados = state.categoriaSeleccionada === 'todos'
      ? PRODUCTOS
      : PRODUCTOS.filter(p => p.categoria.toLowerCase() === state.categoriaSeleccionada.toLowerCase());

    contenedorCatalogo.innerHTML = productosFiltrados.map(producto => `
      <article class="flex flex-col justify-between bg-white dark:bg-stone-900 rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-800 transition-all duration-300 group">
        <div>
          <!-- Imagen Producto -->
          <div class="relative h-60 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
            <img 
              src="${producto.imagen}" 
              alt="${producto.nombre}" 
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            >
            <div class="absolute top-3 left-3 flex gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 dark:bg-stone-900/90 text-brand-700 dark:text-brand-300 backdrop-blur-xs shadow-xs border border-brand-200/50">
                ${producto.categoria}
              </span>
              ${producto.badge ? `
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-600 text-white shadow-xs">
                  ${producto.badge}
                </span>
              ` : ''}
            </div>
            <div class="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-stone-950/80 backdrop-blur-xs text-white font-mono font-bold text-sm">
              Stock: ${producto.stock}u
            </div>
          </div>

          <!-- Contenido y Toppings -->
          <div class="p-6">
            <h3 class="font-serif text-xl font-bold text-stone-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              ${producto.nombre}
            </h3>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
              ${producto.descripcion}
            </p>

            <!-- Selector de Toppings -->
            ${producto.toppings && producto.toppings.length > 0 ? `
              <div class="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <label for="select-topping-${producto.id}" class="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                  Personalizá con Topping:
                </label>
                <select id="select-topping-${producto.id}" class="w-full text-xs sm:text-sm px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-brand-500 focus:outline-none transition">
                  <option value="">Sin topping adicional</option>
                  ${producto.toppings.map(t => `
                    <option value="${t.id}">${t.nombre} (+${formatearMoneda(t.precio)})</option>
                  `).join('')}
                </select>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Footer Card & Precio -->
        <div class="p-6 pt-0 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 mt-2">
          <div>
            <span class="block text-xs text-stone-400 font-medium">Precio base</span>
            <span class="font-mono text-xl font-bold text-brand-700 dark:text-brand-400">
              ${formatearMoneda(producto.precio)}
            </span>
          </div>
          <button 
            data-id="${producto.id}" 
            class="btn-agregar-carrito flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-brand-600/30 transition duration-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Agregar</span>
          </button>
        </div>
      </article>
    `).join('');

    // Listener para botones de agregar
    contenedorCatalogo.querySelectorAll('.btn-agregar-carrito').forEach(boton => {
      boton.addEventListener('click', (e) => {
        const idProd = e.currentTarget.getAttribute('data-id');
        const selectTopping = document.getElementById(`select-topping-${idProd}`);
        const idTopping = selectTopping ? selectTopping.value : null;
        agregarProductoAlCarrito(idProd, idTopping);
      });
    });
  };

  const inicializarFiltros = () => {
    const contenedorFiltros = document.getElementById('filtros-categoria');
    if (!contenedorFiltros) return;

    contenedorFiltros.querySelectorAll('.btn-filtro').forEach(boton => {
      boton.addEventListener('click', () => {
        contenedorFiltros.querySelectorAll('.btn-filtro').forEach(b => {
          b.classList.remove('bg-brand-600', 'text-white');
          b.classList.add('bg-stone-100', 'dark:bg-stone-800', 'text-stone-700', 'dark:text-stone-300');
        });

        boton.classList.add('bg-brand-600', 'text-white');
        boton.classList.remove('bg-stone-100', 'dark:bg-stone-800', 'text-stone-700', 'dark:text-stone-300');

        state.categoriaSeleccionada = boton.getAttribute('data-categoria');
        renderizarCatalogo();
      });
    });
  };

  // ========================================================
  // 8. GESTIÓN DEL CARRITO (CON miniaturas 70x70 y flexbox)
  // ========================================================
  const actualizarBadgeCarrito = () => {
    const badge = document.getElementById('badge-carrito');
    const badgeFlotante = document.getElementById('badge-carrito-flotante');
    const totalCount = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (badge) badge.textContent = totalCount;
    if (badgeFlotante) badgeFlotante.textContent = totalCount;
  };

  const agregarProductoAlCarrito = (productoId, toppingId = null) => {
    const producto = PRODUCTOS.find(p => p.id === productoId);
    if (!producto) return;

    let toppingSeleccionado = null;
    if (toppingId && producto.toppings) {
      toppingSeleccionado = producto.toppings.find(t => t.id === toppingId);
    }

    const precioUnitario = producto.precio + (toppingSeleccionado ? toppingSeleccionado.precio : 0);
    const itemIdUnico = `${producto.id}_${toppingSeleccionado ? toppingSeleccionado.id : 'base'}`;

    const itemExistente = state.carrito.find(item => item.itemKey === itemIdUnico);

    if (itemExistente) {
      itemExistente.cantidad += 1;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.precioUnitario;
    } else {
      state.carrito.push({
        itemKey: itemIdUnico,
        id: producto.id,
        nombre: producto.nombre,
        precioUnitario: precioUnitario,
        cantidad: 1,
        subtotal: precioUnitario,
        imagen: producto.imagen,
        topping: toppingSeleccionado ? { id: toppingSeleccionado.id, nombre: toppingSeleccionado.nombre, precio: toppingSeleccionado.precio } : null
      });
    }

    guardarCarritoEnStorage();
    renderizarCarrito();
    mostrarToast(`Agregaste "${producto.nombre}" al carrito.`, 'success');
  };

  const modificarCantidadItem = (itemKey, cambio) => {
    const index = state.carrito.findIndex(item => item.itemKey === itemKey);
    if (index === -1) return;

    state.carrito[index].cantidad += cambio;

    if (state.carrito[index].cantidad <= 0) {
      const nombreEliminado = state.carrito[index].nombre;
      state.carrito.splice(index, 1);
      mostrarToast(`Quitaste "${nombreEliminado}" del pedido.`, 'info');
    } else {
      state.carrito[index].subtotal = state.carrito[index].cantidad * state.carrito[index].precioUnitario;
    }

    guardarCarritoEnStorage();
    renderizarCarrito();
  };

  /**
   * Valida si el botón de checkout debe estar bloqueado o habilitado
   */
  const actualizarBloqueoBotonCheckout = () => {
    const btnCheckout = document.getElementById('btn-checkout-whatsapp');
    const inputComprobante = document.getElementById('input-comprobante');
    const avisoBloqueo = document.getElementById('aviso-bloqueo-comprobante');
    if (!btnCheckout) return;

    if (state.metodoPago === 'transferencia') {
      const comprobante = (inputComprobante?.value || '').trim();
      if (comprobante.length === 0) {
        btnCheckout.disabled = true;
        btnCheckout.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none', 'grayscale');
        if (avisoBloqueo) avisoBloqueo.classList.remove('hidden');
      } else {
        btnCheckout.disabled = false;
        btnCheckout.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none', 'grayscale');
        if (avisoBloqueo) avisoBloqueo.classList.add('hidden');
      }
    } else {
      // Efectivo -> Habilitado
      btnCheckout.disabled = false;
      btnCheckout.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none', 'grayscale');
      if (avisoBloqueo) avisoBloqueo.classList.add('hidden');
    }
  };

  const renderizarCarrito = () => {
    const contenedorLista = document.getElementById('lista-carrito');
    const totalItemsEl = document.getElementById('total-items-carrito');
    const subtotalEl = document.getElementById('subtotal-carrito');
    const envioEl = document.getElementById('costo-envio');
    const totalEl = document.getElementById('total-carrito');

    if (!contenedorLista) return;

    const totalArticulos = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (totalItemsEl) totalItemsEl.textContent = `${totalArticulos} producto${totalArticulos !== 1 ? 's' : ''} seleccionado${totalArticulos !== 1 ? 's' : ''}`;

    if (state.carrito.length === 0) {
      contenedorLista.innerHTML = `
        <div class="py-12 text-center text-stone-400 dark:text-stone-500">
          <div class="text-4xl mb-3">🧁</div>
          <p class="font-medium text-stone-600 dark:text-stone-400">Tu carrito está vacío.</p>
          <p class="text-xs text-stone-400 dark:text-stone-500 mt-1">Elegí nuestras exquisiteces artesanales para comenzar.</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '$ 0';
      if (envioEl) envioEl.textContent = '$ 0';
      if (totalEl) totalEl.textContent = '$ 0';
      actualizarBloqueoBotonCheckout();
      return;
    }

    contenedorLista.innerHTML = state.carrito.map(item => `
      <div class="carrito-item-row">
        <!-- Miniatura del Producto 70x70px fija -->
        <img 
          src="${item.imagen}" 
          alt="${item.nombre}" 
          class="carrito-item-img"
          loading="lazy"
        >

        <!-- Información del Producto -->
        <div class="carrito-item-info">
          <h4 class="carrito-item-titulo">${item.nombre}</h4>
          ${item.topping ? `<span class="carrito-item-topping">✨ ${item.topping.nombre}</span>` : ''}
          <span class="carrito-item-precio">${formatearMoneda(item.subtotal)}</span>
        </div>

        <!-- Controles de Cantidad -->
        <div class="carrito-item-controles">
          <button 
            data-key="${item.itemKey}" 
            class="btn-restar carrito-btn-qty" 
            aria-label="Disminuir cantidad"
          >−</button>
          <span class="font-mono font-bold text-xs sm:text-sm px-1.5 text-stone-800 dark:text-stone-100">${item.cantidad}</span>
          <button 
            data-key="${item.itemKey}" 
            class="btn-sumar carrito-btn-qty" 
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

    actualizarBloqueoBotonCheckout();
  };

  // ====================================================================
  // 9. GEOLOCALIZACIÓN Y GEOCODIFICACIÓN INVERSA (PUERTO IGUAZÚ ESTRICTO)
  // ====================================================================
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

      const ciudad = (addr.city || addr.town || addr.village || addr.municipality || addr.county || '').toLowerCase();
      const provincia = (addr.state || '').toLowerCase();

      const esIguazu = ciudad.includes('iguazu') || ciudad.includes('iguazú') || ciudad.includes('puerto iguazú') || distanciaKm <= 8.5;
      const esMisiones = provincia.includes('misiones') || distanciaKm <= 8.5;

      if (!esIguazu && !esMisiones) {
        throw new Error('FUERA_DE_COBERTURA');
      }

      const calle = addr.road || addr.pedestrian || addr.street || addr.avenue || addr.suburb || 'Calle sin nombre';
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
        infoGeo.textContent = `✅ Ubicación detectada en Puerto Iguazú (${distanciaKm.toFixed(1)} km del centro).`;
        infoGeo.className = 'text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1';
      }

      mostrarToast('¡Dirección detectada y validada en Puerto Iguazú!', 'success');

    } catch (error) {
      state.ubicacionValidadaIguazu = false;
      forzarRetiroEnLocal('La ubicación detectada no pertenece a Puerto Iguazú, Misiones.');
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
      infoGeo.textContent = '📍 Obteniendo coordenadas y traduciendo calle en Puerto Iguazú...';
      infoGeo.className = 'text-[11px] text-brand-600 dark:text-brand-400 font-semibold animate-pulse';
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        ejecutarGeocodificacionInversa(latitude, longitude);
      },
      (err) => {
        state.ubicacionValidadaIguazu = false;
        if (infoGeo) {
          infoGeo.textContent = '⚠️ No pudimos acceder al GPS. Por favor escribe tu dirección manualmente en Puerto Iguazú.';
          infoGeo.className = 'text-[11px] text-amber-600 font-medium mt-1';
        }
        mostrarToast('Permiso de GPS no concedido. Podés escribir tu dirección.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  const forzarRetiroEnLocal = (motivo) => {
    const radioTakeaway = document.querySelector('input[name="tipo-entrega"][value="takeaway"]');
    const campoDireccion = document.getElementById('campo-direccion');
    const infoGeo = document.getElementById('info-geolocalizacion');
    const inputDireccion = document.getElementById('input-direccion');

    if (radioTakeaway) radioTakeaway.checked = true;
    state.tipoEntrega = 'takeaway';
    state.ubicacionValidadaIguazu = false;

    if (campoDireccion) campoDireccion.classList.add('hidden');
    if (inputDireccion) inputDireccion.value = '';
    
    if (infoGeo) {
      infoGeo.textContent = '❌ Fuera del área de cobertura (Solo envíos en Puerto Iguazú, Misiones).';
      infoGeo.className = 'text-[11px] text-red-500 font-bold mt-1';
    }

    renderizarCarrito();
    mostrarToast(`Delivery no disponible: ${motivo} Se seleccionó Retiro por el Local.`, 'error');
  };

  // ========================================================
  // 10. CHECKOUT Y REDIRECCIÓN A WHATSAPP (+54 9 3757 57-1985)
  // ========================================================
  const ejecutarCheckoutWhatsApp = () => {
    if (state.carrito.length === 0) {
      mostrarToast('Tu carrito está vacío. Agregá al menos un postre.', 'warning');
      return;
    }

    const inputNombre = document.getElementById('input-nombre');
    const inputTelefono = document.getElementById('input-telefono');
    const inputNotas = document.getElementById('input-notas');
    const inputDireccion = document.getElementById('input-direccion');
    const inputComprobante = document.getElementById('input-comprobante');
    const errorTelefono = document.getElementById('error-telefono');
    const infoGeo = document.getElementById('info-geolocalizacion');

    const nombre = (inputNombre?.value || '').trim();
    const telefono = (inputTelefono?.value || '').trim();
    const notas = (inputNotas?.value || '').trim();
    const direccion = (inputDireccion?.value || '').trim();
    const comprobante = (inputComprobante?.value || '').trim();

    // Validar nombre
    if (!nombre) {
      inputNombre?.focus();
      return mostrarToast('Por favor, ingresá tu nombre completo.', 'error');
    }
    
    // Validar teléfono (mínimo 8 dígitos)
    const telLimpio = telefono.replace(/\D/g, '');
    if (telLimpio.length < 8) {
      errorTelefono?.classList.remove('hidden');
      inputTelefono?.focus();
      return mostrarToast('El teléfono debe tener un formato válido (mínimo 8 dígitos)', 'error');
    } else {
      errorTelefono?.classList.add('hidden');
    }

    // Validar dirección si es Delivery
    if (state.tipoEntrega === 'delivery') {
      if (!direccion) {
        inputDireccion?.focus();
        return mostrarToast('Por favor, ingresá o validá tu dirección en Puerto Iguazú.', 'error');
      }
      if (infoGeo && infoGeo.textContent.includes('Fuera del área')) {
        return mostrarToast('Lamentablemente la dirección está fuera de nuestra zona de envíos en Puerto Iguazú.', 'error');
      }
    }

    // Validar comprobante si es Transferencia
    if (state.metodoPago === 'transferencia' && !comprobante) {
      inputComprobante?.focus();
      actualizarBloqueoBotonCheckout();
      return mostrarToast('Por favor ingresá el número de comprobante de la transferencia.', 'error');
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
      comprobante: state.metodoPago === 'transferencia' ? comprobante : null,
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

    // Método de pago formateado
    const metodoPagoTexto = state.metodoPago === 'transferencia'
      ? '🏦 Transferencia / Mercado Pago (Alias QR)'
      : '💵 Efectivo (al recibir / retirar)';

    // Mensaje Estructurado para WhatsApp con emojis
    let mensaje = `🎂 *¡HOLA DULCES MOMENTOS!* 🎂\n`;
    mensaje += `Quiero confirmar el siguiente pedido para mi celebración:\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🧾 *ID Comanda:* #${nuevaComanda.id}\n`;
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
    mensaje += `💳 *Método de Pago:* ${metodoPagoTexto}\n`;
    if (state.metodoPago === 'transferencia' && comprobante) {
      mensaje += `🔢 *N° de Comprobante:* ${comprobante}\n`;
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

    // Limpiar carrito y cerrar drawer
    state.carrito = [];
    guardarCarritoEnStorage();
    renderizarCarrito();
    document.getElementById('drawer-carrito')?.classList.add('hidden');

    mostrarToast('¡Pedido armado con éxito! Abriendo WhatsApp oficial...', 'success');

    setTimeout(() => {
      window.open(urlWhatsApp, '_blank');
    }, 500);
  };

  // ========================================================
  // 11. PANEL KDS (KITCHEN DISPLAY SYSTEM) & TICKETS TÉRMICOS
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
      ${comanda.tipoEntrega === 'delivery' ? `<div>Dir: ${comanda.direccion}</div>` : ''}
      <div>Pago: ${comanda.metodoPago === 'transferencia' ? `TRANSF (#${comanda.comprobante || 'S/N'})` : 'EFECTIVO'}</div>
      ${comanda.notas ? `<div>Nota: ${comanda.notas}</div>` : ''}
      <div class="separador"></div>
      <div><strong>DETALLE PRODUCTOS:</strong></div>
      ${comanda.items.map(item => `
        <div class="item-fila">
          <span>${item.cantidad}x ${item.nombre} ${item.topping ? `(+${item.topping})` : ''}</span>
          <span>${formatearMoneda(item.subtotal)}</span>
        </div>
      `).join('')}
      <div class="separador"></div>
      <div class="item-fila">
        <span>Subtotal:</span>
        <span>${formatearMoneda(comanda.subtotal)}</span>
      </div>
      <div class="item-fila">
        <span>Envío:</span>
        <span>${formatearMoneda(comanda.envio)}</span>
      </div>
      <div class="total-fila">
        <span>TOTAL:</span>
        <span>${formatearMoneda(comanda.total)}</span>
      </div>
      <div class="separador"></div>
      <div class="subtitulo" style="margin-top:8px;">*** COMPROBANTE DE COMANDA ***</div>
    `;

    window.print();
  };

  const renderizarKDS = () => {
    const grid = document.getElementById('grid-comandas-kds');
    const countPendiente = document.getElementById('kds-count-pendiente');
    const countPreparacion = document.getElementById('kds-count-preparacion');
    const countListo = document.getElementById('kds-count-listo');

    if (!grid) return;

    const pendientes = state.comandasCocina.filter(c => c.estado === 'pendiente').length;
    const preparacion = state.comandasCocina.filter(c => c.estado === 'en_preparacion').length;
    const listos = state.comandasCocina.filter(c => c.estado === 'listo').length;

    if (countPendiente) countPendiente.textContent = pendientes;
    if (countPreparacion) countPreparacion.textContent = preparacion;
    if (countListo) countListo.textContent = listos;

    if (state.comandasCocina.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-stone-400">
          <p class="text-xl">No hay comandas activas en la cocina.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = state.comandasCocina.map(cmd => {
      const fechaCorta = new Date(cmd.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      
      const badgeEstado = cmd.estado === 'pendiente' 
        ? '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">⏳ PENDIENTE</span>'
        : cmd.estado === 'en_preparacion'
        ? '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse">🔥 EN HORNO</span>'
        : '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✅ ENTREGADO</span>';

      return `
        <div class="p-5 rounded-2xl bg-stone-800 border ${cmd.estado === 'pendiente' ? 'border-amber-500/50' : cmd.estado === 'en_preparacion' ? 'border-blue-500/50' : 'border-emerald-500/50'} shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="font-mono text-sm font-bold text-white">#${cmd.id} <span class="text-stone-400 text-xs">(${fechaCorta})</span></span>
              ${badgeEstado}
            </div>

            <div class="text-xs space-y-1 text-stone-300 pb-3 border-b border-stone-700">
              <p><strong class="text-white">Cliente:</strong> ${cmd.cliente}</p>
              <p><strong class="text-white">Tel:</strong> ${cmd.telefono}</p>
              <p><strong class="text-white">Modalidad:</strong> ${cmd.tipoEntrega === 'delivery' ? '🛵 Delivery' : '🏪 Retiro'}</p>
              ${cmd.tipoEntrega === 'delivery' ? `<p><strong class="text-white">Dirección:</strong> ${cmd.direccion}</p>` : ''}
              <p><strong class="text-white">Pago:</strong> ${cmd.metodoPago === 'transferencia' ? `🏦 Transf. (Comp: #${cmd.comprobante || 'S/N'})` : '💵 Efectivo'}</p>
              ${cmd.notas ? `<p class="italic text-amber-200"><strong class="text-white">Nota:</strong> ${cmd.notas}</p>` : ''}
            </div>

            <div class="py-3 space-y-1.5 border-b border-stone-700">
              <p class="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Productos:</p>
              ${cmd.items.map(item => `
                <div class="text-xs flex justify-between text-white">
                  <span><strong>${item.cantidad}x</strong> ${item.nombre} ${item.topping ? `<span class="text-brand-300">(+${item.topping})</span>` : ''}</span>
                  <span class="font-mono text-stone-400">${formatearMoneda(item.subtotal)}</span>
                </div>
              `).join('')}
            </div>

            <div class="pt-2 flex justify-between items-center text-sm">
              <span class="text-stone-400">Total:</span>
              <span class="font-mono font-bold text-emerald-400 text-base">${formatearMoneda(cmd.total)}</span>
            </div>
          </div>

          <div class="space-y-2 pt-2 border-t border-stone-700/60">
            <div class="grid grid-cols-2 gap-2">
              <button 
                onclick="cambiarEstadoComanda('${cmd.id}', 'en_preparacion')" 
                class="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white transition"
              >
                👨‍🍳 Cocinando
              </button>
              <button 
                onclick="cambiarEstadoComanda('${cmd.id}', 'listo')" 
                class="px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white transition"
              >
                ✅ Finalizar
              </button>
            </div>
            
            <button 
              onclick="imprimirTicketTermico('${cmd.id}')" 
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span>Imprimir Ticket Térmico</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  // ========================================================
  // 12. REGISTRO DE EVENTOS UI Y MODAL KDS
  // ========================================================
  const registrarEventosUI = () => {
    // Drawer Carrito (Header y Botón Flotante)
    const btnAbrirCarrito = document.getElementById('btn-abrir-carrito');
    const btnAbrirCarritoFlotante = document.getElementById('btn-abrir-carrito-flotante');
    const btnCerrarCarrito = document.getElementById('btn-cerrar-carrito');
    const overlayCarrito = document.getElementById('overlay-carrito');
    const drawerCarrito = document.getElementById('drawer-carrito');

    const abrirDrawer = () => {
      renderizarCarrito();
      drawerCarrito?.classList.remove('hidden');
      actualizarBloqueoBotonCheckout();
    };

    btnAbrirCarrito?.addEventListener('click', abrirDrawer);
    btnAbrirCarritoFlotante?.addEventListener('click', abrirDrawer);

    btnCerrarCarrito?.addEventListener('click', () => {
      drawerCarrito?.classList.add('hidden');
    });

    overlayCarrito?.addEventListener('click', () => {
      drawerCarrito?.classList.add('hidden');
    });

    // Selector Delivery vs Takeaway
    document.querySelectorAll('input[name="tipo-entrega"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.tipoEntrega = e.target.value;
        const campoDireccion = document.getElementById('campo-direccion');
        if (state.tipoEntrega === 'delivery') {
          campoDireccion?.classList.remove('hidden');
        } else {
          campoDireccion?.classList.add('hidden');
        }
        renderizarCarrito();
      });
    });

    // Selector Método de Pago (Efectivo / Transferencia)
    document.querySelectorAll('input[name="metodo-pago"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.metodoPago = e.target.value;
        const bloqueTransf = document.getElementById('bloque-transferencia');
        if (state.metodoPago === 'transferencia') {
          bloqueTransf?.classList.remove('hidden');
          const inputComprobante = document.getElementById('input-comprobante');
          inputComprobante?.focus();
        } else {
          bloqueTransf?.classList.add('hidden');
        }
        actualizarBloqueoBotonCheckout();
      });
    });

    // Input Comprobante Transferencia (Bloqueo dinámico)
    const inputComprobante = document.getElementById('input-comprobante');
    inputComprobante?.addEventListener('input', actualizarBloqueoBotonCheckout);
    inputComprobante?.addEventListener('keyup', actualizarBloqueoBotonCheckout);

    // Botón de Geolocalización con Reverse Geocoding
    document.getElementById('btn-geolocalizar')?.addEventListener('click', manejarBotonGeolocalizar);

    // Botón Checkout WhatsApp
    document.getElementById('btn-checkout-whatsapp')?.addEventListener('click', ejecutarCheckoutWhatsApp);

    // Modal de Autenticación Segura KDS
    const modalAuthKDS = document.getElementById('modal-auth-kds');
    const btnAbrirAuthKDS = document.getElementById('btn-abrir-auth-kds');
    const btnCancelarKDS = document.getElementById('btn-cancelar-kds');
    const formAuthKDS = document.getElementById('form-auth-kds');
    const inputKdsPin = document.getElementById('input-kds-pin');
    const errorKdsPin = document.getElementById('error-kds-pin');
    const seccionKDS = document.getElementById('seccion-kds');
    const btnCerrarKDS = document.getElementById('btn-cerrar-kds');
    const btnLimpiarComandas = document.getElementById('btn-limpiar-comandas');

    const resetearModalKDS = () => {
      if (inputKdsPin) inputKdsPin.value = '';
      if (errorKdsPin) {
        errorKdsPin.classList.add('hidden');
        errorKdsPin.textContent = 'Clave incorrecta. Intentá nuevamente.';
      }
    };

    btnAbrirAuthKDS?.addEventListener('click', () => {
      resetearModalKDS();
      modalAuthKDS?.classList.remove('hidden');
      inputKdsPin?.focus();
    });

    btnCancelarKDS?.addEventListener('click', () => {
      resetearModalKDS();
      modalAuthKDS?.classList.add('hidden');
    });

    formAuthKDS?.addEventListener('submit', (e) => {
      e.preventDefault();
      const pinIngresado = (inputKdsPin?.value || '').trim();

      if (pinIngresado === CONFIG.claveCocinaKDS) {
        resetearModalKDS();
        modalAuthKDS?.classList.add('hidden');
        seccionKDS?.classList.remove('hidden');
        renderizarKDS();
        mostrarToast('Acceso autorizado al Panel de Cocina (KDS).', 'success');
      } else {
        if (errorKdsPin) {
          errorKdsPin.textContent = 'Clave incorrecta. Intentá nuevamente.';
          errorKdsPin.classList.remove('hidden');
        }
        if (inputKdsPin) {
          inputKdsPin.value = '';
          inputKdsPin.focus();
        }
      }
    });

    btnCerrarKDS?.addEventListener('click', () => {
      seccionKDS?.classList.add('hidden');
    });

    btnLimpiarComandas?.addEventListener('click', () => {
      state.comandasCocina = state.comandasCocina.filter(c => c.estado !== 'listo');
      guardarComandasEnStorage();
      mostrarToast('Comandas finalizadas eliminadas de la vista.', 'info');
    });

    // Dark Mode
    const btnDarkMode = document.getElementById('btn-dark-mode');
    const aplicarTema = (oscuro) => {
      if (oscuro) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(STORAGE_KEYS.TEMA, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(STORAGE_KEYS.TEMA, 'light');
      }
    };

    const temaGuardado = localStorage.getItem(STORAGE_KEYS.TEMA);
    if (temaGuardado === 'dark' || (!temaGuardado && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      aplicarTema(true);
    }

    btnDarkMode?.addEventListener('click', () => {
      const esOscuro = document.documentElement.classList.contains('dark');
      aplicarTema(!esOscuro);
    });
  };

  // ========================================================
  // 13. INICIALIZACIÓN
  // ========================================================
  cargarEstadoDesdeStorage();
  inicializarFiltros();
  renderizarCatalogo();
  renderizarCarrito();
  registrarEventosUI();
});
