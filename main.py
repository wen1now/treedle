"""
valid_secrets_url = "https://raw.githubusercontent.com/alex1770/wordle/main/wordlist_nyt20220830_hidden"
valid_guesses_url = "https://raw.githubusercontent.com/alex1770/wordle/main/wordlist_nyt20220830_all"

import requests, json
## totally not chatgpt or anything
def get_words(url):
    # Send a GET request to fetch the raw content
    response = requests.get(url)

    # Check if request was successful
    if response.status_code == 200:
        # Split the response content by lines
        lines = response.text.strip().split('\n')
        return lines
                
    else:
        print('Failed to retrieve the content. Status code:', response.status_code)

valid_guesses = get_words(valid_guesses_url)
valid_secrets = get_words(valid_secrets_url)

with open(valid_guesses_path, 'w') as file:
    json.dump(valid_guesses, file)

with open(valid_secrets_path, 'w') as file:
    json.dump(valid_secrets, file)

"""
import json, gzip, base64

valid_guesses_path = "answers.txt"
valid_secrets_path = "secrets.txt"

with open(valid_guesses_path, 'r') as file:
    valid_guesses = json.load(file)

with open(valid_secrets_path, 'r') as file:
    valid_secrets = json.load(file)

valid_guesses = sorted(set(valid_guesses) - set(valid_secrets))

Ls = len(valid_secrets)
Lg = len(valid_guesses)
chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM"
C = len(chars)

d = {}

for i in range(Ls//C + 1):
    for j in range(C):
        if (z := i*C + j) < Ls:
            d[valid_secrets[z]] = chars[i] + chars[j]

for i in range(Ls//C, C):
    for j in range(C):
        for k in range(C):
            if (z := (i - Ls//C)*C*C + j*C + k) < Lg:
                d[valid_guesses[z]] = chars[i] + chars[j] + chars[k]

S = ""
for k in d:
    S += k + d[k] + ","

"""
with open("dict.txt", 'w') as file:
    json.dump(S, file)
"""

def diff(target, guess):
    letters = {}
    g = z = 0
    for i in range(5):
        if target[i] != guess[i]:
            letters[target[i]] = letters.get(target[i], 0) + 1
        else:
            g += 1 << i

    for i in range(5):
        if 1 << i & g:
            continue
        if letters.get(guess[i]):
            z += 3 ** i
            letters[guess[i]] -= 1
        else:
            z += 3 ** i * 2

    return z


def solutions(words, target):
    c = [diff(target, word) for word in words]
    a = []
    for x in valid_secrets:
        d = [diff(x, word) for word in words]
        if d == c: a.append(x)
    return a
