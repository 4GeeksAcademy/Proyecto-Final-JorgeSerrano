import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

const API_URL = "https://devsapihub.com/api-ecommerce";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export const DetalleProducto = () => {
    const { id } = useParams();
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
    const [added, setAdded] = useState(false);
    const { dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_URL}/product/${id}`)
            .then(res => res.json())
            .then(data => {
                setProducto(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error:", err);
                setLoading(false);
            });
    }, [id]);

    const handleAddToCart = () => {
        if (!tallaSeleccionada) return;
        dispatch({
            type: "agregar_al_carrito",
            payload: { ...producto, tallaSeleccionada }
        });
        const token = localStorage.getItem("token");
        if (token) {
            fetch(`${BACKEND_URL}/api/carrito`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify({ ...producto, tallaSeleccionada }),
            }).catch(() => {});
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner"></div>
                <span className="loading__text">Cargando producto</span>
            </div>
        );
    }

    if (!producto) {
        return (
            <div className="loading">
                <span className="loading__text">Producto no encontrado</span>
            </div>
        );
    }

    return (
        <div className="detail">
            <div className="detail__gallery">
                <img src={producto.img} alt={producto.title} className="detail__img" />
            </div>
            <div className="detail__info">
                <p className="detail__style">{producto.style}</p>
                <h1 className="detail__title">{producto.title}</h1>
                <p className="detail__price">
                    €{producto.price.toFixed(2)}
                </p>
                {producto.installments > 0 && (
                    <p className="detail__installments">
                        o {producto.installments}x de €{(producto.price / producto.installments).toFixed(2)} sin intereses
                    </p>
                )}
                {producto.isFreeShipping && (
                    <div className="detail__shipping">
                        ✓ Envío gratis
                    </div>
                )}
                <p className="detail__desc">{producto.description}</p>

                <p className="detail__sizes-label">Talla</p>
                <div className="detail__sizes">
                    {producto.sizeList.map(talla => (
                        <button
                            key={talla}
                            className={`detail__size ${tallaSeleccionada === talla ? "detail__size--selected" : ""}`}
                            onClick={() => setTallaSeleccionada(talla)}
                        >
                            {talla}
                        </button>
                    ))}
                </div>

                <button
                    className="detail__add-btn"
                    onClick={handleAddToCart}
                    disabled={!tallaSeleccionada}
                    style={{ opacity: tallaSeleccionada ? 1 : 0.4 }}
                >
                    {added ? "✓ Añadido al carrito" : tallaSeleccionada ? "Añadir al carrito" : "Selecciona una talla"}
                </button>
            </div>
        </div>
    );
};

export default DetalleProducto;