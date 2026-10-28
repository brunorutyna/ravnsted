# Imagen on Vertex AI via the service account (self-signed JWT; the OAuth token endpoint is blocked here).
import json, time, jwt, base64, urllib.request, urllib.error, sys, os
KEY = os.environ.get('RAVNSTED_KEY') or sys.exit('Set RAVNSTED_KEY to the service-account JSON (never commit it).')
HOST = 'https://us-central1-aiplatform.googleapis.com'
def token(aud):
    k = json.load(open(KEY)); now = int(time.time())
    return jwt.encode({'iss': k['client_email'], 'sub': k['client_email'], 'aud': aud, 'iat': now, 'exp': now + 3600}, k['private_key'], algorithm='RS256', headers={'kid': k['private_key_id']})
def call(path, body, aud=HOST + '/'):
    req = urllib.request.Request(HOST + path, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token(aud)})
    try:
        with urllib.request.urlopen(req, timeout=180) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e: return {'error': e.code, 'body': e.read().decode()[:600]}
def imagen(prompt, out, model='imagen-4.0-generate-001', aspect='1:1', n=1, neg=None):
    params = {'sampleCount': n, 'aspectRatio': aspect, 'personGeneration': 'allow_adult', 'safetySetting': 'block_only_high'}
    if neg: params['negativePrompt'] = neg
    r = call(f'/v1/projects/ravnsted/locations/us-central1/publishers/google/models/{model}:predict', {'instances': [{'prompt': prompt}], 'parameters': params})
    if 'predictions' not in r: return r
    paths = []
    for i, p in enumerate(r['predictions']):
        if 'bytesBase64Encoded' in p: path = out.replace('.png', f'_{i}.png'); open(path, 'wb').write(base64.b64decode(p['bytesBase64Encoded'])); paths.append(path)
    return paths or r

def gemini(prompt, out, model='gemini-2.5-flash-image', refs=(), aspect=None, loc='us-central1'):
    """Gemini image generation; refs are local image files used as visual references (style, character)."""
    host = HOST if loc != 'global' else 'https://aiplatform.googleapis.com'
    parts = []
    for f in refs:
        mt = 'image/png' if f.endswith('.png') else 'image/jpeg'
        parts.append({'inlineData': {'mimeType': mt, 'data': base64.b64encode(open(f, 'rb').read()).decode()}})
    parts.append({'text': prompt})
    gc = {'responseModalities': ['IMAGE', 'TEXT']}
    if aspect: gc['imageConfig'] = {'aspectRatio': aspect}
    body = {'contents': [{'role': 'user', 'parts': parts}], 'generationConfig': gc}
    req = urllib.request.Request(host + f'/v1/projects/ravnsted/locations/{loc}/publishers/google/models/{model}:generateContent', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token(host + '/')})
    try:
        with urllib.request.urlopen(req, timeout=240) as r: d = json.loads(r.read())
    except urllib.error.HTTPError as e: return {'error': e.code, 'body': e.read().decode()[:500]}
    for c in d.get('candidates', []):
        for p in c.get('content', {}).get('parts', []):
            if 'inlineData' in p: open(out, 'wb').write(base64.b64decode(p['inlineData']['data'])); return out
    return {'noimage': json.dumps(d)[:500]}
