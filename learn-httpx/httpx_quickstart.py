import httpx

# Simple API
r = httpx.get('https://httpbin.org/get')

r = httpx.post('https://httpbin.org/post', data={'key': 'value'})
r = httpx.put('https://httpbin.org/put', data={'key': 'value'})
r = httpx.delete('https://httpbin.org/delete')
r = httpx.head('https://httpbin.org/get')
r = httpx.options('https://httpbin.org/get')

#cPass parameters:
params = {'key1': 'value1', 'key2': 'value'}
r = httpx.get('https://httpbin.org/get', params=params)

# Custom headers
headers = {'user-agent': 'my-app/0.01'}
r = httpx.get('https://httpbin.org/headers', headers=headers)

# Send JSON encoded data
data = {'integer': 1503, 'boolean': True, 'list': ['a', 'b', 'c']}
r = httpx.post('https://httpbin.org/post', json=data)

# Cookies
r = httpx.get('https://httpbin.org/cookies/set?chocolate=chip')
print(r.cookies['chocolate'])

# Authentication
httpx.get('https://example.com', auth=('my_user', 'password123'))

# Timeout, default = 5s
httpx.get('https://github.com/', timeout=1)

