from flask import request, jsonify, Blueprint
from api.models import db, User
from flask_cors import CORS
from sqlalchemy import select
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint('api', __name__)

@api.route('/register', methods=['POST'])
def register():
    email = request.json.get('email')
    password = request.json.get('password')
    nombre = request.json.get('nombre')

    if not email or not password:
        return jsonify({"msg": "Email and password required"}), 400

    # Comprobar si ya existe
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