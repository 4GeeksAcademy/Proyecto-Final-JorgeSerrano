import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://silver-trout-69pp5579q67qh4jqv-3001.app.github.dev";

export const Layout = () => {
    const { dispatch } = useGlobalReducer();

    useEffect(() => {
        const checkUserSession = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await fetch(`${BACKEND_URL}/api/profile`, {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    dispatch({ type: "set_user", payload: data.user });
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
        <>
            <Navbar />
            <ScrollToTop />
            <Outlet />
            <Footer />
        </>
    );
};

export default Layout;