from flask import request, jsonify, Blueprint
from api.models import db, User, ItemCarrito, Pedido, ItemPedido
from flask_cors import CORS
from sqlalchemy import select
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint('api', __name__)

# ──────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────

@api.route('/register', methods=['POST'])
def register():
    email = request.json.get('email')
    password = request.json.get('password')
    nombre = request.json.get('nombre')

    if not email or not password:
        return jsonify({"msg": "Email and password required"}), 400

    existe = db.session.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()

    if existe:
        return jsonify({"msg": "Email already registered"}), 409

    user = User()
    user.create_user(email, password, nombre)

    return jsonify(user.serialize()), 201


@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if data is None:
        return jsonify({'msg': 'No JSON data provided'}), 400

    email = data.get('email')
    password = data.get('password')

    user = db.session.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()

    if user is None or not user.check_password(password):
        return jsonify({'msg': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({"token": access_token, "user": user.serialize()}), 200


# ──────────────────────────────────────────────
# PERFIL (CRUD de Usuario)
# ──────────────────────────────────────────────

@api.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({"user": user.serialize()}), 200


@api.route('/profile', methods=['PUT'])
@jwt_required()
def edit_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    data = request.get_json()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.nombre = data.get("nombre", user.nombre)
    user.email = data.get("email", user.email)
    db.session.commit()

    return jsonify({"user": user.serialize()}), 200


@api.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({"msg": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"msg": "Account deleted"}), 200


# ──────────────────────────────────────────────
# CARRITO (almacenado en BD)
# ──────────────────────────────────────────────

@api.route('/carrito', methods=['GET'])
@jwt_required()
def get_carrito():
    user_id = int(get_jwt_identity())
    items = db.session.execute(
        select(ItemCarrito).where(ItemCarrito.user_id == user_id)
    ).scalars().all()
    return jsonify([item.serialize() for item in items]), 200


@api.route('/carrito', methods=['POST'])
@jwt_required()
def add_to_carrito():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    producto_id = str(data.get('producto_id') or data.get('id', ''))
    talla = data.get('talla') or data.get('tallaSeleccionada')

    if not producto_id:
        return jsonify({"msg": "producto_id required"}), 400

    # Upsert: si ya existe el mismo producto+talla, incrementa cantidad
    item = db.session.execute(
        select(ItemCarrito).where(
            ItemCarrito.user_id == user_id,
            ItemCarrito.producto_id == producto_id,
            ItemCarrito.talla == talla
        )
    ).scalar_one_or_none()

    if item:
        item.cantidad += 1
    else:
        item = ItemCarrito(
            user_id=user_id,
            producto_id=producto_id,
            titulo=data.get('title') or data.get('titulo', ''),
            precio=data.get('price') or data.get('precio', 0),
            imagen=data.get('img') or data.get('imagen'),
            cantidad=data.get('cantidad', 1),
            talla=talla,
        )
        db.session.add(item)

    db.session.commit()
    return jsonify(item.serialize()), 201


@api.route('/carrito/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_carrito_item(item_id):
    user_id = int(get_jwt_identity())
    item = db.session.get(ItemCarrito, item_id)

    if not item or item.user_id != user_id:
        return jsonify({"msg": "Item not found"}), 404

    data = request.get_json()
    nueva_cantidad = data.get('cantidad')

    if nueva_cantidad is None or nueva_cantidad < 1:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"msg": "Item removed"}), 200

    item.cantidad = nueva_cantidad
    db.session.commit()
    return jsonify(item.serialize()), 200


@api.route('/carrito/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_carrito_item(item_id):
    user_id = int(get_jwt_identity())
    item = db.session.get(ItemCarrito, item_id)

    if not item or item.user_id != user_id:
        return jsonify({"msg": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"msg": "Item removed"}), 200


@api.route('/carrito', methods=['DELETE'])
@jwt_required()
def clear_carrito():
    user_id = int(get_jwt_identity())
    db.session.execute(
        db.delete(ItemCarrito).where(ItemCarrito.user_id == user_id)
    )
    db.session.commit()
    return jsonify({"msg": "Carrito vacíado"}), 200


# ──────────────────────────────────────────────
# PEDIDOS – CRUD completo
# ──────────────────────────────────────────────

@api.route('/pedidos', methods=['GET'])
@jwt_required()
def get_pedidos():
    user_id = int(get_jwt_identity())
    pedidos = db.session.execute(
        select(Pedido).where(Pedido.user_id == user_id).order_by(Pedido.fecha.desc())
    ).scalars().all()
    return jsonify([p.serialize() for p in pedidos]), 200


@api.route('/pedidos', methods=['POST'])
@jwt_required()
def create_pedido():
    """Checkout: valida pago, crea pedido y vacía el carrito en BD."""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    items_data = data.get('items', [])
    total = data.get('total', 0)
    pago = data.get('pago', {})

    # Validación básica del pago
    if not pago.get('nombre'):
        return jsonify({"msg": "Nombre del titular requerido"}), 400
    if not pago.get('email') or '@' not in pago.get('email', ''):
        return jsonify({"msg": "Email inválido"}), 400
    tarjeta = pago.get('tarjeta', '').replace(' ', '')
    if len(tarjeta) != 16 or not tarjeta.isdigit():
        return jsonify({"msg": "Número de tarjeta inválido"}), 400
    if not items_data:
        return jsonify({"msg": "El carrito está vacío"}), 400

    # Crear pedido
    pedido = Pedido(user_id=user_id, total=total, estado="completado")
    db.session.add(pedido)
    db.session.flush()  # obtener id del pedido

    for item in items_data:
        ip = ItemPedido(
            pedido_id=pedido.id,
            producto_id=str(item.get('producto_id') or item.get('id', '')),
            titulo=item.get('titulo') or item.get('title', ''),
            precio=item.get('precio') or item.get('price', 0),
            imagen=item.get('imagen') or item.get('img'),
            cantidad=item.get('cantidad', 1),
            talla=item.get('talla') or item.get('tallaSeleccionada'),
        )
        db.session.add(ip)

    # Vaciar carrito en BD
    db.session.execute(
        db.delete(ItemCarrito).where(ItemCarrito.user_id == user_id)
    )

    db.session.commit()
    return jsonify(pedido.serialize()), 201


@api.route('/pedidos/<int:pedido_id>', methods=['GET'])
@jwt_required()
def get_pedido(pedido_id):
    user_id = int(get_jwt_identity())
    pedido = db.session.get(Pedido, pedido_id)

    if not pedido or pedido.user_id != user_id:
        return jsonify({"msg": "Pedido not found"}), 404

    return jsonify(pedido.serialize()), 200


@api.route('/pedidos/<int:pedido_id>', methods=['PUT'])
@jwt_required()
def update_pedido(pedido_id):
    user_id = int(get_jwt_identity())
    pedido = db.session.get(Pedido, pedido_id)

    if not pedido or pedido.user_id != user_id:
        return jsonify({"msg": "Pedido not found"}), 404

    data = request.get_json()
    if "estado" in data:
        pedido.estado = data["estado"]

    db.session.commit()
    return jsonify(pedido.serialize()), 200


@api.route('/pedidos/<int:pedido_id>', methods=['DELETE'])
@jwt_required()
def delete_pedido(pedido_id):
    user_id = int(get_jwt_identity())
    pedido = db.session.get(Pedido, pedido_id)

    if not pedido or pedido.user_id != user_id:
        return jsonify({"msg": "Pedido not found"}), 404

    db.session.delete(pedido)
    db.session.commit()
    return jsonify({"msg": "Pedido cancelado"}), 200
