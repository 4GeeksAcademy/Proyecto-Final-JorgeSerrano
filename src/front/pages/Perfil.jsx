import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export const Perfil = () => {
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [pedidos, setPedidos] = useState([]);
    const navigate = useNavigate();
    const { dispatch } = useGlobalReducer();

    const token = localStorage.getItem("token");

    useEffect(() => {
        const cargarPerfil = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/profile`, {
                    headers: { Authorization: "Bearer " + token },
                });
                const data = await response.json();
                if (response.ok) {
                    setNombre(data.user.nombre || "");
                    setEmail(data.user.email);
                } else {
                    navigate("/login");
                }
            } catch {
                console.error("Error al cargar perfil");
            }
        };

        const cargarPedidos = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/pedidos`, {
                    headers: { Authorization: "Bearer " + token },
                });
                if (response.ok) {
                    const data = await response.json();
                    setPedidos(data);
                }
            } catch {
                console.error("Error al cargar pedidos");
            }
        };

        cargarPerfil();
        cargarPedidos();
    }, []);

    const editarPerfil = async () => {
        setError("");
        setMensaje("");
        try {
            const response = await fetch(`${BACKEND_URL}/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify({ nombre, email }),
            });
            const data = await response.json();
            if (response.ok) {
                setMensaje("Perfil actualizado correctamente");
                dispatch({ type: "set_user", payload: data.user });
            } else {
                setError(data.msg || "Error al actualizar perfil");
            }
        } catch {
            setError("No se pudo conectar con el servidor");
        }
    };

    const eliminarCuenta = async () => {
        const confirmar = window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.");
        if (!confirmar) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/profile`, {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token },
            });
            if (response.ok) {
                localStorage.removeItem("token");
                dispatch({ type: "set_user", payload: null });
                dispatch({ type: "cargar_carrito", payload: [] });
                navigate("/registro");
            } else {
                setError("Error al eliminar cuenta");
            }
        } catch {
            setError("No se pudo conectar con el servidor");
        }
    };

    const cancelarPedido = async (pedidoId) => {
        const confirmar = window.confirm("¿Cancelar este pedido?");
        if (!confirmar) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/pedidos/${pedidoId}`, {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token },
            });
            if (response.ok) {
                setPedidos(prev => prev.filter(p => p.id !== pedidoId));
            }
        } catch {
            console.error("Error al cancelar pedido");
        }
    };

    return (
        <div className="home-container">
            <div className="text-center mt-5">
                <h2>Mi Perfil</h2>
                {mensaje && <div className="alert alert-success">{mensaje}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                    <label htmlFor="perfil-nombre" className="form-label">Nombre</label>
                    <input
                        onChange={(e) => setNombre(e.target.value)}
                        value={nombre}
                        type="text"
                        className="form-control"
                        id="perfil-nombre"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="perfil-email" className="form-label">Email</label>
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        type="email"
                        className="form-control"
                        id="perfil-email"
                    />
                </div>
                <button onClick={editarPerfil} className="btn btn-primary me-2">
                    Guardar cambios
                </button>
                <button onClick={eliminarCuenta} className="btn btn-danger">
                    Eliminar cuenta
                </button>
            </div>

            <div className="mt-5">
                <h3>Mis pedidos</h3>
                {pedidos.length === 0 ? (
                    <p className="text-muted">Aún no tienes pedidos.</p>
                ) : (
                    <div>
                        {pedidos.map(pedido => (
                            <div key={pedido.id} className="card mb-3 p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <strong>Pedido #{pedido.id}</strong>
                                        <span className="ms-3 text-muted" style={{ fontSize: "0.85rem" }}>
                                            {new Date(pedido.fecha).toLocaleDateString("es-ES")}
                                        </span>
                                        <span className="ms-3 badge bg-success">{pedido.estado}</span>
                                    </div>
                                    <div>
                                        <strong>€{pedido.total.toFixed(2)}</strong>
                                        <button
                                            className="btn btn-outline-danger btn-sm ms-3"
                                            onClick={() => cancelarPedido(pedido.id)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                                <ul className="list-unstyled mb-0">
                                    {pedido.items.map(item => (
                                        <li key={item.id} className="d-flex align-items-center gap-2 mb-1">
                                            {item.imagen && (
                                                <img src={item.imagen} alt={item.titulo} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                                            )}
                                            <span>{item.titulo}</span>
                                            {item.talla && <span className="text-muted">({item.talla})</span>}
                                            <span className="ms-auto">x{item.cantidad} — €{(item.precio * item.cantidad).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
