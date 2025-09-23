with open("awords.txt") as f:
    words = f.read().splitlines()
    
#print words as javascript list
with open("awords.js", "a") as f:
    print("const awords = [", file=f)
    for word in words:
    #write to words.js
        f.write(f'"{word}",\n')
    print("];", file=f)