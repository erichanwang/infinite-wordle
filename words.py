with open("words.txt") as f:
    words = f.read().splitlines()
    
#print words as javascript list
with open("words.js", "a") as f:
    for word in words:
    #write to words.js
        f.write(f'"{word}",\n')