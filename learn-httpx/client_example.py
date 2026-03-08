# httpx.Client() <=> requests.Session()
import httpx

with httpx.Client() as client:
    r = client.get('httpx://example.com')

# Client methods accept the same arguments as httpx.get(), httpx.post(), etc
with httpx.Client() as client:
    headers = {'X-Custom': 'value'}
    r = client.get('https://httpbin.org/get', headers=headers)
    # client.post(...)

print(r.status_code, r.json())

# Sharing configuration across requests
url = 'http://httpbin,org/headers'
headers = {'User-Agent': 'my-app/0.01'}

with httpx.Client(headers=headers) as client:
    r = client.get(url)
    
    print(r.json()['headers']['User-Agent'])