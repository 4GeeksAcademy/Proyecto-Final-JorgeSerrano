from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Float, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True)

    carrito: Mapped[list["ItemCarrito"]] = relationship("ItemCarrito", backref="user", cascade="all, delete-orphan")
    pedidos: Mapped[list["Pedido"]] = relationship("Pedido", backref="user", cascade="all, delete-orphan")

    def create_user(self, email, password, nombre=None):
        self.email = email
        self.password = bcrypt.generate_password_hash(password).decode("utf-8")
        self.nombre = nombre
        self.is_active = True
        db.session.add(self)
        db.session.commit()

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "nombre": self.nombre,
        }


class ItemCarrito(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    producto_id: Mapped[str] = mapped_column(String(50), nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    precio: Mapped[float] = mapped_column(Float, nullable=False)
    imagen: Mapped[str] = mapped_column(String(500), nullable=True)
    cantidad: Mapped[int] = mapped_column(Integer, default=1)
    talla: Mapped[str] = mapped_column(String(20), nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "producto_id": self.producto_id,
            "titulo": self.titulo,
            "precio": self.precio,
            "imagen": self.imagen,
            "cantidad": self.cantidad,
            "talla": self.talla,
        }


class Pedido(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    estado: Mapped[str] = mapped_column(String(50), default="completado")
    items: Mapped[list["ItemPedido"]] = relationship("ItemPedido", backref="pedido", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "fecha": self.fecha.isoformat(),
            "total": self.total,
            "estado": self.estado,
            "items": [item.serialize() for item in self.items],
        }


class ItemPedido(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedido.id"), nullable=False)
    producto_id: Mapped[str] = mapped_column(String(50), nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    precio: Mapped[float] = mapped_column(Float, nullable=False)
    imagen: Mapped[str] = mapped_column(String(500), nullable=True)
    cantidad: Mapped[int] = mapped_column(Integer, default=1)
    talla: Mapped[str] = mapped_column(String(20), nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "producto_id": self.producto_id,
            "titulo": self.titulo,
            "precio": self.precio,
            "imagen": self.imagen,
            "cantidad": self.cantidad,
            "talla": self.talla,
        }