import os
import json
import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("TMDB_TOKEN")
headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}

archivo_excel = "datos/marvel_db.xlsx"
archivo_json = "datos/marvel.json"

# Cargar caché existente del JSON para no repetir llamadas
cache_existente = {}
if os.path.exists(archivo_json):
    try:
        with open(archivo_json, "r", encoding="utf-8") as f:
            datos_previos = json.load(f)
            for p in datos_previos:
                if p.get("id_tmdb"):
                    cache_existente[p["id_tmdb"]] = p
    except Exception:
        pass

df = pd.read_excel(archivo_excel)
registros = df.to_dict(orient="records")
peliculas = []

for fila in registros:
    limpio = {
        k: (
            None
            if pd.isna(v)
            else (int(v) if isinstance(v, float) and v.is_integer() else v)
        )
        for k, v in fila.items()
    }

    tmdb_id = limpio.get("id_tmdb")

    pelicula = {
        "id_tmdb": int(tmdb_id) if tmdb_id else None,
        "titulo": limpio.get("titulo"),
        "tipo": limpio.get("tipo"),
        "universo": limpio.get("universo"),
        "orden_cronologico": limpio.get("orden_cronologico"),
        "fase": limpio.get("fase"),
        "saga": limpio.get("saga"),
    }

    if tmdb_id:
        tmdb_id = int(tmdb_id)
        # Si ya lo teníamos guardado con póster, lo reutilizamos
        if tmdb_id in cache_existente and cache_existente[tmdb_id].get("poster"):
            prev = cache_existente[tmdb_id]
            pelicula["fecha_estreno"] = prev.get("fecha_estreno")
            pelicula["poster"] = prev.get("poster")
            pelicula["sinopsis"] = prev.get("sinopsis")
            pelicula["puntuacion"] = prev.get("puntuacion")
            pelicula["duracion"] = prev.get("duracion")
        else:
            tipo = limpio.get("tipo")
            url = (
                f"https://api.themoviedb.org/3/movie/{tmdb_id}"
                if tipo == "Película"
                else f"https://api.themoviedb.org/3/tv/{tmdb_id}"
            )
            params = {"language": "es-ES"}

            try:
                print(
                    f"🔄 Consultando TMDB para: {limpio.get('titulo')} (ID: {tmdb_id})..."
                )
                respuesta = requests.get(url, headers=headers, params=params)
                if respuesta.status_code == 200:
                    datos_tmdb = respuesta.json()
                    pelicula["fecha_estreno"] = datos_tmdb.get(
                        "release_date"
                    ) or datos_tmdb.get("first_air_date")
                    pelicula["poster"] = datos_tmdb.get("poster_path")
                    pelicula["sinopsis"] = datos_tmdb.get("overview")
                    pelicula["puntuacion"] = datos_tmdb.get("vote_average")
                    pelicula["duracion"] = datos_tmdb.get("runtime") or (
                        datos_tmdb.get("episode_run_time", [None])[0]
                        if datos_tmdb.get("episode_run_time")
                        else None
                    )
                else:
                    print(
                        f"⚠️ Error TMDB {respuesta.status_code} en {limpio.get('titulo')}"
                    )
            except Exception as e:
                print(f"⚠️ Error de conexión: {e}")

    peliculas.append(pelicula)

with open(archivo_json, "w", encoding="utf-8") as archivo:
    json.dump(peliculas, archivo, ensure_ascii=False, indent=4)

print("✅ marvel.json actualizado al instante.")
