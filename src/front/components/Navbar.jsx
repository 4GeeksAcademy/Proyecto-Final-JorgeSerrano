import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export const Navbar = () => {
    const { store } = useGlobalReducer();
    const totalItems = store.carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);

    return (
        <nav className="nav">
            <Link to="/" className="nav__logo">MODASTYLE</Link>
            <ul className="nav__links">
                <li><Link to="/catalogo" className="nav__link">Catálogo</Link></li>
                {store.user ? (
                    <li><Link to="/perfil" className="nav__link">Perfil</Link></li>
                ) : (
                    <>
                        <li><Link to="/login" className="nav__link">Iniciar sesión</Link></li>
                        <li><Link to="/registro" className="nav__link">Registro</Link></li>
                    </>
                )}
                <li>
                    <Link to="/carrito" className="nav__cart">
                        🛒
                        {totalItems > 0 && (
                            <span className="nav__cart-count">{totalItems}</span>
                        )}
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;