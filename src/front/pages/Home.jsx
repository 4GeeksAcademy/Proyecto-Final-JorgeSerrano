import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_URL = "https://devsapihub.com/api-ecommerce";

export const Home = () => {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                setFeatured(data.slice(0, 4));
                setLoading(false);
            })
            .catch(err => {
                console.error("Error:", err);
                setLoading(false);
            });
    }, []);

    return (
        <>
            <section className="hero">
                <div className="hero__content">
                    <p className="hero__subtitle">Nueva colección 2026</p>
                    <h1 className="hero__title">DEFINE TU ESTILO</h1>
                    <p className="hero__desc">
                        Descubre las últimas tendencias en moda urbana. Prendas diseñadas para quienes no siguen reglas.
                    </p>
                    <Link to="/catalogo" className="hero__cta">Ver catálogo</Link>
                </div>
            </section>

            <section className="section">
                <div className="section__header">
                    <h2 className="section__title">Destacados</h2>
                    <Link to="/catalogo" className="section__link">Ver todo →</Link>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="loading__spinner"></div>
                        <span className="loading__text">Cargando</span>
                    </div>
                ) : (
                    <div className="product-grid">
                        {featured.map(product => (
                            <Link to={`/producto/${product.id}`} className="product-card" key={product.id}>
                                <div className="product-card__img-wrapper">
                                    {product.isFreeShipping && (
                                        <span className="product-card__badge">Envío gratis</span>
                                    )}
                                    <img
                                        src={product.img}
                                        alt={product.title}
                                        className="product-card__img"
                                    />
                                </div>
                                <div className="product-card__info">
                                    <p className="product-card__style">{product.style}</p>
                                    <h3 className="product-card__title">{product.title}</h3>
                                    <p className="product-card__price">
                                        {product.currency.format}{product.price.toFixed(2)}
                                    </p>
                                    {product.installments > 0 && (
                                        <p className="product-card__installments">
                                            o {product.installments}x de {product.currency.format}
                                            {(product.price / product.installments).toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};

export default Home;