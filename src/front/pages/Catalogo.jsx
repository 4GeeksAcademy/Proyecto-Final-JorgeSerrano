import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

const API_URL = "https://devsapihub.com/api-ecommerce";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export const Catalogo = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("Todos");
    const { dispatch } = useGlobalReducer();

    useEffect(() => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                setProductos(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error:", err);
                setLoading(false);
            });
    }, []);

    const estilos = ["Todos", ...new Set(productos.map(p => p.style))];

    const productosFiltrados = filtro === "Todos"
        ? productos
        : productos.filter(p => p.style === filtro);

    const handleQuickAdd = (e, producto) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: "agregar_al_carrito", payload: producto });
        const token = localStorage.getItem("token");
        if (token) {
            fetch(`${BACKEND_URL}/api/carrito`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify(producto),
            }).catch(() => {});
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner"></div>
                <span className="loading__text">Cargando catálogo</span>
            </div>
        );
    }

    return (
        <section className="section">
            <div className="section__header">
                <h2 className="section__title">Catálogo</h2>
                <span className="section__link">{productosFiltrados.length} productos</span>
            </div>

            <div className="filters">
                {estilos.map(estilo => (
                    <button
                        key={estilo}
                        className={`filters__btn ${filtro === estilo ? "filters__btn--active" : ""}`}
                        onClick={() => setFiltro(estilo)}
                    >
                        {estilo}
                    </button>
                ))}
            </div>

            <div className="product-grid">
                {productosFiltrados.map(product => (
                    <Link to={`/producto/${product.id}`} className="product-card" key={product.id}>
                        <div className="product-card__img-wrapper">
                            {product.isFreeShipping && (
                                <span className="product-card__badge">Envío gratis</span>
                            )}
                            <img
                                src={product.img}
                                alt={product.title}
                                className="product-card__img"/>
                            <button
                                className="product-card__quick-add"
                                onClick={(e) => handleQuickAdd(e, product)}>
                                Añadir al carrito
                            </button>
                        </div>
                        <div className="product-card__info">
                            <p className="product-card__style">{product.style}</p>
                            <h3 className="product-card__title">{product.title}</h3>
                            <p className="product-card__price">
                                €{product.price.toFixed(2)}</p>
                            {product.installments > 0 && (
                                <p className="product-card__installments">
                                    o {product.installments}x de €{(product.price / product.installments).toFixed(2)}</p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default Catalogo;