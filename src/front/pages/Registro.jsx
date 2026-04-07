import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const register = async () => {
        setError("");

        if (!email || !password || !nombre) {
            setError("Todos los campos son obligatorios");
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/register`, {
                method: "POST",
                body: JSON.stringify({ email, password, nombre }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (response.ok) {
                navigate("/login");
            } else {
                setError(data.msg || "Error al registrar usuario");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            setError("No se pudo conectar con el servidor");
        }
    };

    return (
        <div className="home-container">
            <div className="text-center mt-5">
                <h2>Crea tu cuenta</h2>
                <div className="container-fluid">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="mb-3">
                        <label htmlFor="register-nombre" className="form-label">Nombre</label>
                        <input
                            onChange={(e) => setNombre(e.target.value)}
                            value={nombre}
                            type="text"
                            className="form-control"
                            id="register-nombre"
                            placeholder="Tu nombre"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="register-email" className="form-label">Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            className="form-control"
                            id="register-email"
                            placeholder="name@ejemplo.com"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="register-password" className="form-label">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            className="form-control"
                            id="register-password"
                            placeholder="Crea una contraseña"
                        />
                    </div>
                    <button className="btn btn-success" onClick={register}>Registrarse</button>
                </div>
            </div>
        </div>
    );
};

export default Register;
