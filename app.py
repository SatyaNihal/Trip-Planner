from flask import Flask, render_template, request, jsonify, send_from_directory
from dotenv import load_dotenv
import os
import requests

load_dotenv()

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)

@app.route("/weather", methods=["POST"])
def get_weather():
    city = request.json.get("city")
    api_key = os.getenv("OPENWEATHER_API_KEY")

    if not city or not api_key:
        return jsonify({"error": "Missing city or API key"}), 400

    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}&units=metric"
    response = requests.get(url)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch weather"}), 500

    data = response.json()
    daily_forecast = []
    used_dates = set()

    for item in data["list"]:
        date = item["dt_txt"].split(" ")[0]
        if date not in used_dates:
            forecast = {
                "date": date,
                "temp": item["main"]["temp"],
                "description": item["weather"][0]["description"].title(),
                "icon": item["weather"][0]["icon"]
            }
            daily_forecast.append(forecast)
            used_dates.add(date)
        if len(daily_forecast) >= 5:
            break

    return jsonify({"city": city, "forecast": daily_forecast})

@app.route("/currency", methods=["POST"])
def convert_currency():
    data = request.json
    from_currency = data.get("from")
    to_currency = data.get("to")
    api_key = os.getenv("EXCHANGE_API_KEY")

    if not from_currency or not to_currency or not api_key:
        return jsonify({"error": "Missing currency info or API key"}), 400

    url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/{from_currency}/{to_currency}"
    response = requests.get(url)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch exchange rate"}), 500

    data = response.json()
    rate = data.get("conversion_rate")
    time = data.get("time_last_update_utc")

    return jsonify({
        "rate": rate,
        "from": from_currency,
        "to": to_currency,
        "time": time
    })

if __name__ == "__main__":
    app.run(debug=True)
