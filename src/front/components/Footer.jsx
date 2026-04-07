import { Link } from "react-router-dom";

export const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__grid">
                <div>
                    <div className="footer__brand">MODASTYLE</div>
                    <p className="footer__desc">
                        Moda con personalidad. Estilo que habla por ti.
                    </p>
                </div>
                <div className="footer__col">
                    <div className="footer__col-title">Tienda</div>
                    <Link to="/catalogo">Catálogo</Link>
                    <Link to="/catalogo">Novedades</Link>
                    <Link to="/catalogo">Ofertas</Link>
                </div>
                <div className="footer__col">
                    <div className="footer__col-title">Cuenta</div>
                    <Link to="/login">Iniciar sesión</Link>
                    <Link to="/registro">Crear cuenta</Link>
                    <Link to="/perfil">Mi perfil</Link>
                </div>
                <div className="footer__col">
                    <div className="footer__col-title">Ayuda</div>
                    <a href="#">Envíos</a>
                    <a href="#">Devoluciones</a>
                    <a href="#">Contacto</a>
                </div>
            </div>
            <div className="footer__bottom">
                © 2026 MODASTYLE — Proyecto E-commerce - Desarrollado por Jorge Serrano
            </div>
        </footer>
    );
};

export default Footer;