import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("TMDB_TOKEN")

headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}

# Probamos con Iron Man
tmdb_id = 1726

url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"

params = {"language": "es-ES"}

respuesta = requests.get(url, headers=headers, params=params)

if respuesta.status_code == 200:

    pelicula = respuesta.json()

    print("Título:", pelicula["title"])
    print("Fecha de estreno:", pelicula["release_date"])
    print("Duración:", pelicula["runtime"], "minutos")
    print("Puntuación:", pelicula["vote_average"])
    print("Sinopsis:", pelicula["overview"])

else:

    print("Error:", respuesta.status_code)
    print(respuesta.text)
