import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev";

export const Perfil = () => {
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { state, dispatch } = useGlobalReducer();

    const token = localStorage.getItem("token");

    useEffect(() => {
        const cargarPerfil = async () => {
            try {
                const response = await fetch(`https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev/api/profile`, {
                    headers: { "Authorization": "Bearer " + token }
                });
                const data = await response.json();

                if (response.ok) {
                    setNombre(data.user.nombre);
                    setEmail(data.user.email);
                } else {
                    navigate("/login");
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            }
        };

        cargarPerfil();
    }, []);
    
    const editarPerfil = async () => {
        setError("");
        setMensaje("");

        try {
            const response = await fetch(`https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ nombre, email })
            });

            const data = await response.json();

            if (response.ok) {
                setMensaje("Perfil actualizado correctamente");
                dispatch({ type: "set_user", payload: data.user });
            } else {
                setError(data.msg || "Error al actualizar perfil");
            }
        } catch (error) {
            setError("No se pudo conectar con el servidor");
        }
    };  

    const eliminarCuenta = async () => {
        const confirmar = window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.");

        if (!confirmar) return;

        try {
            const response = await fetch(`https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev/api/profile`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            
            if (response.ok) { 
                localStorage.removeItem("token");
                dispatch({ type: "set_user", payload: null });
                dispatch({ type: "cargar_carrito", payload: [] });
                navigate("/registro");
            } else {
                setError("Error al eliminar cuenta");
            }
        } catch (error) {
            setError("No se pudo conectar con el servidor");
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
                    Guardar cambios</button>
                <button onClick={eliminarCuenta} className="btn btn-danger">
                    Eliminar cuenta</button>
            </div>
        </div>
    ); 
};