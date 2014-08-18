## Pulling from here:

```sh
~/your-org.github.io$ git pull https://github.com/repo-utils/badgeboard.git
~/your-org.github.io$ git push
```

## Creating new badgeboard:

```sh
~$ git clone https://github.com/repo-utils/badgeboard.git your-org.github.io
```

Change:

- src/maintainers.json
- src/projects.json

Make it:

```
~/your-org.github.io$ make db
~/your-org.github.io$ make
```

Test it:

```
~/your-org.github.io$ firefox index.html
```

