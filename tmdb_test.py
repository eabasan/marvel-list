import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("TMDB_TOKEN")

url = "https://api.themoviedb.org/3/movie/1726"

headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}

respuesta = requests.get(url, headers=headers)

print("Código:", respuesta.status_code)

if respuesta.status_code == 200:
    datos = respuesta.json()

    print("Título:", datos["title"])
    print("Fecha de estreno:", datos["release_date"])
else:
    print("Error:")
    print(respuesta.text)
