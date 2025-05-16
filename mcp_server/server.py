from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import requests

load_dotenv()

app = Flask(__name__)

@app.route("/weather", methods=["POST"])
def get_weather():
    city = request.json.get("city")
    api_key = os.getenv("OPENWEATHER_API_KEY")
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    response = requests.get(url)
    return jsonify(response.json())

@app.route("/currency", methods=["POST"])
def convert_currency():
    data = request.json
    from_currency = data.get("from")
    to_currency = data.get("to")
    amount = data.get("amount")
    api_key = os.getenv("EXCHANGE_API_KEY")
    url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/{from_currency}/{to_currency}/{amount}"
    response = requests.get(url)
    return jsonify(response.json())
