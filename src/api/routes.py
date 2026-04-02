"""
This module takes care of starting the API Server,
Loading the DB and Adding the endpoints
"""

from flask import request, jsonify, Blueprint
from api.models import db, User, Visitado, Favorito, Guardado, Descartado
from flask_cors import CORS
from sqlalchemy import select
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint('api', __name__)

@api.route('/register', methods=['POST'])
def register():
    email = request.json.get('email')
    password = request.json.get('password')

    if not email or not password:
        return jsonify({"msg": "Email and password required"}), 400

    user = User()
    user.create_user(email, password)

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

    access_token = create_access_token(identity=user.email)

    return jsonify({"token": access_token}), 200