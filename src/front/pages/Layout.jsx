import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./Login.jsx";
import { Register } from "./Registro.jsx";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useGlobalReducer } from "../store/globalReducer";
import { useEffect } from "react";
import { Home } from "./Home.jsx";
import { Catalogo } from "./Catalogo.jsx";
import { DetalleProducto } from "./DetalleProducto.jsx";
import { Carrito } from "./Carrito.jsx";
import { Perfil } from "./Perfil.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev";

const RutaProtegida = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" />;
    return children;
};

export const Layout = () => {
    const { dispatch } = useGlobalReducer();

    useEffect(() => {
        const checkUserSession = async () => {
            const token = localStorage.getItem("token");

            if (!token) return;

            try {
                const response = await fetch(`https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev/api/profile`, {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    dispatch({
                        type: "set_user",
                        payload: data.user
                    });
                    dispatch({
                        type: "cargar_carrito",
                        payload: data.cart || []
                    });

                } else {
                    localStorage.removeItem("token");
                }
            } catch (error) {
                console.error("Error conectando con el backend:", error);
            }
        };

        checkUserSession();
    }, []);

    return (
        <BrowserRouter>
            <Navbar />
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Register />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/producto/:id" element={<DetalleProducto />} />
                <Route path="/carrito" element={<RutaProtegida><Carrito /></RutaProtegida>} />
                <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
                <Route path="*" element={<h1>No encontrado</h1>} />
            </Routes>
            <Footer />
        </BrowserRouter>
    );
};

export default Layout;
