const carritoGuardado = () => {
  try {
    const data = localStorage.getItem("carrito");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const initialStore = () => {
  return {
    user: null,
    carrito: carritoGuardado()
  }
}

const guardarCarrito = (carrito) => {
  localStorage.setItem("carrito", JSON.stringify(carrito));
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {

    case 'set_user':
      return { ...store, user: action.payload };

    case 'cargar_carrito': {
      guardarCarrito(action.payload);
      return { ...store, carrito: action.payload };
    }

    case 'agregar_al_carrito': {
      const existe = store.carrito.find(item => item.id === action.payload.id);
      let nuevoCarrito;
      if (existe) {
        nuevoCarrito = store.carrito.map(item =>
          item.id === action.payload.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        nuevoCarrito = [...store.carrito, { ...action.payload, cantidad: 1 }];
      }
      guardarCarrito(nuevoCarrito);
      return { ...store, carrito: nuevoCarrito };
    }

    case 'quitar_del_carrito': {
      const nuevoCarrito = store.carrito.filter(item => item.id !== action.payload);
      guardarCarrito(nuevoCarrito);
      return { ...store, carrito: nuevoCarrito };
    }

    case 'actualizar_cantidad': {
      const nuevoCarrito = store.carrito.map(item =>
        item.id === action.payload.id
          ? { ...item, cantidad: action.payload.cantidad }
          : item
      );
      guardarCarrito(nuevoCarrito);
      return { ...store, carrito: nuevoCarrito };
    }

    case 'vaciar_carrito':
      guardarCarrito([]);
      return { ...store, carrito: [] };

    default:
      return store;
  }
}