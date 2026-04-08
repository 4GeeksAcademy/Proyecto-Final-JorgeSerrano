import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export const Carrito = () => {
    const { store, dispatch } = useGlobalReducer();
    const { carrito } = store;
    const navigate = useNavigate();

    const [modalAbierto, setModalAbierto] = useState(false);
    const [pagado, setPagado] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [form, setForm] = useState({
        nombre: "",
        email: "",
        tarjeta: "",
        expiry: "",
        cvv: "",
    });
    const [errores, setErrores] = useState({});

    const token = localStorage.getItem("token");
    const estaLogueado = !!token;

    const total = carrito.reduce((sum, item) => sum + item.price * (item.cantidad || 1), 0);

    // Cargar carrito desde BD al montar (solo si está logueado)
    useEffect(() => {
        if (!estaLogueado) return;

        fetch(`${BACKEND_URL}/api/carrito`, {
            headers: { Authorization: "Bearer " + token },
        })
            .then(res => res.json())
            .then(items => {
                // Normalizar campos al formato que usa el store
                const normalizado = items.map(item => ({
                    id: item.producto_id,
                    _carrito_id: item.id,
                    title: item.titulo,
                    price: item.precio,
                    img: item.imagen,
                    cantidad: item.cantidad,
                    tallaSeleccionada: item.talla,
                    style: item.style || "",
                }));
                dispatch({ type: "cargar_carrito", payload: normalizado });
            })
            .catch(() => {});
    }, [estaLogueado]);

    const handleCantidad = async (id, nuevaCantidad) => {
        if (nuevaCantidad < 1) {
            dispatch({ type: "quitar_del_carrito", payload: id });
            if (estaLogueado) {
                const item = carrito.find(i => i.id === id);
                if (item?._carrito_id) {
                    await fetch(`${BACKEND_URL}/api/carrito/${item._carrito_id}`, {
                        method: "DELETE",
                        headers: { Authorization: "Bearer " + token },
                    }).catch(() => {});
                }
            }
            return;
        }
        dispatch({ type: "actualizar_cantidad", payload: { id, cantidad: nuevaCantidad } });
        if (estaLogueado) {
            const item = carrito.find(i => i.id === id);
            if (item?._carrito_id) {
                await fetch(`${BACKEND_URL}/api/carrito/${item._carrito_id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    body: JSON.stringify({ cantidad: nuevaCantidad }),
                }).catch(() => {});
            }
        }
    };

    const handleEliminar = async (id) => {
        const item = carrito.find(i => i.id === id);
        dispatch({ type: "quitar_del_carrito", payload: id });
        if (estaLogueado && item?._carrito_id) {
            await fetch(`${BACKEND_URL}/api/carrito/${item._carrito_id}`, {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token },
            }).catch(() => {});
        }
    };

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === "tarjeta") {
            value = value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
        }
        if (name === "expiry") {
            value = value.replace(/\D/g, "").slice(0, 4);
            if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
        }
        if (name === "cvv") {
            value = value.replace(/\D/g, "").slice(0, 3);
        }
        setForm(prev => ({ ...prev, [name]: value }));
        setErrores(prev => ({ ...prev, [name]: "" }));
    };

    const validar = () => {
        const nuevosErrores = {};
        if (!form.nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio";
        if (!form.email.includes("@")) nuevosErrores.email = "Email inválido";
        if (form.tarjeta.replace(/\s/g, "").length !== 16) nuevosErrores.tarjeta = "Tarjeta inválida (16 dígitos)";
        if (!/^\d{2}\/\d{2}$/.test(form.expiry)) nuevosErrores.expiry = "Formato MM/AA";
        if (form.cvv.length !== 3) nuevosErrores.cvv = "CVV inválido (3 dígitos)";
        return nuevosErrores;
    };

    const handlePagar = async (e) => {
        e.preventDefault();
        const erroresValidacion = validar();
        if (Object.keys(erroresValidacion).length > 0) {
            setErrores(erroresValidacion);
            return;
        }

        if (!estaLogueado) {
            navigate("/login");
            return;
        }

        setCargando(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/pedidos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify({
                    items: carrito.map(item => ({
                        id: item.id,
                        titulo: item.title,
                        precio: item.price,
                        imagen: item.img,
                        cantidad: item.cantidad || 1,
                        talla: item.tallaSeleccionada,
                    })),
                    total: total,
                    pago: {
                        nombre: form.nombre,
                        email: form.email,
                        tarjeta: form.tarjeta.replace(/\s/g, ""),
                    },
                }),
            });

            if (response.ok) {
                dispatch({ type: "vaciar_carrito" });
                setPagado(true);
            } else {
                const data = await response.json();
                setErrores({ general: data.msg || "Error al procesar el pago" });
            }
        } catch {
            setErrores({ general: "No se pudo conectar con el servidor" });
        } finally {
            setCargando(false);
        }
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setPagado(false);
        setForm({ nombre: "", email: "", tarjeta: "", expiry: "", cvv: "" });
        setErrores({});
    };

    return (
        <div className="cart">
            <h1 className="cart__title">Tu carrito</h1>

            {carrito.length === 0 && !pagado ? (
                <div className="cart__empty">
                    <div className="cart__empty-icon">🛒</div>
                    <p className="cart__empty-text">Tu carrito está vacío</p>
                    <Link to="/catalogo" className="hero__cta" style={{ background: "#111", color: "#fff" }}>
                        Explorar catálogo
                    </Link>
                </div>
            ) : (
                <>
                    {carrito.map(item => (
                        <div className="cart__item" key={item.id}>
                            <img src={item.img} alt={item.title} className="cart__item-img" />
                            <div className="cart__item-info">
                                <h3 className="cart__item-title">{item.title}</h3>
                                <p className="cart__item-style">{item.style}</p>
                                {item.tallaSeleccionada && (
                                    <p className="cart__item-style">Talla: {item.tallaSeleccionada}</p>
                                )}
                                <div className="cart__item-qty">
                                    <button
                                        className="cart__qty-btn"
                                        onClick={() => handleCantidad(item.id, (item.cantidad || 1) - 1)}
                                    >
                                        −
                                    </button>
                                    <span>{item.cantidad || 1}</span>
                                    <button
                                        className="cart__qty-btn"
                                        onClick={() => handleCantidad(item.id, (item.cantidad || 1) + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    className="cart__item-remove"
                                    onClick={() => handleEliminar(item.id)}
                                >
                                    Eliminar
                                </button>
                            </div>
                            <div className="cart__item-price">
                                €{(item.price * (item.cantidad || 1)).toFixed(2)}
                            </div>
                        </div>
                    ))}

                    <div className="cart__summary">
                        <span className="cart__total-label">Total</span>
                        <span className="cart__total-price">€{total.toFixed(2)}</span>
                    </div>
                    <button className="cart__checkout" onClick={() => setModalAbierto(true)}>
                        Proceder al pago
                    </button>
                </>
            )}

            {modalAbierto && (
                <div className="checkout-overlay" onClick={cerrarModal}>
                    <div className="checkout-modal" onClick={e => e.stopPropagation()}>
                        {pagado ? (
                            <div className="checkout-modal__success">
                                <div className="checkout-modal__success-icon">✓</div>
                                <h2 className="checkout-modal__success-title">¡Pago completado!</h2>
                                <p className="checkout-modal__success-text">
                                    Tu pedido ha sido procesado correctamente. Puedes verlo en tu perfil.
                                </p>
                                <Link to="/catalogo" className="checkout-modal__btn" onClick={cerrarModal}>
                                    Seguir comprando
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="checkout-modal__header">
                                    <h2 className="checkout-modal__title">Datos de pago</h2>
                                    <button className="checkout-modal__close" onClick={cerrarModal}>✕</button>
                                </div>
                                <div className="checkout-modal__total">
                                    Total a pagar: <strong>€{total.toFixed(2)}</strong>
                                </div>
                                {errores.general && (
                                    <div style={{ color: "red", marginBottom: "8px", textAlign: "center" }}>
                                        {errores.general}
                                    </div>
                                )}
                                <form className="checkout-modal__form" onSubmit={handlePagar}>
                                    <div className="checkout-field">
                                        <label className="checkout-field__label">Nombre completo</label>
                                        <input
                                            className={`checkout-field__input ${errores.nombre ? "checkout-field__input--error" : ""}`}
                                            type="text"
                                            name="nombre"
                                            value={form.nombre}
                                            onChange={handleChange}
                                            placeholder="Juan García"
                                        />
                                        {errores.nombre && <span className="checkout-field__error">{errores.nombre}</span>}
                                    </div>
                                    <div className="checkout-field">
                                        <label className="checkout-field__label">Email</label>
                                        <input
                                            className={`checkout-field__input ${errores.email ? "checkout-field__input--error" : ""}`}
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="juan@email.com"
                                        />
                                        {errores.email && <span className="checkout-field__error">{errores.email}</span>}
                                    </div>
                                    <div className="checkout-field">
                                        <label className="checkout-field__label">Número de tarjeta</label>
                                        <input
                                            className={`checkout-field__input ${errores.tarjeta ? "checkout-field__input--error" : ""}`}
                                            type="text"
                                            name="tarjeta"
                                            value={form.tarjeta}
                                            onChange={handleChange}
                                            placeholder="1234 5678 9012 3456"
                                        />
                                        {errores.tarjeta && <span className="checkout-field__error">{errores.tarjeta}</span>}
                                    </div>
                                    <div className="checkout-field__row">
                                        <div className="checkout-field">
                                            <label className="checkout-field__label">Caducidad</label>
                                            <input
                                                className={`checkout-field__input ${errores.expiry ? "checkout-field__input--error" : ""}`}
                                                type="text"
                                                name="expiry"
                                                value={form.expiry}
                                                onChange={handleChange}
                                                placeholder="MM/AA"
                                            />
                                            {errores.expiry && <span className="checkout-field__error">{errores.expiry}</span>}
                                        </div>
                                        <div className="checkout-field">
                                            <label className="checkout-field__label">CVV</label>
                                            <input
                                                className={`checkout-field__input ${errores.cvv ? "checkout-field__input--error" : ""}`}
                                                type="text"
                                                name="cvv"
                                                value={form.cvv}
                                                onChange={handleChange}
                                                placeholder="123"
                                            />
                                            {errores.cvv && <span className="checkout-field__error">{errores.cvv}</span>}
                                        </div>
                                    </div>
                                    <button
                                        className="checkout-modal__btn"
                                        type="submit"
                                        disabled={cargando}
                                    >
                                        {cargando ? "Procesando..." : `Pagar €${total.toFixed(2)}`}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Carrito;
