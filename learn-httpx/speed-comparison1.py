import httpx
import requests
import time

def main_requests():
    pokemons = []
    
    for number in range(1, 151):
        pokemon_url = f'https://pokeapi.co/api/v2/pokemon/{number}'
        resp = requests.get(pokemon_url)
        pokemons.append(resp.json()['name'])
        
    # for pokemon in pokemon:
    #     print(pokemon)
    
start_time = time.time()

main_requests()

print(f"Requests: {time.time() - start_time} seconds.")



def main_httpx():
    pokemons = []
    
    for number in range(1, 151):
        pokemon_url = f'https://pokeapi.co/api/v2/pokemon/{number}'
        resp = httpx.get(pokemon_url)
        pokemons.append(resp.json()['name'])
        
    # for pokemon in pokemon:
    #     print(pokemon)
    
start_time = time.time()

main_httpx()

print(f"HTTPX: {time.time() - start_time} seconds.")

