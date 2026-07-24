# LA Plus Desktop

The Windows installer deliberately does **not** include a case database or the
54 GB asset index. Configure the desktop client with one of these options:

1. Set the `LA_PLUS_DATABASE_PATH` environment variable to an approved local
   read-only SQLite index; or
2. Create `%APPDATA%\\LA Plus\\la-plus-desktop.json`:

```json
{ "databasePath": "D:\\LostAssets\\data.sqlite" }
```

The app starts its local API on `127.0.0.1:3210` and confirms SQLite health
before showing the workspace. For a team deployment, point agents at a secured
central API instead of distributing the index to every workstation.
