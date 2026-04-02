import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalReducer } from "../hooks/useGlobalReducer";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { dispatch } = useGlobalReducer();

    const login = async () => {
        setError("");

        if (!email || !password) {
            setError("Email y contraseña son obligatorios");
            return;
        }

        try {
            const response = await fetch(`https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev/api/login`, {
                method: "POST",
                body: JSON.stringify({ email, password }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                dispatch({ type: "set_user", payload: data.user });
                navigate("/catalogo");
            } else {
                setError(data.msg || "Credenciales incorrectas");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            setError("No se pudo conectar con el servidor");
        }
    };

    return (
        <div className="home-container">
            <div className="text-center mt-5">
                <div className="container-fluid">
                    <h2>Inicia sesión</h2>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="mb-3">
                        <label htmlFor="login-email" className="form-label">Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            className="form-control"
                            id="login-email"
                            placeholder="name@example.com"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="login-password" className="form-label">Contraseña</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            className="form-control"
                            id="login-password"
                            placeholder="Tu contraseña"
                        />
                    </div>
                </div>
                <button className="btn btn-primary" onClick={login}>Iniciar sesión</button>
            </div>
        </div>
    );
};

export default Login;